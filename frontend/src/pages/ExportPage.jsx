import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = '/api';

export default function ExportPage() {
  const [videoFile, setVideoFile] = useState(null);
  const [subtitleFile, setSubtitleFile] = useState(null);
  const [subtitles, setSubtitles] = useState([]);
  const [subtitleStyle, setSubtitleStyle] = useState({});
  const [exportSettings, setExportSettings] = useState({
    format: 'mp4', // mp4, mkv
    subtitleMode: 'soft', // soft, hard
    trimStart: 0,
    trimEnd: null,
    colorAdjustments: {
      brightness: 1,
      contrast: 1,
      saturation: 1,
      gamma: 1
    }
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResult, setExportResult] = useState(null);
  const [error, setError] = useState(null);
  
  // Load saved data
  useEffect(() => {
    const savedVideo = localStorage.getItem('videoFile');
    const savedSubtitle = localStorage.getItem('subtitleFile');
    const savedSubtitles = localStorage.getItem('editedSubtitles');
    const savedStyle = localStorage.getItem('subtitleStyle');
    
    if (savedVideo) {
      try {
        setVideoFile(JSON.parse(savedVideo));
      } catch (e) {
        console.error('Failed to parse saved video', e);
      }
    }
    
    if (savedSubtitle) {
      try {
        setSubtitleFile(JSON.parse(savedSubtitle));
      } catch (e) {
        console.error('Failed to parse saved subtitle', e);
      }
    }
    
    if (savedSubtitles) {
      try {
        setSubtitles(JSON.parse(savedSubtitles));
      } catch (e) {
        console.error('Failed to parse saved subtitles', e);
      }
    }
    
    if (savedStyle) {
      try {
        setSubtitleStyle(JSON.parse(savedStyle));
      } catch (e) {
        console.error('Failed to parse saved style', e);
      }
    }
  }, []);
  
  // Upload handlers
  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const formData = new FormData();
      formData.append('video', file);
      
      const response = await fetch(`${API_BASE}/upload/video`, {
        method: 'POST',
        body: formData
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('json')) {
        // Handle local file
        const url = URL.createObjectURL(file);
        setVideoFile({ filename: file.name, url });
        localStorage.setItem('videoFile', JSON.stringify({ filename: file.name, url }));
        return;
      }
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setVideoFile(data.file);
      localStorage.setItem('videoFile', JSON.stringify(data.file));
    } catch (err) {
      // Handle local file
      const url = URL.createObjectURL(file);
      setVideoFile({ filename: file.name, url });
      localStorage.setItem('videoFile', JSON.stringify({ filename: file.name, url }));
    }
  };
  
  const handleSubtitleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const formData = new FormData();
      formData.append('subtitle', file);
      
      const response = await fetch(`${API_BASE}/upload/subtitle`, {
        method: 'POST',
        body: formData
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('json')) {
        // Handle local SRT
        const text = await file.text();
        const entries = parseLocalSRT(text);
        setSubtitles(entries);
        setSubtitleFile({ filename: file.name });
        localStorage.setItem('subtitleFile', JSON.stringify({ filename: file.name }));
        return;
      }
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setSubtitleFile(data.file);
      localStorage.setItem('subtitleFile', JSON.stringify(data.file));
    } catch (err) {
      // Handle local SRT
      const text = await file.text();
      const entries = parseLocalSRT(text);
      setSubtitles(entries);
      setSubtitleFile({ filename: file.name });
      localStorage.setItem('subtitleFile', JSON.stringify({ filename: file.name }));
    }
  };
  
  // Parse SRT client-side
  const parseLocalSRT = (srtText) => {
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
  
  const handleExport = async () => {
    if (!videoFile) {
      setError('No video file loaded');
      return;
    }
    
    setIsExporting(true);
    setError(null);
    setExportProgress(0);
    setExportResult(null);
    
    try {
      // First, save the edited subtitles
      if (subtitles.length > 0) {
        const saveResponse = await fetch(`${API_BASE}/subtitle/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: subtitles })
        });
        
        const saveData = await saveResponse.json();
        
        if (!saveResponse.ok) {
          throw new Error(saveData.error || 'Failed to save subtitles');
        }
        
        setSubtitleFile({ filename: saveData.filename });
      }
      
      setExportProgress(30);
      
      // Export based on mode
      if (exportSettings.subtitleMode === 'hard') {
        const response = await fetch(`${API_BASE}/export/burn-subtitles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoPath: videoFile.filename,
            subtitlePath: subtitleFile?.filename || subtitles[0]?.filename,
            style: subtitleStyle
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Export failed');
        }
        
        setExportResult(data.output);
      } else {
        const response = await fetch(`${API_BASE}/export/soft-subtitles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoPath: videoFile.filename,
            subtitlePath: subtitleFile?.filename || subtitles[0]?.filename
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Export failed');
        }
        
        setExportResult(data.output);
      }
      
      setExportProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleDownloadVideo = () => {
    if (!exportResult) return;
    window.open(`/uploads/${exportResult.filename}`, '_blank');
  };
  
  const handleDownloadSRT = async () => {
    // Generate SRT file client-side
    const generateSRT = (entries) => {
      return entries.map((entry, i) => {
        const start = formatTimestamp(entry.startTime);
        const end = formatTimestamp(entry.endTime);
        return `${i + 1}\n${start} --> ${end}\n${entry.text}\n`;
      }).join('\n');
    };
    
    const formatTimestamp = (seconds) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const ms = Math.round((seconds % 1) * 1000);
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    };
    
    if (!videoFile || subtitles.length === 0) return;
    
    // Create downloadable SRT
    const srtContent = generateSRT(subtitles);
    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Export</h1>
      <p className="text-text-secondary mb-8">
        Configure and export your video with subtitles
      </p>
      
      {!videoFile ? (
        <div className="text-center py-12 bg-secondary rounded-xl">
          <svg className="w-16 h-16 mx-auto mb-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-text-secondary mb-4">Upload a video to start exporting</p>
          
          {/* Direct upload */}
          <div className="max-w-md mx-auto space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Video File</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent file:text-primary file:font-medium hover:file:bg-accent/80"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium">Subtitle File (optional)</label>
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
      ) : (
        <div className="space-y-6">
          {/* Preview Section */}
          <div className="bg-secondary rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Preview</h2>
            
            <div className="relative bg-primary rounded-lg overflow-hidden">
              <video
                src={getVideoSrc()}
                controls
                className="w-full max-h-[400px]"
                crossOrigin="anonymous"
              >
                {subtitleFile && (
                  <track
                    kind="subtitles"
                    src={getSubtitleSrc()}
                    default
                  />
                )}
              </video>
              
              {/* Subtitle overlay preview */}
              {subtitles.length > 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-8">
                  <div className="max-w-[80%] text-center">
                    {subtitles
                      .filter(s => {
                        const videoEl = document.querySelector('video');
                        const ct = videoEl?.currentTime || 0;
                        return ct >= s.startTime && ct <= s.endTime;
                      })
                      .slice(0, 1)
                      .map((sub, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: subtitleStyle.fontSize || '24px',
                            color: subtitleStyle.fontColor || '#FFFFFF',
                            backgroundColor: subtitleStyle.bgColor 
                              ? subtitleStyle.bgColor.replace(`@${subtitleStyle.bgOpacity}`, '')
                                    .replace('@', '') || 'rgba(0,0,0,0.5)'
                              : 'rgba(0,0,0,0.5)',
                            fontFamily: subtitleStyle.fontFamily || 'Arial',
                            padding: '8px 16px',
                            borderRadius: '6px'
                          }}
                        >
                          {sub.text}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-text-secondary mt-2">
              Preview shows subtitles with your applied style
            </p>
          </div>
          
          {/* Export settings */}
          <div className="bg-secondary rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Export Settings</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Subtitle mode */}
              <div>
                <label className="block text-sm font-medium mb-2">Subtitle Mode</label>
                <select
                  value={exportSettings.subtitleMode}
                  onChange={(e) => setExportSettings({ ...exportSettings, subtitleMode: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                >
                  <option value="soft">Soft Subtitle (MKV)</option>
                  <option value="hard">Hard Subtitle (Burned In)</option>
                </select>
                <p className="text-xs text-text-secondary mt-1">
                  {exportSettings.subtitleMode === 'soft'
                    ? 'Subtitles as separate track, can be toggled'
                    : 'Subtitles burned into video, always visible'}
                </p>
              </div>
              
              {/* Format */}
              <div>
                <label className="block text-sm font-medium mb-2">Output Format</label>
                <select
                  value={exportSettings.format}
                  onChange={(e) => setExportSettings({ ...exportSettings, format: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                >
                  <option value="mp4">MP4</option>
                  <option value="mkv">MKV</option>
                </select>
              </div>
              
              {/* Trim start */}
              <div>
                <label className="block text-sm font-medium mb-2">Trim Start (seconds)</label>
                <input
                  type="number"
                  min={0}
                  value={exportSettings.trimStart}
                  onChange={(e) => setExportSettings({ ...exportSettings, trimStart: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                />
              </div>
              
              {/* Trim end */}
              <div>
                <label className="block text-sm font-medium mb-2">Trim End (seconds)</label>
                <input
                  type="number"
                  min={0}
                  placeholder="Optional"
                  value={exportSettings.trimEnd || ''}
                  onChange={(e) => setExportSettings({ ...exportSettings, trimEnd: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                />
              </div>
            </div>
            
            {/* Color adjustments */}
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium mb-4">Color Adjustments</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Brightness</label>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={exportSettings.colorAdjustments.brightness}
                    onChange={(e) => setExportSettings({
                      ...exportSettings,
                      colorAdjustments: { ...exportSettings.colorAdjustments, brightness: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Contrast</label>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={exportSettings.colorAdjustments.contrast}
                    onChange={(e) => setExportSettings({
                      ...exportSettings,
                      colorAdjustments: { ...exportSettings.colorAdjustments, contrast: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Saturation</label>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={exportSettings.colorAdjustments.saturation}
                    onChange={(e) => setExportSettings({
                      ...exportSettings,
                      colorAdjustments: { ...exportSettings.colorAdjustments, saturation: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">Gamma</label>
                  <input
                    type="range"
                    min={0.5}
                    max={1.5}
                    step={0.1}
                    value={exportSettings.colorAdjustments.gamma}
                    onChange={(e) => setExportSettings({
                      ...exportSettings,
                      colorAdjustments: { ...exportSettings.colorAdjustments, gamma: parseFloat(e.target.value) }
                    })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Subtitle preview */}
          <div className="bg-secondary rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">Subtitle Style</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-text-secondary">Font:</span> {subtitleStyle.fontFamily || 'Arial'}
              </div>
              <div>
                <span className="text-text-secondary">Size:</span> {subtitleStyle.fontSize || '24px'}
              </div>
              <div>
                <span className="text-text-secondary">Color:</span>{' '}
                <span
                  className="inline-block w-4 h-4 rounded"
                  style={{ backgroundColor: subtitleStyle.fontColor || '#FFFFFF' }}
                />
              </div>
            </div>
          </div>
          
          {/* Export button */}
          <div className="flex gap-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-3 rounded-lg bg-accent text-primary font-medium hover:bg-accent/80 transition-colors disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : 'Export Video'}
            </button>
            
            {exportResult && (
              <button
                onClick={handleDownloadVideo}
                className="px-6 py-3 rounded-lg border border-border hover:bg-border transition-colors"
              >
                Download Video
              </button>
            )}
            
            {/* Download original */}
            {videoFile && (
              <button
                onClick={downloadOriginal}
                className="px-6 py-3 rounded-lg border border-border hover:bg-border transition-colors"
              >
                Download Original
              </button>
            )}
            
            {subtitles.length > 0 && (
              <button
                onClick={handleDownloadSRT}
                className="px-6 py-3 rounded-lg border border-border hover:bg-border transition-colors"
              >
                Download SRT
              </button>
            )}
          </div>
          
          {/* Progress */}
          {isExporting && exportProgress > 0 && (
            <div className="mt-4">
              <div className="h-2 bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <p className="text-sm text-text-secondary mt-1">{exportProgress}% complete</p>
            </div>
          )}
          
          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-error/10 border border-error/30 text-error">
              {error}
            </div>
          )}
          
          {/* Success */}
          {exportResult && (
            <div className="mt-4 p-4 rounded-lg bg-success/10 border border-success/30 text-success animate-fadeIn">
              <p className="font-medium">Export Complete!</p>
              <p className="text-sm">
                File: {exportResult.filename} ({(exportResult.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}