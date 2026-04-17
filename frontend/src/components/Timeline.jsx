import { useMemo } from 'react';

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function Timeline({
  duration = 0,
  subtitles = [],
  currentTime = 0,
  onSeek,
  inPoint,
  outPoint,
  onSetInPoint,
  onSetOutPoint,
  className = ''
}) {
  // Calculate total timeline width in seconds
  const timelineDuration = duration || 300; // Default 5 minutes
  
  // Calculate positions
  const getPosition = (time) => {
    return duration > 0 ? (time / timelineDuration) * 100 : 0;
  };
  
  // Convert percentage to time
  const positionToTime = (percent) => {
    return (percent / 100) * timelineDuration;
  };
  
  // Handle click on timeline to seek
  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const time = positionToTime(Math.max(0, Math.min(100, percent)));
    onSeek?.(time);
  };
  
  // Generate time markers
  const markers = useMemo(() => {
    const interval = timelineDuration <= 60 ? 5 : timelineDuration <= 300 ? 30 : 60;
    const result = [];
    for (let t = 0; t <= timelineDuration; t += interval) {
      result.push(t);
    }
    return result;
  }, [timelineDuration]);
  
  return (
    <div className={`bg-secondary rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Timeline</span>
        <div className="flex gap-4 text-sm text-text-secondary font-mono">
          {inPoint !== undefined && (
            <span className="text-success">
              In: {formatTime(inPoint)}
            </span>
          )}
          {outPoint !== undefined && (
            <span className="text-error">
              Out: {formatTime(outPoint)}
            </span>
          )}
        </div>
      </div>
      
      {/* Timeline */}
      <div className="relative h-16 bg-primary rounded-lg overflow-hidden">
        {/* Time markers */}
        <div className="absolute inset-0 flex justify-between px-1 pt-1">
          {markers.map(time => (
            <span key={time} className="text-xs text-text-secondary font-mono">
              {formatTime(time)}
            </span>
          ))}
        </div>
        
        {/* Subtitle track */}
        <div className="absolute bottom-2 left-0 right-0 h-6">
          {subtitles.map((sub, index) => (
            <div
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                onSeek?.(sub.startTime);
              }}
              className="absolute h-full bg-accent/30 border border-accent cursor-pointer hover:bg-accent/50 transition-colors"
              style={{
                left: `${getPosition(sub.startTime)}%`,
                width: `${getPosition(sub.endTime - sub.startTime)}%`
              }}
              title={`${sub.text.substring(0, 30)}...`}
            />
          ))}
        </div>
        
        {/* In/Out point markers */}
        {inPoint !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-success cursor-pointer"
            style={{ left: `${getPosition(inPoint)}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onSetInPoint?.(null);
            }}
            title="Click to remove In point"
          />
        )}
        {outPoint !== undefined && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-error cursor-pointer"
            style={{ left: `${getPosition(outPoint)}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onSetOutPoint?.(null);
            }}
            title="Click to remove Out point"
          />
        )}
        
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-text-primary"
          style={{ left: `${getPosition(currentTime)}%` }}
        >
          <div className="absolute -top-1 -left-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-text-primary" />
        </div>
        
        {/* Click handler */}
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={handleTimelineClick}
        />
      </div>
      
      {/* Trim controls */}
      <div className="flex gap-2 mt-3">
        {inPoint === undefined ? (
          <button
            onClick={() => onSetInPoint?.(currentTime)}
            className="px-3 py-1 rounded border border-success text-success hover:bg-success/10 transition-colors text-sm"
          >
            Set In
          </button>
        ) : (
          <button
            onClick={() => onSetInPoint?.(null)}
            className="px-3 py-1 rounded bg-success text-primary hover:bg-success/80 transition-colors text-sm"
          >
            Clear In
          </button>
        )}
        
        {outPoint === undefined ? (
          <button
            onClick={() => onSetOutPoint?.(currentTime)}
            className="px-3 py-1 rounded border border-error text-error hover:bg-error/10 transition-colors text-sm"
          >
            Set Out
          </button>
        ) : (
          <button
            onClick={() => onSetOutPoint?.(null)}
            className="px-3 py-1 rounded bg-error text-primary hover:bg-error/80 transition-colors text-sm"
          >
            Clear Out
          </button>
        )}
        
        {inPoint !== undefined && outPoint !== undefined && (
          <button
            onClick={() => {
              onSeek?.(inPoint);
              onSetInPoint?.(null);
              onSetOutPoint?.(null);
            }}
            className="px-3 py-1 rounded bg-accent text-primary hover:bg-accent/80 transition-colors text-sm"
          >
            Apply Trim
          </button>
        )}
      </div>
    </div>
  );
}