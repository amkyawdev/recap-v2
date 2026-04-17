import { useState } from 'react';
import { Link } from 'react-router-dom';
import MovieUploader from '../components/MovieUploader';

const API_BASE = '/api';

export default function Dashboard() {
  const [videoFile, setVideoFile] = useState(null);
  const [subtitleFile, setSubtitleFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [error, setError] = useState(null);
  
  const handleVideoUpload = async (file) => {
    setIsLoading(true);
    setError(null);
    
    // First save to localStorage immediately (sync)
    const url = URL.createObjectURL(file);
    const fileData = { filename: file.name, url };
    localStorage.setItem('videoFile', JSON.stringify(fileData));
    
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await fetch(`${API_BASE}/upload/video`, {
        method: 'POST',
        body: formData
      });
      
      // Check if backend is available
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('json')) {
        // Backend not available - use local file (already saved)
        setVideoFile(fileData);
        
        // Redirect to editor
        window.location.href = '/editor';
        return;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setVideoFile(data.file);
      localStorage.setItem('videoFile', JSON.stringify(data.file));
      
      // Redirect to editor
      window.location.href = '/editor';
    } catch (err) {
      // Use local file (already saved in localStorage)
      setVideoFile(fileData);
      
      // Redirect to editor
      window.location.href = '/editor';
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubtitleUpload = async (file) => {
    setIsLoading(true);
    setError(null);
    
    // Save to localStorage immediately (sync)
    const fileData = { filename: file.name };
    localStorage.setItem('subtitleFile', JSON.stringify(fileData));
    
    try {
      const formData = new FormData();
      formData.append('subtitle', file);
      
      const response = await fetch(`${API_BASE}/upload/subtitle`, {
        method: 'POST',
        body: formData
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('json')) {
        // Backend not available - use local file
        setSubtitleFile(fileData);
        return;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      setSubtitleFile(data.file);
      localStorage.setItem('subtitleFile', JSON.stringify(data.file));
    } catch (err) {
      // Use local file
      setSubtitleFile(fileData);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartEditing = () => {
    if (videoFile) {
      // Navigate to editor
      window.location.href = '/editor';
    }
  };
  
  const handleAutoExtract = async () => {
    if (!videoFile) {
      setError('Please upload a video first');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/subtitle/extract-srt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoFilename: videoFile.filename })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Extraction failed');
      }
      
      setSubtitleFile({ filename: data.srtFilename });
      localStorage.setItem('subtitleFile', JSON.stringify({ filename: data.srtFilename }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Movie Recap <span className="text-accent">App</span>
        </h1>
        <p className="text-text-secondary text-lg">
          Upload, edit, and export videos with custom subtitles
        </p>
      </div>
      
      {/* Upload section */}
      <div className="mb-8">
        <MovieUploader
          onVideoUpload={handleVideoUpload}
          onSubtitleUpload={handleSubtitleUpload}
          isLoading={isLoading}
        />
      </div>
      
      {/* Quick actions */}
      {videoFile && (
        <div className="mb-8 animate-slideUp">
          <div className="bg-secondary rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/editor"
                className="px-4 py-2 rounded-lg bg-accent text-primary font-medium hover:bg-accent/80 transition-colors"
              >
                Open in Editor
              </Link>
              
              <button
                onClick={handleAutoExtract}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg border border-border hover:bg-border transition-colors disabled:opacity-50"
              >
                Auto-extract Subtitles
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Features */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-secondary rounded-xl p-6">
          <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Edit Subtitles</h3>
          <p className="text-text-secondary text-sm">
            Edit text, adjust timestamps, split and merge subtitle entries
          </p>
        </div>
        
        <div className="bg-secondary rounded-xl p-6">
          <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Style Subtitles</h3>
          <p className="text-text-secondary text-sm">
            Customize fonts, colors, background opacity, and more
          </p>
        </div>
        
        <div className="bg-secondary rounded-xl p-6">
          <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <h3 className="font-semibold mb-2">Export Video</h3>
          <p className="text-text-secondary text-sm">
            Burn in subtitles or add soft tracks, trim and add overlays
          </p>
        </div>
      </div>
    </div>
  );
}