import { useState } from 'react';

const fontFamilies = [
  { name: 'Arial', label: 'Arial' },
  { name: 'Roboto', label: 'Roboto' },
  { name: 'Montserrat', label: 'Montserrat' },
  { name: 'Open Sans', label: 'Open Sans' },
  { name: 'Lato', label: 'Lato' },
  { name: 'Ubuntu', label: 'Ubuntu' },
  { name: 'Inter', label: 'Inter' },
  { name: 'Poppins', label: 'Poppins' }
];

export default function SubtitleDialog({
  isOpen,
  onClose,
  style: initialStyle = {},
  onApply,
  onSavePreset
}) {
  const [style, setStyle] = useState({
    fontSize: initialStyle.fontSize || '24px',
    fontColor: initialStyle.fontColor || '#FFFFFF',
    bgColor: initialStyle.bgColor || 'rgba(0, 0, 0, 0.5)',
    bgOpacity: initialStyle.bgOpacity || 50,
    fontFamily: initialStyle.fontFamily || 'Arial',
    ...initialStyle
  });
  
  const handleFontSizeChange = (e) => {
    const value = e.target.value;
    setStyle({ ...style, fontSize: `${value}px` });
  };
  
  const handleFontColorChange = (e) => {
    setStyle({ ...style, fontColor: e.target.value });
  };
  
  const handleBgColorChange = (e) => {
    setStyle({ ...style, bgColor: e.target.value });
  };
  
  const handleBgOpacityChange = (e) => {
    const opacity = e.target.value;
    const bgValue = style.bgColor.split('@')[0] || '#000000';
    const newBgColor = opacity < 100 ? `${bgValue}@${opacity}` : bgValue;
    setStyle({ ...style, bgOpacity: opacity, bgColor: newBgColor });
  };
  
  const handleFontFamilyChange = (e) => {
    setStyle({ ...style, fontFamily: e.target.value });
  };
  
  const handleApply = () => {
    onApply?.(style);
    onClose();
  };
  
  const handleReset = () => {
    const defaultStyle = {
      fontSize: '24px',
      fontColor: '#FFFFFF',
      bgColor: 'rgba(0, 0, 0, 0.5)',
      bgOpacity: 50,
      fontFamily: 'Arial'
    };
    setStyle(defaultStyle);
    onApply?.(defaultStyle);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="dialog-backdrop animate-fadeIn" onClick={onClose}>
      <div
        className="bg-secondary rounded-xl shadow-2xl w-full max-w-md mx-4 animate-slideUp"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Subtitle Style</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-border transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Font Size */}
          <div>
            <label className="block text-sm font-medium mb-2">Font Size</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={12}
                max={48}
                value={parseInt(style.fontSize)}
                onChange={handleFontSizeChange}
                className="flex-1"
              />
              <input
                type="number"
                min={12}
                max={48}
                value={parseInt(style.fontSize)}
                onChange={(e) => setStyle({ ...style, fontSize: `${e.target.value}px` })}
                className="w-16 px-2 py-1 rounded bg-primary border border-border text-center"
              />
              <span className="text-text-secondary text-sm">px</span>
            </div>
          </div>
          
          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium mb-2">Font Family</label>
            <select
              value={style.fontFamily}
              onChange={handleFontFamilyChange}
              className="w-full px-3 py-2 rounded-lg bg-primary border border-border"
            >
              {fontFamilies.map(font => (
                <option key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Font Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Font Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={style.fontColor}
                onChange={handleFontColorChange}
              />
              <input
                type="text"
                value={style.fontColor}
                onChange={(e) => setStyle({ ...style, fontColor: e.target.value })}
                className="flex-1 px-3 py-2 rounded bg-primary border border-border font-mono text-sm"
              />
            </div>
          </div>
          
          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium mb-2">Background Color</label>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={style.bgColor.split('@')[0] || '#000000'}
                  onChange={(e) => setStyle({ ...style, bgColor: `${e.target.value}@${style.bgOpacity}` })}
                />
                <input
                  type="text"
                  value={style.bgColor.split('@')[0] || '#000000'}
                  onChange={(e) => setStyle({ ...style, bgColor: `${e.target.value}@${style.bgOpacity}` })}
                  className="flex-1 px-3 py-2 rounded bg-primary border border-border font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-sm text-text-secondary">Opacity</label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={style.bgOpacity}
                  onChange={handleBgOpacityChange}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-12">{style.bgOpacity}%</span>
              </div>
            </div>
          </div>
          
          {/* Preview */}
          <div>
            <label className="block text-sm font-medium mb-2">Preview</label>
            <div className="bg-primary rounded-lg p-4 flex items-center justify-center min-h-[80px]">
              <span
                style={{
                  fontSize: style.fontSize,
                  color: style.fontColor,
                  backgroundColor: style.bgColor.replace(`@${style.bgOpacity}`, '').replace('@', '') ||
                    `rgba(0, 0, 0, ${style.bgOpacity / 100})`,
                  fontFamily: style.fontFamily,
                  padding: '8px 16px',
                  borderRadius: '6px'
                }}
              >
                Sample Subtitle Text
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-border hover:bg-border transition-colors text-sm"
          >
            Reset
          </button>
          <div className="flex gap-2">
            {onSavePreset && (
              <button
                onClick={() => onSavePreset(style)}
                className="px-4 py-2 rounded-lg border border-border hover:bg-border transition-colors text-sm"
              >
                Save Preset
              </button>
            )}
            <button
              onClick={handleApply}
              className="px-4 py-2 rounded-lg bg-accent text-primary font-medium hover:bg-accent/80 transition-colors text-sm"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}