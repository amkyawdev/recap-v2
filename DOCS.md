# Movie Recap App - Documentation

## Table of Contents

1. [Usage Guide](#usage-guide)
2. [Developer Information](#developer-information)
3. [API Reference](#api-reference)
4. [Component Architecture](#component-architecture)
5. [Troubleshooting](#troubleshooting)

---

## 📖 Usage Guide

### 1. Uploading Media

#### Video Upload

1. Navigate to the Dashboard
2. Click **Upload Video** or drag-and-drop a video file
3. Supported formats: `mp4`, `mov`, `avi`, `mkv`, `webm`
4. Maximum file size: 500MB

#### Subtitle Upload

1. Click **Upload SRT** to upload an external subtitle file
2. Alternatively, click **Auto-extract Subtitles** to extract embedded subtitles from the video

### 2. Editing Subtitles

1. Go to the **Editor** page
2. Click on any subtitle entry to seek to that timestamp
3. Double-click to edit:
   - Modify text content
   - Adjust start/end timestamps
4. Use **Split** to divide a subtitle entry at current position
5. Use **Merge** to combine two consecutive entries

### 3. Styling Subtitles

1. In the Editor, click **Style** to open the styling dialog
2. Configure:
   - **Font Size**: 12-48px
   - **Font Family**: Arial, Roboto, Montserrat, etc.
   - **Font Color**: Use color picker
   - **Background**: Color + opacity slider
3. Preview changes in real-time
4. Click **Apply** to save

### 4. Adding Overlays

1. Click **Add Overlay** in the Editor
2. Choose **Text** or **Image** overlay
3. Configure:
   - Start/end time
   - Position (9 presets)
   - Size/opacity
4. Click **Add** to apply

### 5. Timeline

1. Use the timeline to:
   - Visualize subtitle placement
   - Set **In** point (trim start)
   - Set **Out** point (trim end)
2. Click on timeline to seek
3. Subtitle entries shown as colored bars

### 6. Exporting

1. Go to **Export** page
2. Configure:
   - **Subtitle Mode**: Soft (MKV) or Hard (burned in)
   - **Format**: MP4 or MKV
   - **Trim**: Start/end times
   - **Color Adjustments**: Brightness, contrast, saturation, gamma
3. Click **Export Video**
4. Download when complete

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| ← | Seek -5s |
| → | Seek +5s |
| ↑ | Volume + |
| ↓ | Volume - |
| M | Mute/Unmute |
| F | Fullscreen |

---

## 👨‍💻 Developer Information

**Application:** Movie Recap App - Web-based video editor with SRT subtitle support

**Developer:** Aung Myo Kyaw  
**Role:** Full Stack Developer  
**Phone:** +95 967740154  
**Email:** wayne.mm.92@gmail.com  
**Location:** Naypyidaw, Myanmar

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | Node.js, Express.js |
| Video | FFmpeg |
| Storage | localStorage (client), filesystem (server) |
| Container | Docker |

---

## 🔌 API Reference

### Upload Endpoints

```
POST /api/upload/video     - Upload video file
POST /api/upload/subtitle - Upload SRT file
POST /api/upload/image   - Upload overlay image
GET  /api/upload/files   - List files
DELETE /api/upload/files/:filename - Delete file
```

### Edit Endpoints

```
POST /api/edit/trim          - Trim video
POST /api/edit/color        - Color adjustments
GET  /api/edit/metadata/:filename - Video metadata
```

### Export Endpoints

```
POST /api/export/burn-subtitles   - Burn subtitles
POST /api/export/soft-subtitles - Soft subtitles
POST /api/export/text-overlay  - Text overlay
POST /api/export/image-overlay - Image overlay
POST /api/export/full-export   - Full export
```

### Subtitle Endpoints

```
GET  /api/subtitle/extract/:filename    - List embedded subs
POST /api/subtitle/extract-srt       - Extract to SRT
POST /api/subtitle/parse            - Parse SRT
POST /api/subtitle/save            - Save SRT
POST /api/subtitle/translate       - Translate
POST /api/subtitle/merge           - Merge entries
POST /api/subtitle/split          - Split entry
```

---

## 🧩 Component Architecture

### Frontend Components

```
src/
├── components/
│   ├── VideoPlayer.jsx      - HTML5 video with controls
│   ├── SubtitleEditor.jsx    - Subtitle list management
│   ├── SubtitleDialog.jsx   - Styling modal
│   ├── Timeline.jsx        - Visual timeline
│   ├── OverlayControls.jsx  - Overlay management
│   └── MovieUploader.jsx   - Drag-drop upload
├── pages/
│   ├── Dashboard.jsx       - Upload & quick actions
│   ├── EditorPage.jsx       - Main editor
│   └── ExportPage.jsx      - Export config
└── App.jsx               - Router & layout
```

### Backend Routes

```
backend/routes/
├── upload.js    - File uploads
├── edit.js     - Video editing
├── export.js  - Export operations
└── subtitle.js - Subtitle handling
```

---

## 🔧 Troubleshooting

### Common Issues

1. **Video not playing**
   - Check browser codec support
   - Try converting to MP4

2. **Subtitle extraction fails**
   - Verify video has embedded subtitles
   - Check FFmpeg installation

3. **Export timeout**
   - Use Docker for background processing
   - Reduce video resolution

4. **Upload fails**
   - Check file size limit (500MB)
   - Verify file format

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development
```

---

## 📄 License

MIT License

---

*Last Updated: 2026-04-17*