const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Common fetch helper that automatically handles JSON serialization
 * and formats backend error responses { error: { code, message } }.
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.code = data?.error?.code || 'UNKNOWN_ERROR';
    error.status = response.status;
    throw error;
  }

  return data;
}

// Movies API
export async function getMovies() {
  return request('/movies');
}

export async function createMovie(movieData) {
  return request('/movies', {
    method: 'POST',
    body: JSON.stringify(movieData),
  });
}

export async function updateMovie(id, updateData) {
  return request(`/movies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
}

export async function getRewatchOrder(movieId) {
  return request(`/movies/${movieId}/rewatch-order`);
}

// Cinemas API
export async function getCinemas() {
  return request('/cinemas');
}

export async function createCinema(cinemaData) {
  return request('/cinemas', {
    method: 'POST',
    body: JSON.stringify(cinemaData),
  });
}

export async function getBookingQuote(cinemaId, groupSize) {
  return request(`/cinemas/${cinemaId}/booking?groupSize=${encodeURIComponent(groupSize)}`);
}
