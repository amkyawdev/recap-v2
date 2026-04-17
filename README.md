# Movie Recap App

A production-ready full-stack video editor + subtitle workstation for editing, styling, and exporting videos with custom subtitles.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)
![React](https://img.shields.io/badge/React-18+-green.svg)

## Features

- **Video Upload**: Support for mp4, mov, avi, mkv, webm formats
- **Subtitle Management**: Upload external SRT files or auto-extract embedded subtitles
- **Subtitle Editor**: Edit text, timestamps, split/merge entries, click-to-seek
- **Styling Dialog**: Customize font size, color, background, opacity, font family
- **Timeline**: Visual timeline with in/out points, subtitle markers
- **Overlay System**: Add text and image overlays with position controls
- **Video Editing**: Trim, color adjustments (brightness, contrast, saturation, gamma)
- **Export**: Soft subtitles (MKV track) or hard subtitles (burned in)
- **Translation**: Translate subtitles via LibreTranslate API
- **Responsive Design**: Mobile-first responsive layout

## Quick Start

### Prerequisites

- Node.js 20+
- FFmpeg (must be available in PATH)
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd movie-recap-app
   ```

2. **Install dependencies**
   ```bash
   # Root dependencies
   npm install

   # Backend dependencies
   cd backend && npm install

   # Frontend dependencies
   cd ../frontend && npm install
   ```

3. **Copy environment file**
   ```bash
   cp .env.example .env
   ```

4. **Start development servers**
   ```bash
   # From root (starts both backend and frontend)
   npm run dev

   # Or separately:
   cd backend && npm run dev    # http://localhost:3001
   cd frontend && npm run dev   # http://localhost:5173
   ```

## 🚀 How to Run Locally

### Option 1: Docker (Recommended - Full Features)

```bash
# Start all services (Backend + Frontend + Database + Redis + LibreTranslate)
docker-compose up --build -d

# Or for development with logs
docker-compose up --build
```

**Access after running:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

**Stop services:**
```bash
docker-compose down
```

---

### Option 2: Manual Setup (Node.js)

```bash
# 1. Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..

# 2. Copy environment file
cp .env.example .env

# 3. Start backend (port 3001)
cd backend && npm run dev

# 4. Start frontend (port 5173) - in new terminal
cd frontend && npm run dev
```

---

### Option 3: Vercel (Frontend Only - Limited Features)

```bash
# Deploy to Vercel for preview (upload/export features won't work)
npm run build
# Then deploy the dist folder to Vercel
```

**Features comparison:**

| Feature | Docker | Manual | Vercel |
|---------|--------|-------|-------|
| Video Upload | ✅ | ✅ | ✅ (local) |
| Subtitle Upload | ✅ | ✅ | ✅ (local) |
| Auto-extract SRT | ✅ | ✅ | ❌ |
| Edit SRT | ✅ | ✅ | ✅ |
| Style Subtitles | ✅ | ✅ | ✅ |
| Translation | ✅ | ✅ | ❌ |
| Video Export | ✅ | ✅ | ❌ |
| Download SRT | ✅ | ✅ | ✅ |

## Project Structure

```
movie-recap-app/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── VideoPlayer.jsx
│   │   │   ├── SubtitleEditor.jsx
│   │   │   ├── SubtitleDialog.jsx
│   │   │   ├── OverlayControls.jsx
│   │   │   ├── Timeline.jsx
│   │   │   └── MovieUploader.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── EditorPage.jsx
│   │   │   └── ExportPage.jsx
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/                 # Express backend
│   ├── routes/
│   │   ├── upload.js       # File uploads
│   │   ├── edit.js        # Video editing
│   │   ├── export.js     # Export operations
│   │   └── subtitle.js   # Subtitle parsing/transform
│   ├── uploads/          # File storage
│   ├── server.js
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

### Upload Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/api/upload/video` | Upload video file |
| POST | `/api/upload/subtitle` | Upload SRT file |
| POST | `/api/upload/image` | Upload image overlay |
| GET | `/api/upload/files` | List uploaded files |
| DELETE | `/api/upload/files/:filename` | Delete a file |

### Edit Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/api/edit/trim` | Trim video |
| POST | `/api/edit/color` | Apply color adjustments |
| GET | `/api/edit/metadata/:filename` | Get video metadata |

### Export Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| POST | `/api/export/burn-subtitles` | Burn in subtitles |
| POST | `/api/export/soft-subtitles` | Add soft subtitle track |
| POST | `/api/export/text-overlay` | Add text overlay |
| POST | `/api/export/image-overlay` | Add image overlay |
| POST | `/api/export/full-export` | Full export with all options |

### Subtitle Routes

| Method | Endpoint | Description |
|--------|----------|------------|
| GET | `/api/subtitle/extract/:filename` | Extract embedded subtitles |
| POST | `/api/subtitle/extract-srt` | Extract to SRT format |
| POST | `/api/subtitle/parse` | Parse SRT file |
| POST | `/api/subtitle/save` | Save edited SRT |
| POST | `/api/subtitle/translate` | Translate subtitles |
| POST | `/api/subtitle/merge` | Merge subtitle entries |
| POST | `/api/subtitle/split` | Split subtitle entry |

## Usage Examples

### 1. Upload and Edit

```javascript
// Upload video
const formData = new FormData();
formData.append('video', videoFile);
const response = await fetch('/api/upload/video', {
  method: 'POST',
  body: formData
});
const { file } = await response.json();

// Fetch video URL
const videoUrl = `/uploads/${file.filename}`;
```

### 2. Auto-extract Subtitles

```javascript
const response = await fetch('/api/subtitle/extract-srt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoFilename: 'your-video.mp4',
    streamIndex: 0
  })
});
const { entries } = await response.json();
```

### 3. Style and Export

```javascript
// Apply styling
const style = {
  fontSize: '24px',
  fontColor: '#FFFFFF',
  bgColor: 'rgba(0, 0, 0, 0.5)',
  fontFamily: 'Arial'
};

// Export with hard subtitles
const response = await fetch('/api/export/burn-subtitles', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    videoPath: 'your-video.mp4',
    subtitlePath: 'your-subtitle.srt',
    style
  })
});
const { output } = await response.json();
```

### 4. Translate Subtitles

```javascript
const response = await fetch('/api/subtitle/translate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    entries: subtitles,
    targetLanguage: 'es',  // Spanish
    sourceLanguage: 'auto'
  })
});
const { entries: translated } = await response.json();
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Play/Pause |
| ← | Seek -5 seconds |
| → | Seek +5 seconds |
| ↑ | Volume up |
| ↓ | Volume down |
| M | Mute/Unmute |
| F | Toggle fullscreen |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|----------|
| PORT | Server port | 3001 |
| NODE_ENV | Environment | development |
| REDIS_HOST | Redis host | localhost |
| REDIS_PORT | Redis port | 6379 |
| TRANSLATION_API | Translation API URL | - |
| TRANSLATION_API_KEY | Translation API key | - |
| MAX_FILE_SIZE | Max upload size | 500MB |

## Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, React Router
- **Backend**: Node.js, Express, Multer
- **Video Processing**: FFmpeg
- **Database**: File-based (MongoDB/PostgreSQL ready)
- **Queue**: Bull + Redis (for background processing)
- **Container**: Docker, Docker Compose

## Known Limitations

1. **Large Files**: Exporting very large videos may timeout; use Bull + Redis for background jobs
2. **Embedded OCR**: For videos without embedded subtitles, OCR requires additional setup (Vosk/Whisper.cpp)
3. **Browser Support**: Video playback relies on HTML5 video codec support

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [FFmpeg](https://ffmpeg.org/) for video processing
- [TailwindCSS](https://tailwindcss.com/) for styling
- [React](https://react.dev/) for the frontend

---

Built with ❤️ for video editors everywhere.

---

## 📖 Documentation

### Getting Started

For detailed documentation, see [DOCS.md](./DOCS.md)

---

## 👨‍💻 Developer Information

**Name:** Aung Myo Kyaw  
**Role:** Full Stack Developer  
**Phone:** +95 967740154  
**Email:** wayne.mm.92@gmail.com  
**Location:** Naypyidaw, Myanmar

---

## 🧠 Developer Notes

This application uses a clean, modular architecture designed for scalability:

### Architecture Highlights

- **Backend**: RESTful API with Express.js, modular route handlers
- **Frontend**: React 18 with functional components and hooks
- **Video Processing**: FFmpeg for all video operations
- **State Management**: React hooks + localStorage for persistence
- **Styling**: TailwindCSS with custom design tokens

### Key Design Decisions

1. **Component Structure**: Single-responsibility components with clear interfaces
2. **API Design**: RESTful endpoints with consistent response format
3. **Error Handling**: Graceful degradation with user-friendly messages
4. **Responsive Design**: Mobile-first with CSS Grid and Flexbox
5. **Keyboard Accessibility**: Full keyboard navigation support

### Security & Performance

- File type validation on upload
- Request size limits (500MB max)
- Input sanitization
- Environment-based configuration