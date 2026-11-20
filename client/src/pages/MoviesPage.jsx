import { useState, useEffect } from 'react';
import { getMovies, createMovie, updateMovie } from '../api.js';
import ErrorMessage from '../components/ErrorMessage.jsx';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // New movie form state
  const [formData, setFormData] = useState({
    title: '',
    releaseYear: new Date().getFullYear(),
    runtime: 120,
    prerequisites: [],
  });
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit prerequisites modal/inline state
  const [editingMovie, setEditingMovie] = useState(null);
  const [selectedPrereqs, setSelectedPrereqs] = useState([]);
  const [editError, setEditError] = useState(null);
  const [isUpdatingPrereqs, setIsUpdatingPrereqs] = useState(false);

  // Load movies
  const fetchMovieList = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const data = await getMovies();
      setMovies(data);
    } catch (err) {
      setFetchError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovieList();
  }, []);

  // Handle Add Movie
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      await createMovie({
        title: formData.title.trim(),
        releaseYear: Number(formData.releaseYear),
        runtime: Number(formData.runtime),
        prerequisites: formData.prerequisites,
      });

      // Reset form
      setFormData({
        title: '',
        releaseYear: new Date().getFullYear(),
        runtime: 120,
        prerequisites: [],
      });
      await fetchMovieList();
    } catch (err) {
      setFormError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Watched status
  const handleToggleWatched = async (movie) => {
    const updatedWatched = !movie.watched;
    // Optimistic UI update
    setMovies((prev) =>
      prev.map((m) =>
        m._id === movie._id ? { ...m, watched: updatedWatched } : m
      )
    );

    try {
      await updateMovie(movie._id, { watched: updatedWatched });
    } catch (err) {
      // Revert if error
      setMovies((prev) =>
        prev.map((m) =>
          m._id === movie._id ? { ...m, watched: movie.watched } : m
        )
      );
      setFetchError(err);
    }
  };

  // Open Edit Prerequisites
  const handleOpenEditPrereqs = (movie) => {
    setEditingMovie(movie);
    const existingIds = (movie.prerequisites || []).map((p) =>
      p._id ? p._id : p
    );
    setSelectedPrereqs(existingIds);
    setEditError(null);
  };

  // Save Edit Prerequisites
  const handleSavePrereqs = async () => {
    if (!editingMovie) return;
    setEditError(null);
    setIsUpdatingPrereqs(true);

    try {
      await updateMovie(editingMovie._id, {
        prerequisites: selectedPrereqs,
      });
      setEditingMovie(null);
      await fetchMovieList();
    } catch (err) {
      setEditError(err);
    } finally {
      setIsUpdatingPrereqs(false);
    }
  };

  // Helper map for movie title lookup
  const movieTitleMap = new Map(movies.map((m) => [m._id, m.title]));

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">MCU Movies</h1>
        <p className="page-subtitle">
          Manage your watch list, set prerequisites, and track your progress.
        </p>
      </div>

      <ErrorMessage error={fetchError} onClose={() => setFetchError(null)} />

      <div className="movies-layout">
        {/* Left Column: Add Movie Form */}
        <section className="card add-movie-card">
          <h2 className="card-title">Add New Movie</h2>
          <ErrorMessage error={formError} onClose={() => setFormError(null)} />

          <form onSubmit={handleCreateSubmit} className="movie-form">
            <div className="form-group">
              <label htmlFor="movie-title">Title *</label>
              <input
                id="movie-title"
                type="text"
                required
                placeholder="e.g. Iron Man"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="release-year">Release Year *</label>
                <input
                  id="release-year"
                  type="number"
                  required
                  min="1900"
                  max="2100"
                  value={formData.releaseYear}
                  onChange={(e) =>
                    setFormData({ ...formData, releaseYear: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="runtime">Runtime (min) *</label>
                <input
                  id="runtime"
                  type="number"
                  required
                  min="1"
                  max="300"
                  value={formData.runtime}
                  onChange={(e) =>
                    setFormData({ ...formData, runtime: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prerequisites">
                Prerequisites (hold Ctrl/Cmd to select multiple)
              </label>
              <select
                id="prerequisites"
                multiple
                size={Math.min(6, Math.max(3, movies.length))}
                value={formData.prerequisites}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (opt) => opt.value
                  );
                  setFormData({ ...formData, prerequisites: selected });
                }}
                className="multi-select"
              >
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.releaseYear})
                  </option>
                ))}
              </select>
              <small className="help-text">
                {formData.prerequisites.length} prerequisite(s) selected
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding Movie...' : 'Add Movie'}
            </button>
          </form>
        </section>

        {/* Right Column: Movies List */}
        <section className="card movies-list-card">
          <div className="list-header">
            <h2 className="card-title">Movies Collection ({movies.length})</h2>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={fetchMovieList}
              disabled={loading}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="loading-state">Loading movies...</div>
          ) : movies.length === 0 ? (
            <div className="empty-state">
              No movies added yet. Add your first movie above!
            </div>
          ) : (
            <div className="movies-grid">
              {movies.map((movie) => {
                const prereqIds = (movie.prerequisites || []).map((p) =>
                  p._id ? p._id : p
                );

                return (
                  <div
                    key={movie._id}
                    className={`movie-card ${movie.watched ? 'is-watched' : ''}`}
                  >
                    <div className="movie-card-header">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={movie.watched}
                          onChange={() => handleToggleWatched(movie)}
                        />
                        <span className="movie-card-title">{movie.title}</span>
                      </label>
                      <span className="movie-year">{movie.releaseYear}</span>
                    </div>

                    <div className="movie-meta">
                      <span className="meta-item">⏱ {movie.runtime} min</span>
                      <span
                        className={`badge ${
                          movie.watched ? 'badge-success' : 'badge-neutral'
                        }`}
                      >
                        {movie.watched ? '✓ Watched' : '○ Unwatched'}
                      </span>
                    </div>

                    <div className="movie-prereqs-section">
                      <div className="prereqs-title-row">
                        <span className="prereqs-label">Prerequisites:</span>
                        <button
                          type="button"
                          className="btn-link"
                          onClick={() => handleOpenEditPrereqs(movie)}
                        >
                          Edit
                        </button>
                      </div>

                      {prereqIds.length === 0 ? (
                        <span className="no-prereqs">None</span>
                      ) : (
                        <div className="tags-container">
                          {prereqIds.map((pid) => (
                            <span key={pid} className="tag">
                              {movieTitleMap.get(pid) || pid}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Edit Prerequisites Modal */}
      {editingMovie && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 className="modal-title">
              Edit Prerequisites for &quot;{editingMovie.title}&quot;
            </h3>
            <p className="modal-subtitle">
              Select the movies that must be watched before this one.
            </p>

            <ErrorMessage
              error={editError}
              onClose={() => setEditError(null)}
            />

            <div className="modal-checklist">
              {movies
                .filter((m) => m._id !== editingMovie._id) // Cannot select self
                .map((m) => {
                  const isChecked = selectedPrereqs.includes(m._id);
                  return (
                    <label key={m._id} className="checklist-item">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPrereqs([...selectedPrereqs, m._id]);
                          } else {
                            setSelectedPrereqs(
                              selectedPrereqs.filter((id) => id !== m._id)
                            );
                          }
                        }}
                      />
                      <span>
                        {m.title} ({m.releaseYear})
                      </span>
                    </label>
                  );
                })}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setEditingMovie(null)}
                disabled={isUpdatingPrereqs}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSavePrereqs}
                disabled={isUpdatingPrereqs}
              >
                {isUpdatingPrereqs ? 'Saving...' : 'Save Prerequisites'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
