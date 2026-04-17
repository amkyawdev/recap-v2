const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedVideoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
    const allowedSubtitleExtensions = ['.srt', '.vtt'];
    
    const videoExt = path.extname(file.originalname).toLowerCase();
    const subtitleExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedVideoExtensions.includes(videoExt)) {
      cb(null, true);
    } else if (allowedSubtitleExtensions.includes(subtitleExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported: mp4, mov, avi, mkv, webm, srt, vtt'));
    }
  }
});

// Upload video
router.post('/video', upload.single('video'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }
    
    res.json({
      success: true,
      file: {
        id: path.parse(req.file.filename).name,
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// Upload subtitle file
router.post('/subtitle', upload.single('subtitle'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No subtitle file uploaded' });
    }
    
    res.json({
      success: true,
      file: {
        id: path.parse(req.file.filename).name,
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// Upload image overlay
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    
    res.json({
      success: true,
      file: {
        id: path.parse(req.file.filename).name,
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: req.file.path,
        size: req.file.size,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

// List uploaded files
router.get('/files', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ files: [] });
    }
    
    const files = fs.readdirSync(uploadsDir).map(filename => {
      const filePath = path.join(uploadsDir, filename);
      const stats = fs.statSync(filePath);
      
      return {
        filename,
        size: stats.size,
        created: stats.birthtime
      };
    });
    
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list files', message: error.message });
  }
});

// Delete a file
router.delete('/files/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    fs.unlinkSync(filePath);
    
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete file', message: error.message });
  }
});

module.exports = router;