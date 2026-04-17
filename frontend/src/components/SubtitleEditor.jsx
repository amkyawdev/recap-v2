import { useState, useEffect } from 'react';

function formatTimestamp(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00:00,000';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function parseTimestamp(timestamp) {
  const match = timestamp.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
  if (!match) return 0;
  return (
    parseInt(match[1]) * 3600 +
    parseInt(match[2]) * 60 +
    parseInt(match[3]) +
    parseInt(match[4]) / 1000
  );
}

export default function SubtitleEditor({
  subtitles = [],
  onChange,
  onSelect,
  selectedId,
  currentTime,
  className = ''
}) {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  
  // Sync subtitles prop to state
  useEffect(() => {
    setEntries(subtitles);
  }, [subtitles]);
  
  const handleEntryClick = (entry) => {
    onSelect?.(entry);
  };
  
  const handleDoubleClick = (entry) => {
    setEditingId(entry.index);
    setEditText(entry.text);
    setEditStartTime(formatTimestamp(entry.startTime));
    setEditEndTime(formatTimestamp(entry.endTime));
  };
  
  const handleSaveEdit = () => {
    if (!editingId) return;
    
    const newEntries = entries.map(entry => {
      if (entry.index === editingId) {
        return {
          ...entry,
          text: editText,
          startTime: parseTimestamp(editStartTime),
          endTime: parseTimestamp(editEndTime)
        };
      }
      return entry;
    });
    
    setEntries(newEntries);
    onChange?.(newEntries);
    setEditingId(null);
  };
  
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
    setEditStartTime('');
    setEditEndTime('');
  };
  
  const handleDelete = (index) => {
    const newEntries = entries
      .filter((_, i) => i !== index)
      .map((entry, i) => ({ ...entry, index: i + 1 }));
    
    setEntries(newEntries);
    onChange?.(newEntries);
  };
  
  const handleAdd = () => {
    const newEntry = {
      index: entries.length + 1,
      startTime: currentTime || 0,
      endTime: (currentTime || 0) + 3,
      text: 'New subtitle'
    };
    
    const newEntries = [...entries, newEntry];
    setEntries(newEntries);
    onChange?.(newEntries);
  };
  
  const handleSplit = (index) => {
    const entry = entries[index];
    const midTime = (entry.startTime + entry.endTime) / 2;
    
    const entry1 = { ...entry, endTime: midTime };
    const entry2 = { ...entry, startTime: midTime, index: index + 2 };
    
    const newEntries = [
      ...entries.slice(0, index),
      entry1,
      entry2,
      ...entries.slice(index + 1).map(e => ({ ...e, index: e.index + 1 }))
    ];
    
    setEntries(newEntries);
    onChange?.(newEntries);
  };
  
  const handleMerge = (index) => {
    if (index >= entries.length - 1) return;
    
    const entry1 = entries[index];
    const entry2 = entries[index + 1];
    
    const merged = {
      ...entry1,
      endTime: entry2.endTime,
      text: entry1.text + '\n' + entry2.text
    };
    
    const newEntries = [
      ...entries.slice(0, index),
      merged,
      ...entries.slice(index + 2).map((e, i) => ({ ...e, index: e.index - 1 }))
    ];
    
    setEntries(newEntries);
    onChange?.(newEntries);
  };
  
  // Check if entry is active based on current video time
  const isActive = (entry) => {
    return currentTime >= entry.startTime && currentTime <= entry.endTime;
  };
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Subtitles</h2>
        <button
          onClick={handleAdd}
          className="px-3 py-1.5 rounded-lg bg-accent text-primary font-medium hover:bg-accent/80 transition-colors text-sm"
        >
          + Add Subtitle
        </button>
      </div>
      
      {/* Subtitle list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {entries.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            No subtitles yet. Upload a video with subtitles or add new entries.
          </div>
        ) : (
          entries.map((entry, index) => (
            <div
              key={entry.index}
              onClick={() => handleEntryClick(entry)}
              onDoubleClick={() => handleDoubleClick(entry)}
              className={`p-3 rounded-lg border transition-all cursor-pointer ${
                isActive(entry)
                  ? 'border-accent bg-accent/10'
                  : selectedId === entry.index
                  ? 'border-accent/50 bg-secondary'
                  : 'border-border hover:border-text-secondary'
              }`}
            >
              {editingId === entry.index ? (
                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2 text-sm">
                    <div className="flex-1">
                      <label className="text-text-secondary text-xs">Start</label>
                      <input
                        type="text"
                        value={editStartTime}
                        onChange={setEditStartTime}
                        className="w-full px-2 py-1 rounded bg-primary border border-border font-mono text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-text-secondary text-xs">End</label>
                      <input
                        type="text"
                        value={editEndTime}
                        onChange={setEditEndTime}
                        className="w-full px-2 py-1 rounded bg-primary border border-border font-mono text-sm"
                      />
                    </div>
                  </div>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="w-full px-2 py-1 rounded bg-primary border border-border text-sm resize-none"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-3 py-1 rounded bg-success text-white text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 rounded bg-border text-text-primary text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-text-secondary">
                      {formatTimestamp(entry.startTime)} - {formatTimestamp(entry.endTime)}
                    </span>
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleSplit(index)}
                        className="p-1 rounded hover:bg-border text-xs text-text-secondary"
                        title="Split"
                      >
                        Split
                      </button>
                      <button
                        onClick={() => handleMerge(index)}
                        className="p-1 rounded hover:bg-border text-xs text-text-secondary"
                        title="Merge with next"
                        disabled={index >= entries.length - 1}
                      >
                        Merge
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="p-1 rounded hover:bg-error/20 text-xs text-error"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <p className="text-sm">{entry.text}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}