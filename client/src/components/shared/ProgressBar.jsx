import React from "react";

export default function ProgressBar({ value, max, colour = "#3b82f6", showLabel = false, height = 6 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full">
      <div
        className="w-full rounded-full bg-border overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: colour }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-text-muted mt-1">{Math.round(pct)}%</p>
      )}
    </div>
  );
}
