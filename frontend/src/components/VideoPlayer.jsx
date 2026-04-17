import { useState, useRef, useEffect, useCallback } from 'react';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function formatDuration(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({
  src,
  subtitles = [],
  subtitleStyle = {},
  currentTime: externalCurrentTime,
  onTimeUpdate,
  onSubtitleClick,
  className = ''
}) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [activeSubtitle, setActiveSubtitle] = useState(null);
  
  const hideControlsTimeout = useRef(null);
  
  // Sync external current time
  useEffect(() => {
    if (externalCurrentTime !== undefined && Math.abs(videoRef.current?.currentTime - externalCurrentTime) > 0.5) {
      videoRef.current.currentTime = externalCurrentTime;
    }
  }, [externalCurrentTime]);
  
  // Find active subtitle based on current time
  useEffect(() => {
    if (subtitles.length > 0) {
      const sub = subtitles.find(s => currentTime >= s.startTime && currentTime <= s.endTime);
      setActiveSubtitle(sub || null);
    } else {
      setActiveSubtitle(null);
    }
  }, [currentTime, subtitles]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + 5);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTime]);
  
  // Update volume
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);
  
  // Update playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);
  
  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);
  
  const seek = useCallback((time) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(time, duration));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onTimeUpdate?.(newTime);
    }
  }, [duration, onTimeUpdate]);
  
  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);
  
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);
  
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  }, [onTimeUpdate]);
  
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);
  
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideControlsTimeout.current);
    hideControlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);
  
  const handleSubtitleClick = (sub) => {
    if (sub && onSubtitleClick) {
      onSubtitleClick(sub);
    } else {
      seek(sub?.startTime || 0);
    }
  };
  
  const speedOptions = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
  
  const defaultStyle = {
    fontSize: '24px',
    fontColor: '#FFFFFF',
    bgColor: 'rgba(0, 0, 0, 0.5)',
    fontFamily: 'Arial'
  };
  
  const style = { ...defaultStyle, ...subtitleStyle };
  
  return (
    <div
      ref={containerRef}
      className={`video-container ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={togglePlay}
      />
      
      {/* Active subtitle overlay */}
      {activeSubtitle && (
        <div
          className="subtitle-overlay"
          style={{
            fontSize: style.fontSize,
            color: style.fontColor,
            backgroundColor: style.bgColor,
            fontFamily: style.fontFamily
          }}
        >
          {activeSubtitle.text}
        </div>
      )}
      
      {/* Video controls */}
      <div className={`video-controls ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress bar */}
        <div className="mb-3">
          <div className="relative h-1 bg-border rounded-full cursor-pointer group">
            <div
              className="absolute h-full bg-accent rounded-full"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
            />
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </div>
        
        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-accent hover:bg-accent/80 transition-colors"
            >
              {isPlaying ? (
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            
            {/* Skip back/forward */}
            <button
              onClick={() => seek(currentTime - 5)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Rewind 5s"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>
            
            <button
              onClick={() => seek(currentTime + 5)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              title="Forward 5s"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
              </svg>
            </button>
            
            {/* Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20"
              />
            </div>
            
            {/* Time display */}
            <div className="text-sm text-text-secondary font-mono ml-2">
              {formatTime(currentTime)} / {formatDuration(duration)}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Speed control */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-3 py-1 rounded-lg hover:bg-secondary transition-colors text-sm"
              >
                {playbackSpeed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-secondary rounded-lg shadow-lg overflow-hidden animate-fadeIn">
                  {speedOptions.map(speed => (
                    <button
                      key={speed}
                      onClick={() => {
                        setPlaybackSpeed(speed);
                        setShowSpeedMenu(false);
                      }}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-primary transition-colors ${
                        playbackSpeed === speed ? 'text-accent' : 'text-text-primary'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {isFullscreen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}