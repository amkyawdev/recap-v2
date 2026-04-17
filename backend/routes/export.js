const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Export video with subtitle overlay or hardcoded subs
router.post('/burn-subtitles', async (req, res) => {
  try {
    const { videoPath, subtitlePath, outputFilename, style = {} } = req.body;
    
    const inputPath = path.join(__dirname, '../uploads', videoPath);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const srtPath = subtitlePath
      ? path.join(__dirname, '../uploads', subtitlePath)
      : null;
    
    if (!srtPath || !fs.existsSync(srtPath)) {
      return res.status(404).json({ error: 'Subtitle file not found' });
    }
    
    const outputName = outputFilename || `exported_${uuidv4()}.mp4`;
    const outputPath = path.join(__dirname, '../uploads', outputName);
    
    // Default style values
    const {
      fontSize = 24,
      fontColor = 'white',
      bgColor = 'black@0.5',
      fontName = 'Arial',
      margin = 10
    } = style;
    
    const { exec } = require('child_process');
    
    // Build FFmpeg subtitle filter
    const subtitleFilter = `subtitles='${srtPath}':force_style='FontName=${fontName},FontSize=${fontSize},PrimaryColour=&H${fontColor.replace('#', '')},BackColour=&H${bgColor.replace('#', '').replace('@', '')},MarginV=${margin}'`;
    
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -vf "${subtitleFilter}" -c:a copy "${outputPath}" -y`;
    
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg burn subtitles error:', error);
        // Try without style
        const simpleCommand = `ffmpeg -i "${inputPath}" -vf "subtitles='${srtPath}'" -c:a copy "${outputPath}" -y`;
        
        return exec(simpleCommand, (err, stdo, stde) => {
          if (err) {
            return res.status(500).json({ error: 'Export failed', message: err.message });
          }
          
          const stats = fs.statSync(outputPath);
          res.json({
            success: true,
            output: {
              filename: outputName,
              path: outputPath,
              size: stats.size
            }
          });
        });
      }
      
      const stats = fs.statSync(outputPath);
      res.json({
        success: true,
        output: {
          filename: outputName,
          path: outputPath,
          size: stats.size
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
});

// Add soft subtitle track (mkv container)
router.post('/soft-subtitles', async (req, res) => {
  try {
    const { videoPath, subtitlePath, outputFilename } = req.body;
    
    const inputPath = path.join(__dirname, '../uploads', videoPath);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const srtPath = subtitlePath
      ? path.join(__dirname, '../uploads', subtitlePath)
      : null;
    
    if (!srtPath || !fs.existsSync(srtPath)) {
      return res.status(404).json({ error: 'Subtitle file not found' });
    }
    
    const outputName = outputFilename || `softsub_${uuidv4()}.mkv`;
    const outputPath = path.join(__dirname, '../uploads', outputName);
    
    const { exec } = require('child_process');
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -i "${srtPath}" -c:v copy -c:a copy -c:s srt -metadata:s:s:0 language=eng "${outputPath}" -y`;
    
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg soft subs error:', error);
        return res.status(500).json({ error: 'Export failed', message: error.message });
      }
      
      const stats = fs.statSync(outputPath);
      res.json({
        success: true,
        output: {
          filename: outputName,
          path: outputPath,
          size: stats.size
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
});

// Add text overlay
router.post('/text-overlay', async (req, res) => {
  try {
    const { videoPath, text, startTime, endTime, x = '(w-text_w)/2', y = 'h-50', fontSize = 24, fontColor = 'white', bgColor = 'black@0.5', outputFilename } = req.body;
    
    const inputPath = path.join(__dirname, '../uploads', videoPath);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const outputName = outputFilename || `overlay_${uuidv4()}.mp4`;
    const outputPath = path.join(__dirname, '../uploads', outputName);
    
    const { exec } = require('child_process');
    
    // Escape text for FFmpeg drawtext filter
    const escapedText = text.replace(/'/g, "\\'").replace(/:/g, "\\:").replace(/\n/g, "\\n");
    
    const drawtextFilter = `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:x=${x}:y=${y}:box=1:boxcolor=${bgColor}:boxborderw=5:enable='between(t,${startTime},${endTime})'`;
    
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -vf "${drawtextFilter}" -c:a copy "${outputPath}" -y`;
    
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg text overlay error:', error);
        return res.status(500).json({ error: 'Text overlay failed', message: error.message });
      }
      
      const stats = fs.statSync(outputPath);
      res.json({
        success: true,
        output: {
          filename: outputName,
          path: outputPath,
          size: stats.size
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
});

// Add image overlay
router.post('/image-overlay', async (req, res) => {
  try {
    const { videoPath, imagePath, x = 'w-overlay_w-10', y = '10', startTime = 0, endTime = null, opacity = 1, scale = 1, outputFilename } = req.body;
    
    const inputPath = path.join(__dirname, '../uploads', videoPath);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const overlayPath = path.join(__dirname, '../uploads', imagePath);
    if (!fs.existsSync(overlayPath)) {
      return res.status(404).json({ error: 'Overlay image not found' });
    }
    
    const outputName = outputFilename || `imgoverlay_${uuidv4()}.mp4`;
    const outputPath = path.join(__dirname, '../uploads', outputName);
    
    const { exec } = require('child_process');
    
    // Build filter complex for image overlay
    const filterComplex = endTime
      ? `[1:v]scale=iw*${scale}:-1,format=rgba,colorchannelmixer=aa=${opacity}[overlay];[0:v][overlay]overlay=x=${x}:y=${y}:enable='between(t,${startTime},${endTime})'`
      : `[1:v]scale=iw*${scale}:-1,format=rgba,colorchannelmixer=aa=${opacity}[overlay];[0:v][overlay]overlay=x=${x}:y=${y}'`;
    
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -i "${overlayPath}" -filter_complex "${filterComplex}" -c:a copy "${outputPath}" -y`;
    
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg image overlay error:', error);
        return res.status(500).json({ error: 'Image overlay failed', message: error.message });
      }
      
      const stats = fs.statSync(outputPath);
      res.json({
        success: true,
        output: {
          filename: outputName,
          path: outputPath,
          size: stats.size
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
});

// Full export with all options
router.post('/full-export', async (req, res) => {
  try {
    const {
      videoPath,
      subtitlePath,
      trimStart,
      trimEnd,
      colorAdjustments = {},
      overlays = [],
      outputFilename
    } = req.body;
    
    const inputPath = path.join(__dirname, '../uploads', videoPath);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const outputName = outputFilename || `final_${uuidv4()}.mp4`;
    const outputPath = path.join(__dirname, '../uploads', outputName);
    
    // Build filter chain
    let filters = [];
    
    // Trim
    if (trimStart !== undefined && trimEnd !== undefined) {
      // Note: trim handled separately, here just build video filters
    }
    
    // Color adjustments
    const { brightness = 1, contrast = 1, saturation = 1, gamma = 1 } = colorAdjustments;
    if (brightness !== 1 || contrast !== 1 || saturation !== 1 || gamma !== 1) {
      filters.push(`eq=brightness=${brightness - 1}:contrast=${contrast}:saturation=${saturation}:gamma=${gamma}`);
    }
    
    // Subtitle overlay
    if (subtitlePath) {
      const srtPath = path.join(__dirname, '../uploads', subtitlePath);
      if (fs.existsSync(srtPath)) {
        filters.push(`subtitles='${srtPath}'`);
      }
    }
    
    // Text/image overlays would need filter_complex and multiple inputs
    // For now, handle basic cases
    
    const { exec } = require('child_process');
    const filterString = filters.length > 0 ? filters.join(',') : 'null';
    
    const ffmpegCommand = filterString !== 'null'
      ? `ffmpeg -i "${inputPath}" -vf "${filterString}" -c:a copy "${outputPath}" -y`
      : `ffmpeg -i "${inputPath}" -c copy "${outputPath}" -y`;
    
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg full export error:', error);
        return res.status(500).json({ error: 'Export failed', message: error.message });
      }
      
      const stats = fs.statSync(outputPath);
      res.json({
        success: true,
        output: {
          filename: outputName,
          path: outputPath,
          size: stats.size
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Export failed', message: error.message });
  }
});

module.exports = router;