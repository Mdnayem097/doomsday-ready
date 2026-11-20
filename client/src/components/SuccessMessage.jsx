import { useEffect } from 'react';

export default function SuccessMessage({
  message,
  onClose,
  autoCloseMs = 4000,
}) {
  useEffect(() => {
    if (!message || !autoCloseMs || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [message, onClose, autoCloseMs]);

  if (!message) return null;

  return (
    <div className="alert-success" role="status">
      <div className="alert-icon">✓</div>
      <div className="alert-content">
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          className="alert-close"
          onClick={onClose}
          aria-label="Dismiss message"
        >
          ×
        </button>
      )}
    </div>
  );
}
