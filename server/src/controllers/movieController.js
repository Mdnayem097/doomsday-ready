import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { detectCycle, getRewatchOrder } from '../services/rewatchOrder.js';

/**
 * Loads all movies and stores them in a Map by their string ID.
 */
async function loadMovieMap() {
  const movies = await Movie.find({});
  const movieMap = new Map();
  for (const movie of movies) {
    movieMap.set(movie._id.toString(), movie);
  }
  return movieMap;
}

// POST /api/movies - Create a new movie
export const createMovie = asyncHandler(async (req, res) => {
  const { title, releaseYear, runtime, prerequisites = [], watched } = req.body;

  const movie = new Movie({ title, releaseYear, runtime, prerequisites, watched });

  if (Array.isArray(prerequisites) && prerequisites.length > 0) {
    const movieMap = await loadMovieMap();

    // Verify all prerequisite IDs are valid ObjectIds and exist
    for (const prereqId of prerequisites) {
      const idStr = prereqId.toString();
      if (!mongoose.Types.ObjectId.isValid(idStr)) {
        throw new AppError(400, 'INVALID_ID', 'Invalid id');
      }
      if (!movieMap.has(idStr)) {
        throw new AppError(400, 'INVALID_PREREQUISITES', `Prerequisite movie ${idStr} does not exist`);
      }
    }

    // Verify no circular dependency
    if (detectCycle(movie._id, prerequisites, movieMap)) {
      throw new AppError(409, 'CIRCULAR_DEPENDENCY', 'Movie cannot depend on itself directly or indirectly');
    }
  }

  await movie.save();
  res.status(201).json(movie);
});

// GET /api/movies - List all movies
export const getMovies = asyncHandler(async (req, res) => {
  const movies = await Movie.find({});
  res.json(movies);
});

// PATCH /api/movies/:id - Update an existing movie (only allowed fields)
export const updateMovie = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid id');
  }

  const movie = await Movie.findById(req.params.id);
  if (!movie) {
    throw new AppError(404, 'NOT_FOUND', 'Movie not found');
  }

  // Handle prerequisites update if provided
  if (req.body.prerequisites !== undefined) {
    const prerequisites = req.body.prerequisites;
    if (!Array.isArray(prerequisites)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Prerequisites must be an array');
    }

    if (prerequisites.length > 0) {
      const movieMap = await loadMovieMap();

      // Verify all prerequisite IDs are valid ObjectIds and exist
      for (const prereqId of prerequisites) {
        const idStr = prereqId.toString();
        if (!mongoose.Types.ObjectId.isValid(idStr)) {
          throw new AppError(400, 'INVALID_ID', 'Invalid id');
        }
        if (!movieMap.has(idStr)) {
          throw new AppError(400, 'INVALID_PREREQUISITES', `Prerequisite movie ${idStr} does not exist`);
        }
      }

      // Verify no circular dependency
      if (detectCycle(movie._id, prerequisites, movieMap)) {
        throw new AppError(409, 'CIRCULAR_DEPENDENCY', 'Movie cannot depend on itself directly or indirectly');
      }
    }

    movie.prerequisites = prerequisites;
  }

  // Only update strictly allowed fields
  const allowedFields = ['title', 'releaseYear', 'runtime', 'watched'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      movie[field] = req.body[field];
    }
  }

  await movie.save();
  res.json(movie);
});

// GET /api/movies/:id/rewatch-order - Get rewatch order in DFS post-order
export const getMovieRewatchOrder = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid id');
  }

  const movieMap = await loadMovieMap();
  const result = getRewatchOrder(req.params.id, movieMap);
  res.json(result);
});
