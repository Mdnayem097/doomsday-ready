import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { detectCycle, getRewatchOrder } from '../services/rewatchOrder.js';

// Helper to escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

  // Case-insensitive uniqueness check for title
  if (typeof title === 'string' && title.trim()) {
    const existing = await Movie.findOne({
      title: { $regex: new RegExp(`^${escapeRegex(title.trim())}$`, 'i') },
    });
    if (existing) {
      throw new AppError(409, 'DUPLICATE', 'Movie with this title already exists');
    }
  }

  // Remove duplicate IDs from prerequisites array
  const cleanPrerequisites = Array.isArray(prerequisites)
    ? [...new Set(prerequisites.map((p) => p.toString()))]
    : [];

  const movie = new Movie({
    title,
    releaseYear,
    runtime,
    prerequisites: cleanPrerequisites,
    watched,
  });

  if (cleanPrerequisites.length > 0) {
    // Check self-dependency
    if (cleanPrerequisites.includes(movie._id.toString())) {
      throw new AppError(409, 'CIRCULAR_DEPENDENCY', 'Movie cannot depend on itself');
    }

    const movieMap = await loadMovieMap();

    // Verify all prerequisite IDs are valid ObjectIds and exist in DB
    for (const prereqId of cleanPrerequisites) {
      if (!mongoose.Types.ObjectId.isValid(prereqId)) {
        throw new AppError(400, 'INVALID_ID', `Invalid prerequisite id: ${prereqId}`);
      }
      if (!movieMap.has(prereqId)) {
        throw new AppError(400, 'INVALID_PREREQUISITES', `Prerequisite movie ${prereqId} does not exist`);
      }
    }

    // Verify no circular dependency
    if (detectCycle(movie._id, cleanPrerequisites, movieMap)) {
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

  // Check title uniqueness (case-insensitive) if title is being updated
  if (req.body.title !== undefined) {
    const trimmedTitle = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!trimmedTitle) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Title cannot be empty');
    }

    const duplicate = await Movie.findOne({
      title: { $regex: new RegExp(`^${escapeRegex(trimmedTitle)}$`, 'i') },
      _id: { $ne: movie._id },
    });

    if (duplicate) {
      throw new AppError(409, 'DUPLICATE', 'Movie with this title already exists');
    }

    movie.title = trimmedTitle;
  }

  // Handle prerequisites update if provided
  if (req.body.prerequisites !== undefined) {
    const rawPrereqs = req.body.prerequisites;
    if (!Array.isArray(rawPrereqs)) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Prerequisites must be an array');
    }

    // Remove duplicate IDs from prerequisites array
    const cleanPrerequisites = [...new Set(rawPrereqs.map((p) => p.toString()))];

    // Check self-dependency
    if (cleanPrerequisites.includes(movie._id.toString())) {
      throw new AppError(409, 'CIRCULAR_DEPENDENCY', 'Movie cannot depend on itself');
    }

    if (cleanPrerequisites.length > 0) {
      const movieMap = await loadMovieMap();

      // Verify all prerequisite IDs are valid ObjectIds and exist in DB
      for (const prereqId of cleanPrerequisites) {
        if (!mongoose.Types.ObjectId.isValid(prereqId)) {
          throw new AppError(400, 'INVALID_ID', `Invalid prerequisite id: ${prereqId}`);
        }
        if (!movieMap.has(prereqId)) {
          throw new AppError(400, 'INVALID_PREREQUISITES', `Prerequisite movie ${prereqId} does not exist`);
        }
      }

      // Verify no circular dependency
      if (detectCycle(movie._id, cleanPrerequisites, movieMap)) {
        throw new AppError(409, 'CIRCULAR_DEPENDENCY', 'Movie cannot depend on itself directly or indirectly');
      }
    }

    movie.prerequisites = cleanPrerequisites;
  }

  // Only update strictly allowed scalar fields
  const allowedFields = ['releaseYear', 'runtime', 'watched'];
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
  if (!movieMap.has(req.params.id)) {
    throw new AppError(404, 'NOT_FOUND', 'Movie not found');
  }

  const result = getRewatchOrder(req.params.id, movieMap);
  res.json(result);
});
