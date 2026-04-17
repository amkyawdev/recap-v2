import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = '/api';

export default function Dashboard() {
  const [videoFile, setVideoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if video was already loaded
  useEffect(() => {
    const savedVideo = localStorage.getItem('videoFile');
    if (savedVideo) {
      try {
        const video = JSON.parse(savedVideo);
        setVideoFile(video);
      } catch (e) {
        console.error('Failed to parse saved video', e);
      }
    }
  }, []);
  
  const handleStartEditing = () => {
    if (videoFile) {
      window.location.href = '/editor';
    }
  };
  
  const handleLoadSample = () => {
    const url = '/exp.mp4';
    const fileData = { filename: 'exp.mp4', url };
    localStorage.setItem('videoFile', JSON.stringify(fileData));
    setVideoFile(fileData);
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Hero section */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          Movie Recap <span className="text-accent">App</span>
        </h1>
        <p className="text-text-secondary text-lg">
          Upload, edit, and export videos with custom subtitles
        </p>
      </div>
      
      {/* Promotional Video Banner */}
      <div className="mb-8">
        <div className="relative rounded-xl overflow-hidden bg-secondary">
          <video
            src="/exp.mp4"
            className="w-full aspect-video object-cover"
            autoPlay
            muted
            loop
            playsInline
            onError={(e) => {
              e.target.style.display = 'none';
              // Show fallback gradient
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent items-center justify-center">
            <div className="text-center">
              <p className="text-text-secondary text-lg">Sample Video</p>
            </div>
          </div>
          
          {/* Overlay content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-primary/90 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-1">Create Amazing Videos</h2>
                <p className="text-text-secondary text-sm">Edit subtitles, add overlays, and export in minutes</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleLoadSample}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-border transition-colors"
                >
                  Try Sample
                </button>
                {videoFile && (
                  <Link
                    to="/editor"
                    className="px-4 py-2 rounded-lg bg-accent text-primary font-medium hover:bg-accent/80 transition-colors"
                  >
                    Open Editor
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
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