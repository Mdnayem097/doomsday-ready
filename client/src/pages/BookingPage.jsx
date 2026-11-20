import { useState, useEffect } from 'react';
import { getCinemas, getBookingQuote, createCinema } from '../api.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import SuccessMessage from '../components/SuccessMessage.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function BookingPage() {
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState(6);
  const [quote, setQuote] = useState(null);
  const [loadingCinemas, setLoadingCinemas] = useState(true);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // New cinema modal / form state
  const [showAddCinema, setShowAddCinema] = useState(false);
  const [newCinemaName, setNewCinemaName] = useState('');
  const [newCinemaSizes, setNewCinemaSizes] = useState('5, 10, 25');
  const [newCinemaError, setNewCinemaError] = useState(null);
  const [isCreatingCinema, setIsCreatingCinema] = useState(false);

  // Fetch cinemas on mount
  const fetchCinemasList = async () => {
    try {
      setLoadingCinemas(true);
      setError(null);
      const data = await getCinemas();
      setCinemas(data);
      if (data.length > 0 && !selectedCinemaId) {
        setSelectedCinemaId(data[0]._id);
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoadingCinemas(false);
    }
  };

  useEffect(() => {
    fetchCinemasList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Request booking quote
  const handleGetQuote = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCinemaId) return;

    const sizeNum = Number(groupSize);
    if (!Number.isInteger(sizeNum) || sizeNum < 1 || sizeNum > 10000) {
      setError({
        code: 'VALIDATION_ERROR',
        message: 'Group size must be an integer between 1 and 10000.',
      });
      return;
    }

    try {
      setLoadingQuote(true);
      setError(null);
      const result = await getBookingQuote(selectedCinemaId, sizeNum);
      setQuote(result);
    } catch (err) {
      setError(err);
      setQuote(null);
    } finally {
      setLoadingQuote(false);
    }
  };

  // Automatically fetch quote when cinema or groupSize changes
  useEffect(() => {
    if (selectedCinemaId && groupSize > 0) {
      handleGetQuote();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCinemaId]);

  // Create Cinema Handler with client validation
  const handleCreateCinema = async (e) => {
    e.preventDefault();
    setNewCinemaError(null);

    const name = newCinemaName.trim();
    if (!name) {
      setNewCinemaError({ message: 'Cinema name is required.' });
      return;
    }

    const rawParts = newCinemaSizes.split(',').map((s) => s.trim());
    if (rawParts.length === 0 || rawParts.some((s) => s === '')) {
      setNewCinemaError({
        message:
          'Please enter valid comma-separated integers (e.g. "5, 10, 25").',
      });
      return;
    }

    const parsedSizes = rawParts.map((s) => Number(s));
    if (parsedSizes.some((n) => !Number.isInteger(n) || n < 1 || n > 500)) {
      setNewCinemaError({
        message: 'All bundle sizes must be integers between 1 and 500.',
      });
      return;
    }

    const uniqueSizes = [...new Set(parsedSizes)];
    if (uniqueSizes.length < 1 || uniqueSizes.length > 10) {
      setNewCinemaError({
        message: 'A cinema must have between 1 and 10 bundle sizes.',
      });
      return;
    }

    setIsCreatingCinema(true);

    try {
      const created = await createCinema({
        name,
        bundleSizes: uniqueSizes,
      });

      setShowAddCinema(false);
      setNewCinemaName('');
      setNewCinemaSizes('5, 10, 25');
      setSuccessMessage(`Cinema "${name}" created successfully!`);
      await fetchCinemasList();
      setSelectedCinemaId(created._id);
    } catch (err) {
      setNewCinemaError(err);
    } finally {
      setIsCreatingCinema(false);
    }
  };

  const selectedCinema = cinemas.find((c) => c._id === selectedCinemaId);

  // Helper string representation like "4 bundles: 5 x 1, 2 x 3"
  const formatResultHeadline = (bundles, total) => {
    if (!bundles || bundles.length === 0) return '';
    const formula = bundles.map((b) => `${b.size} x ${b.count}`).join(', ');
    const bundleWord = total === 1 ? 'bundle' : 'bundles';
    return `${total} ${bundleWord}: ${formula}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Cinema Group Booking</h1>
        <p className="page-subtitle">
          Find the minimum bundle combination for any group size using optimal
          dynamic programming.
        </p>
      </div>

      <SuccessMessage
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />
      <ErrorMessage error={error} onClose={() => setError(null)} />

      {loadingCinemas ? (
        <div className="card loading-state">
          <LoadingSpinner text="Loading cinemas..." />
        </div>
      ) : cinemas.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">🎟️</div>
          <div className="empty-state-title">No cinemas available</div>
          <p className="empty-state-desc">
            Add a cinema using the button below to start booking tickets.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '1rem' }}
            onClick={() => setShowAddCinema(true)}
          >
            + Add Cinema
          </button>
        </div>
      ) : (
        <div className="booking-layout">
          {/* Input Card */}
          <div className="card booking-input-card">
            <div className="card-header-row">
              <h2 className="card-title">Booking Details</h2>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setShowAddCinema(true)}
              >
                + Add Cinema
              </button>
            </div>

            <form onSubmit={handleGetQuote} className="booking-form">
              <div className="form-group">
                <label htmlFor="cinema-select">Cinema</label>
                <select
                  id="cinema-select"
                  className="select-input"
                  value={selectedCinemaId}
                  onChange={(e) => setSelectedCinemaId(e.target.value)}
                  disabled={loadingCinemas || loadingQuote}
                >
                  {cinemas.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} (Sizes: {c.bundleSizes.join(', ')})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCinema && (
                <div className="cinema-info-badge">
                  <span className="badge-title">Available Ticket Bundles:</span>
                  <div className="bundle-chips">
                    {selectedCinema.bundleSizes.map((sz) => (
                      <span key={sz} className="chip">
                        {sz} {sz === 1 ? 'seat' : 'seats'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="group-size">
                  Group Size (People: 1 - 10000)
                </label>
                <input
                  id="group-size"
                  type="number"
                  min="1"
                  max="10000"
                  required
                  className="number-input"
                  value={groupSize}
                  onChange={(e) => setGroupSize(e.target.value)}
                  disabled={loadingQuote}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loadingQuote || !selectedCinemaId}
              >
                {loadingQuote
                  ? 'Calculating Quote...'
                  : 'Calculate Optimal Bundles'}
              </button>
            </form>
          </div>

          {/* Results Card */}
          <div className="card booking-results-card">
            <h2 className="card-title">Optimal Quote</h2>

            {loadingQuote ? (
              <div className="loading-state">
                <LoadingSpinner text="Finding optimal bundle combination..." />
              </div>
            ) : !quote ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎟️</div>
                <div className="empty-state-title">Ready to calculate</div>
                <p className="empty-state-desc">
                  Select a cinema and enter group size to view optimal bundles.
                </p>
              </div>
            ) : quote.possible ? (
              <div className="quote-success">
                <div className="quote-hero">
                  <div className="quote-stat">
                    <span className="stat-number">{quote.totalBundles}</span>
                    <span className="stat-label">
                      {quote.totalBundles === 1 ? 'Bundle' : 'Bundles'}
                    </span>
                  </div>
                  <div className="quote-summary-text">
                    <span className="summary-formula">
                      {formatResultHeadline(quote.bundles, quote.totalBundles)}
                    </span>
                    <span className="summary-subtext">
                      Exact match for {groupSize} seats with minimum bundle
                      purchase.
                    </span>
                  </div>
                </div>

                <div className="bundles-breakdown">
                  <h3 className="breakdown-title">Bundle Breakdown</h3>
                  <div className="bundle-cards-list">
                    {quote.bundles.map((b) => (
                      <div key={b.size} className="bundle-card">
                        <div className="bundle-size-circle">{b.size}</div>
                        <div className="bundle-details">
                          <span className="bundle-title">
                            Bundle of {b.size} {b.size === 1 ? 'seat' : 'seats'}
                          </span>
                          <span className="bundle-sub">
                            Quantity to buy: <strong>{b.count}</strong>
                          </span>
                        </div>
                        <div className="bundle-total-seats">
                          {b.size * b.count} seats
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="quote-impossible">
                <div className="impossible-icon">🚫</div>
                <h3 className="impossible-title">Not Possible</h3>
                <p className="impossible-desc">
                  {quote.message ||
                    `Cannot seat exactly ${groupSize} people with the available bundle sizes.`}
                </p>
                <div className="impossible-tip">
                  💡 <strong>Tip:</strong> Group size of {groupSize} cannot be
                  formed exactly using bundle sizes [
                  {selectedCinema?.bundleSizes.join(', ')}]. Try adjusting your
                  group size or selecting a different cinema.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Cinema Modal */}
      {showAddCinema && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">Add New Cinema</h3>
            <p className="modal-subtitle">
              Configure bundle sizes (1 to 10 sizes, each 1 to 500).
            </p>

            <ErrorMessage
              error={newCinemaError}
              onClose={() => setNewCinemaError(null)}
            />

            <form onSubmit={handleCreateCinema} className="modal-form">
              <div className="form-group">
                <label htmlFor="new-cinema-name">Cinema Name *</label>
                <input
                  id="new-cinema-name"
                  type="text"
                  required
                  placeholder="e.g. Stark Starkplex"
                  value={newCinemaName}
                  onChange={(e) => setNewCinemaName(e.target.value)}
                  disabled={isCreatingCinema}
                />
              </div>

              <div className="form-group">
                <label htmlFor="new-cinema-sizes">
                  Bundle Sizes (comma-separated, 1-500) *
                </label>
                <input
                  id="new-cinema-sizes"
                  type="text"
                  required
                  placeholder="e.g. 1, 3, 4"
                  value={newCinemaSizes}
                  onChange={(e) => setNewCinemaSizes(e.target.value)}
                  disabled={isCreatingCinema}
                />
                <small className="help-text">
                  Enter 1 to 10 unique integers (e.g. &ldquo;2, 5&rdquo; or
                  &ldquo;6, 9, 20&rdquo;)
                </small>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddCinema(false)}
                  disabled={isCreatingCinema}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreatingCinema}
                >
                  {isCreatingCinema ? 'Creating...' : 'Create Cinema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
