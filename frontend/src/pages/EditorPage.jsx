import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import SubtitleEditor from '../components/SubtitleEditor';
import SubtitleDialog from '../components/SubtitleDialog';
import Timeline from '../components/Timeline';
import OverlayControls from '../components/OverlayControls';

const API_BASE = '/api';

export default function EditorPage() {
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState(null);
  const [subtitleFile, setSubtitleFile] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [subtitleStyle, setSubtitleStyle] = useState({});
  const [showStyleDialog, setShowStyleDialog] = useState(false);
  const [showOverlayControls, setShowOverlayControls] = useState(false);
  const [inPoint, setInPoint] = useState(undefined);
  const [outPoint, setOutPoint] = useState(undefined);
  const [overlays, setOverlays] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load saved files from localStorage
  useEffect(() => {
    const savedVideo = localStorage.getItem('videoFile');
    const savedSubtitle = localStorage.getItem('subtitleFile');
    const savedSubtitles = localStorage.getItem('editedSubtitles');
    const savedStyle = localStorage.getItem('subtitleStyle');
    
    if (savedVideo) {
      try {
        const video = JSON.parse(savedVideo);
        setVideoFile(video);
      } catch (e) {
        console.error('Failed to parse saved video', e);
      }
    } else {
      // Auto-load sample video for demo
      const url = '/exp.mp4';
      const fileData = { filename: 'exp.mp4', url };
      setVideoFile(fileData);
    }
    
    if (savedSubtitle) {
      try {
        const sub = JSON.parse(savedSubtitle);
        setSubtitleFile(sub);
        // If it has a URL, it's a local blob - read it directly
        if (sub.url) {
          loadLocalSubtitle(sub.url);
        } else if (sub.filename) {
          loadSubtitles(sub.filename);
        }
      } catch (e) {
        console.error('Failed to parse saved subtitle', e);
      }
    }
    
    // Load edited subtitles from previous session
    if (savedSubtitles) {
      try {
        const subs = JSON.parse(savedSubtitles);
        if (subs.length > 0) {
          setSubtitles(subs);
        }
      } catch (e) {
        console.error('Failed to parse edited subtitles', e);
      }
    }
    
    // Load subtitle style
    if (savedStyle) {
      try {
        setSubtitleStyle(JSON.parse(savedStyle));
      } catch (e) {
        console.error('Failed to parse subtitle style', e);
      }
    }
  }, []);
  
  // Upload handlers - direct from editor page
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await fetch(`${API_BASE}/upload/video`, {
        method: 'POST',
        body: formData
      });
      
      // Check if response is HTML (backend not running)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('json')) {
        throw new Error('Backend not available. Please run locally with Docker for upload features.');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setVideoFile(data.file);
      localStorage.setItem('videoFile', JSON.stringify(data.file));
    } catch (err) {
      // Handle as local file for preview only
      const url = URL.createObjectURL(file);
      setVideoFile({ filename: file.name, url });
      localStorage.setItem('videoFile', JSON.stringify({ filename: file.name, url }));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubtitleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('subtitle', file);
      
      const response = await fetch(`${API_BASE}/upload/subtitle`, {
        method: 'POST',
        body: formData
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('json')) {
        throw new Error('Backend not available');
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setSubtitleFile(data.file);
      localStorage.setItem('subtitleFile', JSON.stringify(data.file));
      loadSubtitles(data.file.filename);
    } catch (err) {
      // Handle local SRT file
      const text = await file.text();
      const entries = parseSRT(text);
      setSubtitles(entries);
      setSubtitleFile({ filename: file.name });
      localStorage.setItem('subtitleFile', JSON.stringify({ filename: file.name }));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Parse SRT client-side
  const parseSRT = (srtText) => {
    const entries = [];
    const blocks = srtText.trim().split(/\n\n+/);
    
    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length >= 3) {
        const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
        if (timeMatch) {
          entries.push({
            index: entries.length + 1,
            startTime: parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000,
            endTime: parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000,
            text: lines.slice(2).join('\n')
          });
        }
      }
    }
    return entries;
  };
  
  // Load local subtitle from blob URL
  const loadLocalSubtitle = async (url) => {
    if (!url) return;
    
    try {
      const response = await fetch(url);
      const text = await response.text();
      const entries = parseSRT(text);
      setSubtitles(entries);
    } catch (err) {
      console.error('Failed to load local subtitle', err);
    }
  };
  
  // Load subtitles from backend
  const loadSubtitles = async (filename) => {
    if (!filename) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/subtitle/parse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtitlePath: filename })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load subtitles');
      }
      
      setSubtitles(data.entries || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubtitleChange = useCallback((newSubtitles) => {
    setSubtitles(newSubtitles);
    // Save to localStorage
    localStorage.setItem('editedSubtitles', JSON.stringify(newSubtitles));
  }, []);
  
  const handleSubtitleSelect = (sub) => {
    setSelectedSubtitle(sub);
    setCurrentTime(sub.startTime);
  };
  
  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };
  
  const handleStyleApply = (style) => {
    setSubtitleStyle(style);
    localStorage.setItem('subtitleStyle', JSON.stringify(style));
  };
  
  const handleAddTextOverlay = (overlay) => {
    setOverlays(prev => [...prev, { ...overlay, type: 'text' }]);
  };
  
  const handleAddImageOverlay = (overlay) => {
    setOverlays(prev => [...prev, { ...overlay, type: 'image' }]);
  };
  
  const handleSetInPoint = (point) => {
    setInPoint(point);
  };
  
  const handleSetOutPoint = (point) => {
    setOutPoint(point);
  };
  
  const handleSeek = (time) => {
    setCurrentTime(time);
  };
  
  // Get video URL - supports local blob URLs
  const videoSrc = useMemo(() => {
    if (!videoFile) return '';
    if (videoFile.url) return videoFile.url;
    return `/uploads/${videoFile.filename}`;
  }, [videoFile]);
  
  return (
    <div className="h-[calc(100vh-65px)] flex flex-col lg:flex-row">
      {/* Left panel - Video Player */}
      <div className="flex-1 flex flex-col p-4 lg:w-2/3">
        {videoFile ? (
          <div className="flex-1 flex flex-col">
            <VideoPlayer
              src={videoSrc}
              subtitles={subtitles}
              subtitleStyle={subtitleStyle}
              currentTime={currentTime}
              onTimeUpdate={handleTimeUpdate}
              onSubtitleClick={handleSubtitleSelect}
              className="flex-1"
            />
            
            {/* Timeline */}
            <div className="mt-4">
              <Timeline
                duration={duration}
                subtitles={subtitles}
                currentTime={currentTime}
                onSeek={handleSeek}
                inPoint={inPoint}
                outPoint={outPoint}
                onSetInPoint={handleSetInPoint}
                onSetOutPoint={handleSetOutPoint}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-secondary rounded-xl">
            <div className="text-center max-w-md p-6">
              <svg className="w-16 h-16 mx-auto mb-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-text-secondary mb-4">Upload a video to start editing</p>
              
              {/* Sample video button */}
              <button
                onClick={() => {
                  const url = '/exp.mp4';
                  const fileData = { filename: 'exp.mp4', url };
                  localStorage.setItem('videoFile', JSON.stringify(fileData));
                  window.location.href = '/editor';
                }}
                className="mb-4 px-4 py-2 bg-accent text-primary rounded-lg font-medium hover:bg-accent/80"
              >
                Try Sample Video
              </button>
              
              {/* Direct upload form */}
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium">Video File (mp4, mov, avi, mkv)</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-primary file:font-medium hover:file:bg-accent/80"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-sm font-medium">Subtitle File (SRT) - Optional</label>
                  <input
                    type="file"
                    accept=".srt"
                    onChange={handleSubtitleUpload}
                    className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-border file:text-text-primary file:font-medium hover:file:bg-border/80"
                  />
                </div>
              </div>
              
              {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
            </div>
          </div>
        )}
      </div>
      
      {/* Right panel - Subtitle Editor */}
      <div className="flex-1 flex flex-col p-4 lg:w-1/3 border-l border-border">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setShowStyleDialog(true)}
            disabled={!videoFile}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Style
          </button>
          
          <button
            onClick={() => setShowOverlayControls(true)}
            disabled={!videoFile}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Add Overlay
          </button>
          
          <Link
            to="/export"
            disabled={!videoFile}
            className="px-3 py-1.5 rounded-lg bg-accent text-primary hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Export
          </Link>
        </div>
        
        {/* Subtitle list */}
        <div className="flex-1 overflow-hidden">
          {videoFile ? (
            <SubtitleEditor
              subtitles={subtitles}
              onChange={handleSubtitleChange}
              onSelect={handleSubtitleSelect}
              selectedId={selectedSubtitle?.index}
              currentTime={currentTime}
              className="h-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center text-text-secondary text-sm">
              Load a video to edit subtitles
            </div>
          )}
        </div>
        
        {/* Overlays list */}
        {overlays.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-medium mb-2">Active Overlays</h3>
            <div className="space-y-1">
              {overlays.map((overlay, index) => (
                <div key={index} className="text-sm text-text-secondary flex justify-between">
                  <span>{overlay.type}: {overlay.text?.substring(0, 20) || overlay.imagePath}</span>
                  <button
                    onClick={() => setOverlays(prev => prev.filter((_, i) => i !== index))}
                    className="text-error hover:text-error/80"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Style Dialog */}
      <SubtitleDialog
        isOpen={showStyleDialog}
        onClose={() => setShowStyleDialog(false)}
        style={subtitleStyle}
        onApply={handleStyleApply}
      />
      
      {/* Overlay Controls */}
      <OverlayControls
        isOpen={showOverlayControls}
        onClose={() => setShowOverlayControls(false)}
        onAddTextOverlay={handleAddTextOverlay}
        onAddImageOverlay={handleAddImageOverlay}
      />
    </div>
  );
}