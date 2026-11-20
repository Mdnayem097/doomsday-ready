export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="spinner-wrapper" role="status" aria-live="polite">
      <div className="spinner" />
      {text && <span className="spinner-text">{text}</span>}
    </div>
  );
}
