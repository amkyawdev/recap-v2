# Movie Recap App - Specification Document

## 1. Project Overview

**Project Name:** Movie Recap App  
**Type:** Full-stack Video Editor + Subtitle Workstation  
**Core Functionality:** A web-based video editing application that allows users to upload movies, extract/edit subtitles, apply styling, add overlays, translate subtitles, and export final videos with subtitle tracks.  
**Target Users:** Content creators, video editors, subtitle translators, and movie enthusiasts.

---

## 2. UI/UX Specification

### Layout Structure

**Page Sections:**
- **Header:** Navigation bar with app logo and menu (Dashboard, Editor, Export)
- **Main Content:** Dynamic content area based on current route
- **Footer:** Minimal footer with version info

**Grid/Flex Layout:**
- CSS Grid for main layout structure
- Flexbox for component-level layouts

**Responsive Breakpoints:**
- Mobile: < 768px (stacked layout, player above editor)
- Tablet: 768px - 1024px (two-column with collapsible panels)
- Desktop: > 1024px (full two-column with resizable panels)

### Visual Design

**Color Palette:**
- Primary: `#0F172A` (dark slate - main background)
- Secondary: `#1E293B` (slate - card/panel backgrounds)
- Accent: `#F59E0B` (amber - CTAs and highlights)
- Success: `#10B981` (emerald)
- Error: `#EF4444` (red)
- Text Primary: `#F8FAFC` (white-ish)
- Text Secondary: `#94A3B8` (muted slate)
- Border: `#334155` (subtle borders)

**Typography:**
- Font Family: `"DM Sans", sans-serif` for UI
- Font Family: `"JetBrains Mono", monospace` for subtitle timestamps
- Headings: 24px (h1), 20px (h2), 16px (h3)
- Body: 14px
- Small: 12px

**Spacing System:**
- Base unit: 4px
- Margins: 16px, 24px, 32px
- Padding: 8px, 12px, 16px, 24px
- Gap: 8px, 16px

**Visual Effects:**
- Border radius: 6px (small), 12px (medium), 16px (large)
- Box shadows: `0 4px 6px -1px rgba(0, 0, 0, 0.3)`
- Transitions: 150ms ease-in-out for hover states
- Backdrop blur: 8px for dialogs/overlays

### Components

**1. VideoPlayer**
- States: loading, playing, paused, ended, error
- Controls: play/pause button, seek bar, volume slider, fullscreen toggle, playback speed
- Keyboard shortcuts: space (play/pause), left/right (±5s), up/down (volume)

**2. SubtitleEditor**
- States: default, editing, selected
- List view with sortable entries
- Inline editing for text, start time, end time

**3. SubtitleDialog (Styling)**
- Font size control: slider + input (12-48px)
- Font color picker
- Background color picker + opacity slider
- Font family dropdown (Arial, Roboto, Montserrat, Open Sans, Lato)
- Preview area

**4. Timeline**
- Visual representation of video duration
- Subtitle markers
- In/out point markers
- Draggable trim handles

**5. OverlayControls**
- Text overlay controls
- Image overlay controls
- Position presets (top-left, top-right, bottom-left, bottom-right, center)
- Opacity/scale controls

**6. MovieUploader**
- Drag-and-drop zone
- Progress indicator
- File type validation

---

## 3. Functionality Specification

### Core Features

**1. Movie + SRT Upload**
- Accept video formats: mp4, mov, avi, mkv, webm
- Accept SRT files
- Auto-detect embedded subtitles using FFmpeg
- Store in temp storage

**2. Output Display**
- Side-by-side video player and subtitle editor
- Responsive split view

**3. Subtitle Editing List**
- Display as editable list
- Add/delete/split/merge entries
- Click to seek video

**4. Subtitle Styling**
- Real-time preview
- Save style presets

**5. Auto-extract SRT**
- FFmpeg subtitle stream extraction
- OCR fallback (basic frame analysis)

**6. Full Player Logic**
- Seek, frame-step, volume, playback speed (0.5x-2x)
- Keyboard shortcuts

**7. Auto-translate SRT**
- Translation API integration
- Preserve timestamps

**8. Responsive Design**
- Mobile-first responsive layout
- Collapsible panels

**9. Download**
- Soft subs (mkv/mp4 with subtitle track)
- Hard subs (burned in)
- Separate SRT download

**10. Movie Editing**
- Trim: set in/out points
- Color: brightness, contrast, saturation, gamma
- Overlays: text (position, size, color), image (opacity, scale)

### User Interactions and Flows

1. **Upload Flow:** Dashboard → Upload video → Upload SRT (optional) → Navigate to Editor
2. **Edit Flow:** Select subtitle → Edit text/timestamps → Apply styling → Preview
3. **Export Flow:** Configure export → Process → Download

### Edge Cases

- No embedded subtitles → Display message
- Invalid file format → Show error with supported formats
- Large file processing → Show progress, allow background
- Translation API failure → Graceful fallback

---

## 4. Acceptance Criteria

### Visual Checkpoints
- [x] Dark theme applied consistently
- [x] Amber accent visible on primary actions
- [x] Video player renders correctly
- [x] Subtitle list is scrollable and editable
- [x] Dialogs have backdrop blur
- [x] Responsive layout works on all breakpoints

### Functional Checkpoints
- [x] Video upload works (any format)
- [x] SRT upload works
- [x] Video plays with controls
- [x] Subtitle list is editable
- [x] Styling dialog applies changes in real-time
- [x] Export produces downloadable file
- [x] Keyboard shortcuts work

---

## 5. Technical Architecture

### Backend Stack
- Node.js + Express
- FFmpeg (via fluent-ffmpeg)
- MongoDB (models)
- Bull + Redis (export queue)
- Multer (file uploads)

### Frontend Stack
- React 18
- TailwindCSS
- React Router
- Vite (build tool)

### Project Structure
```
/workspace/project/recap-v2/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   ├── routes/
│   ├── services/
│   ├── models/
│   ├── workers/
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── docker-compose.yml
├── .env.example
├── README.md
└── package.json (root)
```