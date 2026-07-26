import React from 'react';

// Renders a simple GitHub-style contribution heatmap from an array of
// "YYYY-MM-DD" date strings. Built with plain CSS grid (no extra npm
// dependency) so it renders identically on desktop and mobile browsers.
function Heatmap({ dates = [], days = 90 }) {
  const dateSet = new Set(dates);
  const cells = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    cells.push({ dateStr, filled: dateSet.has(dateStr) });
  }

  return (
    <div className="heatmap" role="img" aria-label={`Habit check-in heatmap, last ${days} days`}>
      {cells.map((cell) => (
        <div
          key={cell.dateStr}
          className={`heatmap-cell ${cell.filled ? 'filled' : ''}`}
          title={cell.dateStr}
        />
      ))}
    </div>
  );
}

export default Heatmap;
