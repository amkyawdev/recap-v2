import { useState, useEffect, useCallback } from 'react';
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
    
    if (savedVideo) {
      try {
        setVideoFile(JSON.parse(savedVideo));
      } catch (e) {
        console.error('Failed to parse saved video', e);
      }
    }
    
    if (savedSubtitle) {
      try {
        const sub = JSON.parse(savedSubtitle);
        setSubtitleFile(sub);
        // Parse the subtitle file
        loadSubtitles(sub.filename || sub.path);
      } catch (e) {
        console.error('Failed to parse saved subtitle', e);
      }
    }
  }, []);
  
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
  
  const videoSrc = videoFile ? `/uploads/${videoFile.filename}` : '';
  
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
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-text-secondary mb-4">No video loaded</p>
              <Link
                to="/"
                className="px-4 py-2 rounded-lg bg-accent text-primary font-medium hover:bg-accent/80 transition-colors"
              >
                Go to Dashboard
              </Link>
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