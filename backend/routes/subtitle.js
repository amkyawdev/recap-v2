const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Simple SRT parser
function parseSRT(srtContent) {
  const entries = [];
  const blocks = srtContent.trim().split(/\n\n+/);
  
  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;
    
    const index = parseInt(lines[0].trim());
    const timecodeLine = lines[1].trim();
    const text = lines.slice(2).join('\n');
    
    // Parse timestamps: 00:00:01,400 --> 00:00:04,000
    const timeMatch = timecodeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
    
    if (timeMatch) {
      const startTime = (
        parseInt(timeMatch[1]) * 3600 +
        parseInt(timeMatch[2]) * 60 +
        parseInt(timeMatch[3]) +
        parseInt(timeMatch[4]) / 1000
      );
      
      const endTime = (
        parseInt(timeMatch[5]) * 3600 +
        parseInt(timeMatch[6]) * 60 +
        parseInt(timeMatch[7]) +
        parseInt(timeMatch[8]) / 1000
      );
      
      entries.push({
        index,
        startTime,
        endTime,
        text,
        startTimeFormatted: timecodeLine.split(' --> ')[0],
        endTimeFormatted: timecodeLine.split(' --> ')[1]
      });
    }
  }
  
  return entries;
}

// Convert seconds to SRT timestamp format
function formatTimestamp(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

// Convert entries to SRT format
function toSRT(entries) {
  return entries.map((entry, index) => {
    const startFormatted = formatTimestamp(entry.startTime);
    const endFormatted = formatTimestamp(entry.endTime);
    return `${index + 1}\n${startFormatted} --> ${endFormatted}\n${entry.text}\n`;
  }).join('\n');
}

// Get embedded subtitles from video
router.get('/extract/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const { exec } = require('child_process');
    // Extract subtitle streams
    const ffprobeCommand = `ffprobe -v quiet -print_format json -show_streams -select_streams s "${filePath}"`;
    
    exec(ffprobeCommand, (error, stdout, stderr) => {
      if (error) {
        return res.json({ subtitles: [], message: 'No embedded subtitles found' });
      }
      
      try {
        const data = JSON.parse(stdout);
        const streams = data.streams || [];
        
        const subtitles = streams.map((stream, index) => ({
          index,
          codecName: stream.codec_name,
          codecLongName: stream.codec_long_name,
          language: stream.tags?.language || 'unknown',
          title: stream.tags?.title || `Subtitle ${index + 1}`
        }));
        
        res.json({ subtitles });
      } catch (parseError) {
        res.json({ subtitles: [], message: 'No embedded subtitles found' });
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Extraction failed', message: error.message });
  }
});

// Extract and convert embedded subtitles to SRT
router.post('/extract-srt', (req, res) => {
  try {
    const { videoFilename, streamIndex = 0 } = req.body;
    
    if (!videoFilename) {
      return res.status(400).json({ error: 'videoFilename is required' });
    }
    
    const videoPath = path.join(__dirname, '../uploads', videoFilename);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const outputFilename = `extracted_${uuidv4()}.srt`;
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    
    const { exec } = require('child_process');
    const ffmpegCommand = `ffmpeg -i "${videoPath}" -map 0:s:${streamIndex} "${outputPath}" -y`;
    
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        // Try with different codec
        const altCommand = `ffmpeg -i "${videoPath}" -c:s srt "${outputPath}" -y`;
        
        return exec(altCommand, (err, stdo, stde) => {
          if (err) {
            return res.status(500).json({ error: 'Extraction failed', message: err.message || 'No subtitle streams found' });
          }
          
          const content = fs.readFileSync(outputPath, 'utf8');
          const entries = parseSRT(content);
          
          res.json({
            success: true,
            srtFilename: outputFilename,
            entries
          });
        });
      }
      
      const content = fs.readFileSync(outputPath, 'utf8');
      const entries = parseSRT(content);
      
      res.json({
        success: true,
        srtFilename: outputFilename,
        entries
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Extraction failed', message: error.message });
  }
});

// Parse uploaded SRT file
router.post('/parse', (req, res) => {
  try {
    const { subtitlePath, content } = req.body;
    
    let srtContent;
    
    if (subtitlePath) {
      const srtPath = path.join(__dirname, '../uploads', subtitlePath);
      if (!fs.existsSync(srtPath)) {
        return res.status(404).json({ error: 'Subtitle file not found' });
      }
      srtContent = fs.readFileSync(srtPath, 'utf8');
    } else if (content) {
      srtContent = content;
    } else {
      return res.status(400).json({ error: 'subtitlePath or content is required' });
    }
    
    const entries = parseSRT(srtContent);
    
    res.json({
      success: true,
      entries,
      count: entries.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Parse failed', message: error.message });
  }
});

// Save edited SRT
router.post('/save', (req, res) => {
  try {
    const { entries, filename } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'entries array is required' });
    }
    
    const srtContent = toSRT(entries);
    const outputFilename = filename || `edited_${uuidv4()}.srt`;
    const outputPath = path.join(__dirname, '../uploads', outputFilename);
    
    fs.writeFileSync(outputPath, srtContent, 'utf8');
    
    res.json({
      success: true,
      filename: outputFilename,
      path: outputPath,
      entryCount: entries.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Save failed', message: error.message });
  }
});

// Translation using Mistral AI (8x7B model)
router.post('/translate', async (req, res) => {
  try {
    const { entries, targetLanguage = 'my', sourceLanguage = 'en' } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'entries array is required' });
    }
    
    // Get Mistral API key
    const mistralApiKey = process.env.AmkyawDev_Kay || process.env.MISTRAL_API_KEY;
    
    if (!mistralApiKey) {
      return res.status(500).json({ error: 'Mistral API key not configured' });
    }
    
    const languageNames = {
      'my': 'Myanmar',
      'en': 'English',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'th': 'Thai',
      'lo': 'Lao'
    };
    
    const targetLang = languageNames[targetLanguage] || targetLanguage;
    const sourceLang = languageNames[sourceLanguage] || sourceLanguage;
    
    // Build translation prompt
    const subtitleTexts = entries.map((e, i) => `${i + 1}. ${e.text}`).join('\n');
    
    const prompt = `Translate the following ${sourceLang} subtitles to ${targetLang}. 
Only translate the text, keep the numbering format. 
Return ONLY the translated text, no explanations:

${subtitleTexts}`;
    
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mistralApiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mistral API error:', errorData);
      throw new Error(errorData.message || 'Translation API failed');
    }
    
    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content || '';
    
    // Parse translated text back to entries
    const lines = translatedText.trim().split('\n');
    const translatedEntries = entries.map((entry, index) => {
      let text = entry.text;
      
      // Try to find matching translated line
      for (const line of lines) {
        const match = line.match(/^\d+\.\s*(.+)$/);
        if (match) {
          text = match[1].trim();
          break;
        }
      }
      
      return {
        ...entry,
        originalText: entry.text,
        text
      };
    });
    
    res.json({
      success: true,
      sourceLanguage,
      targetLanguage,
      entries: translatedEntries,
      count: translatedEntries.length,
      model: 'mistral-small-latest'
    });
  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({ error: 'Translation failed', message: error.message });
  }
});

// Merge subtitle entries
router.post('/merge', (req, res) => {
  try {
    const { entries, index1, index2 } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'entries array is required' });
    }
    
    if (index1 < 0 || index2 < 0 || index1 >= entries.length || index2 >= entries.length) {
      return res.status(400).json({ error: 'Invalid indices' });
    }
    
    const entry1 = entries[index1];
    const entry2 = entries[index2];
    
    // Merge: expand to earlier start and later end
    const merged = {
      ...entry1,
      startTime: Math.min(entry1.startTime, entry2.startTime),
      endTime: Math.max(entry1.endTime, entry2.endTime),
      text: entry1.text + '\n' + entry2.text
    };
    
    const newEntries = entries.filter((_, i) => i !== index1 && i !== index2);
    newEntries.splice(Math.min(index1, index2), 0, merged);
    
    // Reindex
    newEntries.forEach((entry, i) => {
      entry.index = i + 1;
    });
    
    res.json({
      success: true,
      entries: newEntries
    });
  } catch (error) {
    res.status(500).json({ error: 'Merge failed', message: error.message });
  }
});

// Split subtitle entry
router.post('/split', (req, res) => {
  try {
    const { entries, index, splitTime } = req.body;
    
    if (!entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'entries array is required' });
    }
    
    if (index < 0 || index >= entries.length) {
      return res.status(400).json({ error: 'Invalid index' });
    }
    
    const entry = entries[index];
    const splitAt = splitTime || (entry.startTime + entry.endTime) / 2;
    
    // Create two entries
    const entry1 = {
      ...entry,
      index: index + 1,
      endTime: splitAt
    };
    
    const entry2 = {
      ...entry,
      index: index + 2,
      startTime: splitAt
    };
    
    const newEntries = entries.filter((_, i) => i !== index);
    newEntries.splice(index, 0, entry1, entry2);
    
    // Reindex
    newEntries.forEach((e, i) => {
      e.index = i + 1;
    });
    
    res.json({
      success: true,
      entries: newEntries
    });
  } catch (error) {
    res.status(500).json({ error: 'Split failed', message: error.message });
  }
});

module.exports = router;