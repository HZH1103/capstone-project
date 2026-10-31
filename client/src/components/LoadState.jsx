export default function LoadState({ loading, error, empty, isEmpty = false, onRetry, children }) {
  if (loading) return <p className="notice" role="status" aria-live="polite">Loading...</p>;
  if (error) {
    return (
      <div className="notice notice-error" role="alert">
        <p><strong>Error:</strong> {error}</p>
        {onRetry && (
          <button className="button button-small button-quiet" type="button" onClick={onRetry}>
            Try again <span aria-hidden="true">↻</span>
          </button>
        )}
      </div>
    );
  }
  if (isEmpty) return <p className="notice" role="status">{empty}</p>;
  return children;
}
