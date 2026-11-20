import { useState, useEffect } from 'react';
import { getMovies, getRewatchOrder, updateMovie } from '../api.js';
import ErrorMessage from '../components/ErrorMessage.jsx';
import SuccessMessage from '../components/SuccessMessage.jsx';
import ProgressBar from '../components/ProgressBar.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

// Helper to format minutes into "Xh Ym" or "Ym"
function formatRuntime(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export default function RewatchPlanPage() {
  const [movies, setMovies] = useState([]);
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [rewatchData, setRewatchData] = useState(null);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Load movies on mount
  useEffect(() => {
    async function loadMovies() {
      try {
        setLoadingMovies(true);
        const data = await getMovies();
        setMovies(data);
        // Default select Avengers: Doomsday if found, or first movie
        const doomsday = data.find((m) =>
          m.title.toLowerCase().includes('doomsday')
        );
        if (doomsday) {
          setSelectedMovieId(doomsday._id);
        } else if (data.length > 0) {
          setSelectedMovieId(data[0]._id);
        }
      } catch (err) {
        setError(err);
      } finally {
        setLoadingMovies(false);
      }
    }
    loadMovies();
  }, []);

  // Fetch rewatch order when selectedMovieId changes
  const fetchPlan = async (movieId) => {
    if (!movieId) return;
    try {
      setLoadingPlan(true);
      setError(null);
      const data = await getRewatchOrder(movieId);
      setRewatchData(data);
    } catch (err) {
      setError(err);
      setRewatchData(null);
    } finally {
      setLoadingPlan(false);
    }
  };

  useEffect(() => {
    if (selectedMovieId) {
      fetchPlan(selectedMovieId);
    }
  }, [selectedMovieId]);

  // Toggle watched checkbox on an item in the rewatch order
  const handleToggleWatched = async (movie) => {
    const updatedWatched = !movie.watched;

    // Optimistically update order in rewatchData
    if (rewatchData) {
      const updatedOrder = rewatchData.order.map((m) =>
        m._id === movie._id ? { ...m, watched: updatedWatched } : m
      );
      const watchedCount = updatedOrder.filter((m) => m.watched).length;
      const remainingRuntime = updatedOrder
        .filter((m) => !m.watched)
        .reduce((sum, m) => sum + (m.runtime || 0), 0);

      setRewatchData({
        ...rewatchData,
        order: updatedOrder,
        watchedCount,
        remainingRuntime,
      });
    }

    try {
      await updateMovie(movie._id, { watched: updatedWatched });
      setSuccessMessage(
        `"${movie.title}" marked as ${updatedWatched ? 'watched' : 'unwatched'}.`
      );
    } catch (err) {
      // Refresh on error
      setError(err);
      fetchPlan(selectedMovieId);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Rewatch Order Plan</h1>
        <p className="page-subtitle">
          Calculate the optimal prerequisite order to prepare for your target
          movie.
        </p>
      </div>

      <SuccessMessage
        message={successMessage}
        onClose={() => setSuccessMessage(null)}
      />
      <ErrorMessage error={error} onClose={() => setError(null)} />

      {loadingMovies ? (
        <div className="card loading-state">
          <LoadingSpinner text="Loading movies..." />
        </div>
      ) : movies.length === 0 ? (
        <div className="card empty-state">
          <div className="empty-state-icon">🎬</div>
          <div className="empty-state-title">No movies available</div>
          <p className="empty-state-desc">
            Please add movies first from the Movies page to calculate a rewatch
            order.
          </p>
        </div>
      ) : (
        <>
          <div className="card plan-selector-card">
            <div className="form-group">
              <label htmlFor="target-movie-select">Select Target Movie</label>
              <select
                id="target-movie-select"
                className="select-input"
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
                disabled={loadingPlan}
              >
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.releaseYear}) - {m.runtime} min
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingPlan ? (
            <div className="card loading-state">
              <LoadingSpinner text="Calculating rewatch plan..." />
            </div>
          ) : rewatchData ? (
            <div className="plan-results">
              {/* Summary / Progress Card */}
              <div className="card plan-summary-card">
                <div className="plan-summary-header">
                  <div>
                    <span className="summary-eyebrow">Target Goal</span>
                    <h2 className="summary-target-title">
                      {rewatchData.target?.title} (
                      {rewatchData.target?.releaseYear})
                    </h2>
                  </div>
                  <div className="remaining-time-badge">
                    <span className="remaining-label">
                      Remaining Watch Time
                    </span>
                    <span className="remaining-value">
                      {formatRuntime(rewatchData.remainingRuntime)}
                    </span>
                  </div>
                </div>

                <ProgressBar
                  watchedCount={rewatchData.watchedCount}
                  totalCount={rewatchData.totalCount}
                />
              </div>

              {/* Ordered Prerequisites List */}
              <div className="card plan-list-card">
                <div className="card-header-row">
                  <h3 className="card-title">
                    Prerequisite Order ({rewatchData.totalCount}{' '}
                    {rewatchData.totalCount === 1 ? 'movie' : 'movies'})
                  </h3>
                  <span className="order-note">
                    Topological post-order (watch from 1 to{' '}
                    {rewatchData.totalCount || 1})
                  </span>
                </div>

                {rewatchData.order.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">✨</div>
                    <div className="empty-state-title">
                      No prerequisites needed!
                    </div>
                    <p className="empty-state-desc">
                      You can watch <strong>{rewatchData.target?.title}</strong>{' '}
                      directly without needing prior movies.
                    </p>
                  </div>
                ) : (
                  <ol className="ordered-list">
                    {rewatchData.order.map((movie, index) => (
                      <li
                        key={movie._id}
                        className={`ordered-item ${
                          movie.watched ? 'is-watched' : ''
                        }`}
                      >
                        <div className="item-number">
                          {movie.watched ? '✓' : index + 1}
                        </div>
                        <div className="item-content">
                          <div className="item-title-row">
                            <span className="item-title">{movie.title}</span>
                            <span className="item-year">
                              ({movie.releaseYear})
                            </span>
                          </div>
                          <div className="item-meta">
                            <span>⏱ {movie.runtime} min</span>
                          </div>
                        </div>

                        <div className="item-status">
                          <label className="checkbox-pill">
                            <input
                              type="checkbox"
                              checked={movie.watched}
                              onChange={() => handleToggleWatched(movie)}
                            />
                            <span
                              className={`pill-text ${
                                movie.watched ? 'pill-watched' : ''
                              }`}
                            >
                              {movie.watched ? '✓ Watched' : '○ Mark Watched'}
                            </span>
                          </label>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
