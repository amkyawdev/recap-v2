import { useState, useRef, useCallback } from 'react';

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'];
const ACCEPTED_SUBTITLE_TYPES = ['.srt', '.vtt'];

export default function MovieUploader({
  onVideoUpload,
  onSubtitleUpload,
  isLoading = false,
  progress = 0,
  className = ''
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [subtitleFile, setSubtitleFile] = useState(null);
  const [error, setError] = useState(null);
  const videoInputRef = useRef(null);
  const subtitleInputRef = useRef(null);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);
  
  const handleFiles = async (files) => {
    setError(null);
    
    for (const file of files) {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      
      if (ACCEPTED_VIDEO_TYPES.includes(file.type) || ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext)) {
        if (onVideoUpload) {
          setVideoFile(file);
          try {
            await onVideoUpload(file);
          } catch (err) {
            setError(err.message);
          }
        }
      } else if (ACCEPTED_SUBTITLE_TYPES.includes(ext)) {
        if (onSubtitleUpload) {
          setSubtitleFile(file);
          try {
            await onSubtitleUpload(file);
          } catch (err) {
            setError(err.message);
          }
        }
      } else {
        setError(`Unsupported file type: ${file.name}`);
      }
    }
  };
  
  const handleVideoSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file && onVideoUpload) {
      setVideoFile(file);
      try {
        await onVideoUpload(file);
      } catch (err) {
        setError(err.message);
      }
    }
  };
  
  const handleSubtitleSelect = async (e) => {
    const file = e.target.files?.[0];
    if (file && onSubtitleUpload) {
      setSubtitleFile(file);
      try {
        await onSubtitleUpload(file);
      } catch (err) {
        setError(err.message);
      }
    }
  };
  
  return (
    <div className={className}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl transition-all ${
          isDragOver
            ? 'border-accent bg-accent/10'
            : 'border-border hover:border-text-secondary'
        }`}
      >
        <div className="p-8 text-center">
          {/* Upload icon */}
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          <p className="text-lg font-medium mb-2">Drop your files here</p>
          <p className="text-text-secondary text-sm mb-4">
            or click to browse • mp4, mov, avi, mkv, webm
          </p>
          
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
            onChange={handleVideoSelect}
            className="hidden"
          />
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => videoInputRef.current?.click()}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg bg-accent text-primary font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Uploading...' : 'Upload Video'}
            </button>
            
            <input
              ref={subtitleInputRef}
              type="file"
              accept=".srt,.vtt"
              onChange={handleSubtitleSelect}
              className="hidden"
            />
            
            <button
              onClick={() => subtitleInputRef.current?.click()}
              disabled={isLoading}
              className="px-6 py-2.5 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Uploading...' : 'Upload SRT'}
            </button>
          </div>
          
          {/* Progress bar */}
          {isLoading && progress > 0 && (
            <div className="mt-4 max-w-xs mx-auto">
              <div className="h-2 bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-text-secondary mt-1">{progress}%</p>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/30 text-error text-sm">
              {error}
            </div>
          )}
          
          {/* Selected files display */}
          {(videoFile || subtitleFile) && !isLoading && (
            <div className="mt-4 space-y-2">
              {videoFile && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-secondary">{videoFile.name}</span>
                </div>
              )}
              {subtitleFile && (
                <div className="flex items-center justify-center gap-2 text-sm">
                  <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-text-secondary">{subtitleFile.name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}