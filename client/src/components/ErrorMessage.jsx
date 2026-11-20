const ERROR_DESCRIPTIONS = {
  CIRCULAR_DEPENDENCY:
    'Circular dependency detected! A movie cannot depend on itself or form an indirect dependency loop.',
  DUPLICATE: 'A movie with this title already exists. Titles must be unique.',
  INVALID_ID: 'Invalid ID format provided. Please verify your selection.',
  NOT_FOUND: 'The requested movie or cinema could not be found.',
  VALIDATION_ERROR: 'Please check your input values and try again.',
};

export default function ErrorMessage({ error, onClose }) {
  if (!error) return null;

  const rawMessage = typeof error === 'string' ? error : error.message;
  const code = error.code || null;
  const friendlyMessage =
    (code && ERROR_DESCRIPTIONS[code]) ||
    rawMessage ||
    'An unexpected error occurred.';

  return (
    <div className="alert-error" role="alert">
      <div className="alert-icon">⚠️</div>
      <div className="alert-content">
        {code && <span className="error-code-badge">{code}</span>}
        <span className="error-text">{friendlyMessage}</span>
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
