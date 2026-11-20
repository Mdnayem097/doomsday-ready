import React, { useState, useEffect } from 'react';
import { getCinemas, getBookingQuote, createCinema } from '../api.js';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function BookingPage() {
  const [cinemas, setCinemas] = useState([]);
  const [selectedCinemaId, setSelectedCinemaId] = useState('');
  const [groupSize, setGroupSize] = useState(6);
  const [quote, setQuote] = useState(null);
  const [loadingCinemas, setLoadingCinemas] = useState(true);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [error, setError] = useState(null);

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
  }, []);

  // Request booking quote
  const handleGetQuote = async (e) => {
    if (e) e.preventDefault();
    if (!selectedCinemaId) return;

    const sizeNum = Number(groupSize);
    if (!Number.isInteger(sizeNum) || sizeNum < 1 || sizeNum > 10000) {
      setError(new Error('Group size must be an integer between 1 and 10000'));
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
  }, [selectedCinemaId]);

  // Create Cinema Handler
  const handleCreateCinema = async (e) => {
    e.preventDefault();
    setNewCinemaError(null);
    setIsCreatingCinema(true);

    try {
      const parsedSizes = newCinemaSizes
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !isNaN(n));

      const created = await createCinema({
        name: newCinemaName.trim(),
        bundleSizes: parsedSizes,
      });

      setShowAddCinema(false);
      setNewCinemaName('');
      setNewCinemaSizes('5, 10, 25');
      await fetchCinemasList();
      setSelectedCinemaId(created._id);
    } catch (err) {
      setNewCinemaError(err);
    } finally {
      setIsCreatingCinema(false);
    }
  };

  const selectedCinema = cinemas.find((c) => c._id === selectedCinemaId);

  // Helper string representation like "5 x 1, 2 x 3 = 4 bundles"
  const formatBundleString = (bundles, total) => {
    if (!bundles || bundles.length === 0) return '';
    const parts = bundles.map((b) => `${b.size} x ${b.count}`);
    return `${parts.join(', ')} = ${total} ${total === 1 ? 'bundle' : 'bundles'}`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Cinema Group Booking</h1>
        <p className="page-subtitle">
          Find the minimum bundle combination for any group size using optimal dynamic programming.
        </p>
      </div>

      <ErrorMessage error={error} onClose={() => setError(null)} />

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
                disabled={loadingCinemas}
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
                      {sz} seats
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="group-size">Group Size (People)</label>
              <input
                id="group-size"
                type="number"
                min="1"
                max="10000"
                required
                className="number-input"
                value={groupSize}
                onChange={(e) => setGroupSize(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loadingQuote || !selectedCinemaId}
            >
              {loadingQuote ? 'Calculating Quote...' : 'Calculate Optimal Bundles'}
            </button>
          </form>
        </div>

        {/* Results Card */}
        <div className="card booking-results-card">
          <h2 className="card-title">Optimal Quote</h2>

          {loadingQuote ? (
            <div className="loading-state">Finding best bundle combination...</div>
          ) : !quote ? (
            <div className="empty-state">
              Select a cinema and enter group size to view optimal bundles.
            </div>
          ) : quote.possible ? (
            <div className="quote-success">
              <div className="quote-hero">
                <div className="quote-stat">
                  <span className="stat-number">{quote.totalBundles}</span>
                  <span className="stat-label">
                    Total {quote.totalBundles === 1 ? 'Bundle' : 'Bundles'}
                  </span>
                </div>
                <div className="quote-summary-text">
                  <span className="summary-formula">
                    {formatBundleString(quote.bundles, quote.totalBundles)}
                  </span>
                  <span className="summary-subtext">
                    Exactly covers {groupSize} seats with minimum bundle purchase.
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
              <p className="impossible-desc">{quote.message}</p>
              <div className="impossible-tip">
                Tip: Group size cannot be formed exactly with the cinema&apos;s available bundle sizes. Try a different group size or cinema.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Cinema Modal */}
      {showAddCinema && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">Add New Cinema</h3>
            <ErrorMessage error={newCinemaError} onClose={() => setNewCinemaError(null)} />

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
                />
                <small className="help-text">
                  Enter 1 to 10 unique integers (e.g. &ldquo;2, 5&rdquo; or &ldquo;6, 9, 20&rdquo;)
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
