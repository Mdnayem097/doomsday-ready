import React from 'react';

export default function ProgressBar({ watchedCount, totalCount }) {
  const percentage =
    totalCount > 0 ? Math.round((watchedCount / totalCount) * 100) : 0;

  return (
    <div className="progress-container">
      <div className="progress-label">
        <span className="progress-text">
          <strong>{watchedCount}</strong> of <strong>{totalCount}</strong> watched
        </span>
        <span className="progress-pct">{percentage}%</span>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
    </div>
  );
}
