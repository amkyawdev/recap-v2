const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Video editing operations
router.post('/trim', async (req, res) => {
  try {
    const { videoPath, startTime, endTime, outputFilename } = req.body;
    
    if (!videoPath || startTime === undefined || endTime === undefined) {
      return res.status(400).json({ error: 'Missing required fields: videoPath, startTime, endTime' });
    }
    
    const inputPath = path.join(__dirname, '../uploads', videoPath);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const outputName = outputFilename || `trimmed_${uuidv4()}.mp4`;
    const outputPath = path.join(__dirname, '../uploads', outputName);
    
    // FFmpeg command for trimming
    const { exec } = require('child_process');
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -ss ${startTime} -to ${endTime} -c copy "${outputPath}" -y`;
    
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg trim error:', error);
        return res.status(500).json({ error: 'Trimming failed', message: error.message });
      }
      
      res.json({
        success: true,
        output: {
          filename: outputName,
          path: outputPath
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Trim operation failed', message: error.message });
  }
});

// Color adjustments
router.post('/color', async (req, res) => {
  try {
    const { videoPath, brightness = 1, contrast = 1, saturation = 1, gamma = 1, outputFilename } = req.body;
    
    const inputPath = path.join(__dirname, '../uploads', videoPath);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Video file not found' });
    }
    
    const outputName = outputFilename || `colored_${uuidv4()}.mp4`;
    const outputPath = path.join(__dirname, '../uploads', outputName);
    
    const { exec } = require('child_process');
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -vf "eq=brightness=${brightness - 1}:contrast=${contrast}:saturation=${saturation}:gamma=${gamma}" -c:a copy "${outputPath}" -y`;
    
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg color error:', error);
        return res.status(500).json({ error: 'Color adjustment failed', message: error.message });
      }
      
      res.json({
        success: true,
        output: {
          filename: outputName,
          path: outputPath
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Color operation failed', message: error.message });
  }
});

// Get video metadata
router.get('/metadata/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const { exec } = require('child_process');
    const ffprobeCommand = `ffprobe -v quiet -print_format json -show_format -show_streams "${filePath}"`;
    
    exec(ffprobeCommand, (error, stdout, stderr) => {
      if (error) {
        // Return basic info if ffprobe fails
        const stats = fs.statSync(filePath);
        return res.json({
          filename,
          size: stats.size,
          duration: null,
          streams: []
        });
      }
      
      const metadata = JSON.parse(stdout);
      res.json({
        filename,
        ...metadata
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metadata', message: error.message });
  }
});

module.exports = router;