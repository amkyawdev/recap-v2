import { useState } from 'react';

const positionPresets = [
  { id: 'top-left', label: 'Top Left', x: '10', y: '10' },
  { id: 'top-center', label: 'Top Center', x: '(w-text_w)/2', y: '10' },
  { id: 'top-right', label: 'Top Right', x: 'w-text_w-10', y: '10' },
  { id: 'center-left', label: 'Center Left', x: '10', y: '(h-text_h)/2' },
  { id: 'center', label: 'Center', x: '(w-text_w)/2', y: '(h-text_h)/2' },
  { id: 'center-right', label: 'Center Right', x: 'w-text_w-10', y: '(h-text_h)/2' },
  { id: 'bottom-left', label: 'Bottom Left', x: '10', y: 'h-text_h-10' },
  { id: 'bottom-center', label: 'Bottom Center', x: '(w-text_w)/2', y: 'h-text_h-10' },
  { id: 'bottom-right', label: 'Bottom Right', x: 'w-text_w-10', y: 'h-text_h-10' }
];

export default function OverlayControls({
  isOpen,
  onClose,
  onAddTextOverlay,
  onAddImageOverlay,
  className = ''
}) {
  const [activeTab, setActiveTab] = useState('text');
  const [textOverlay, setTextOverlay] = useState({
    text: '',
    startTime: 0,
    endTime: 5,
    position: 'bottom-center',
    fontSize: 24,
    fontColor: '#FFFFFF',
    bgColor: '#000000',
    opacity: 50
  });
  const [imageOverlay, setImageOverlay] = useState({
    imagePath: '',
    startTime: 0,
    endTime: null,
    position: 'bottom-right',
    opacity: 100,
    scale: 100
  });
  const [imageFile, setImageFile] = useState(null);
  
  const handleAddTextOverlay = () => {
    if (!textOverlay.text.trim()) return;
    
    const position = positionPresets.find(p => p.id === textOverlay.position);
    
    onAddTextOverlay?.({
      ...textOverlay,
      x: position?.x || '(w-text_w)/2',
      y: position?.y || 'h-50'
    });
    
    // Reset
    setTextOverlay({
      ...textOverlay,
      text: ''
    });
  };
  
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageOverlay({
        ...imageOverlay,
        imagePath: file.name
      });
    }
  };
  
  const handleAddImageOverlay = () => {
    if (!imageFile) return;
    
    const position = positionPresets.find(p => p.id === imageOverlay.position);
    
    onAddImageOverlay?.({
      ...imageOverlay,
      x: position?.x || 'w-overlay_w-10',
      y: position?.y || '10',
      scale: imageOverlay.scale / 100,
      opacity: imageOverlay.opacity / 100
    });
    
    setImageFile(null);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="dialog-backdrop animate-fadeIn" onClick={onClose}>
      <div
        className="bg-secondary rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Add Overlay</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-border transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 px-4 py-3 text-center transition-colors ${
              activeTab === 'text'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Text Overlay
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`flex-1 px-4 py-3 text-center transition-colors ${
              activeTab === 'image'
                ? 'text-accent border-b-2 border-accent'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Image Overlay
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {activeTab === 'text' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Text</label>
                <textarea
                  value={textOverlay.text}
                  onChange={(e) => setTextOverlay({ ...textOverlay, text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-primary border border-border resize-none"
                  rows={3}
                  placeholder="Enter overlay text..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time (s)</label>
                  <input
                    type="number"
                    min={0}
                    value={textOverlay.startTime}
                    onChange={(e) => setTextOverlay({ ...textOverlay, startTime: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time (s)</label>
                  <input
                    type="number"
                    min={0}
                    value={textOverlay.endTime}
                    onChange={(e) => setTextOverlay({ ...textOverlay, endTime: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Position</label>
                <select
                  value={textOverlay.position}
                  onChange={(e) => setTextOverlay({ ...textOverlay, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                >
                  {positionPresets.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Font Size</label>
                  <input
                    type="number"
                    min={8}
                    max={72}
                    value={textOverlay.fontSize}
                    onChange={(e) => setTextOverlay({ ...textOverlay, fontSize: parseInt(e.target.value) || 24 })}
                    className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Opacity</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={textOverlay.opacity}
                    onChange={(e) => setTextOverlay({ ...textOverlay, opacity: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
              
              <button
                onClick={handleAddTextOverlay}
                disabled={!textOverlay.text.trim()}
                className="w-full px-4 py-2 rounded-lg bg-accent text-primary font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Text Overlay
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload Image</label>
                <input
                  type="file"
                  accept="image/*,.png,.jpg,.jpeg,.gif,.webp"
                  onChange={handleImageSelect}
                  className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                />
                {imageFile && (
                  <span className="text-sm text-text-secondary mt-1 block">{imageFile.name}</span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time (s)</label>
                  <input
                    type="number"
                    min={0}
                    value={imageOverlay.startTime}
                    onChange={(e) => setImageOverlay({ ...imageOverlay, startTime: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time (s)</label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    value={imageOverlay.endTime || ''}
                    onChange={(e) => setImageOverlay({ ...imageOverlay, endTime: e.target.value ? parseFloat(e.target.value) : null })}
                    className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Position</label>
                <select
                  value={imageOverlay.position}
                  onChange={(e) => setImageOverlay({ ...imageOverlay, position: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
                >
                  {positionPresets.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Scale</label>
                <input
                  type="range"
                  min={10}
                  max={200}
                  value={imageOverlay.scale}
                  onChange={(e) => setImageOverlay({ ...imageOverlay, scale: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-sm text-text-secondary">{imageOverlay.scale}%</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Opacity</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={imageOverlay.opacity}
                  onChange={(e) => setImageOverlay({ ...imageOverlay, opacity: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-sm text-text-secondary">{imageOverlay.opacity}%</div>
              </div>
              
              <button
                onClick={handleAddImageOverlay}
                disabled={!imageFile}
                className="w-full px-4 py-2 rounded-lg bg-accent text-primary font-medium hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Image Overlay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}