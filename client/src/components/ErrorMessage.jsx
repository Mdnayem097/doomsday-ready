import React from 'react';

export default function ErrorMessage({ error, onClose }) {
  if (!error) return null;

  const message = typeof error === 'string' ? error : error.message;
  const code = error.code ? `[${error.code}] ` : '';

  return (
    <div className="alert-error" role="alert">
      <div className="alert-icon">⚠️</div>
      <div className="alert-content">
        <strong>Error: </strong>
        <span>
          {code}
          {message}
        </span>
      </div>
      {onClose && (
        <button
          type="button"
          className="alert-close"
          onClick={onClose}
          aria-label="Dismiss error"
        >
          ×
        </button>
      )}
    </div>
  );
}
