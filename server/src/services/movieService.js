import mongoose from 'mongoose';
import Movie from '../models/Movie.js';
import { AppError } from '../utils/AppError.js';
import { detectCycle, getRewatchOrder } from './rewatchOrder.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Loads all movies into an in-memory Map by their string ID.
 */
async function loadMovieMap() {
  const movies = await Movie.find({});
  const movieMap = new Map();
  for (const movie of movies) {
    movieMap.set(movie._id.toString(), movie);
  }
  return movieMap;
}

export async function getAllMovies() {
  return Movie.find({});
}

export async function createMovie(data) {
  const { title, releaseYear, runtime, prerequisites = [], watched } = data;

  // Case-insensitive title uniqueness check
  if (typeof title === 'string' && title.trim()) {
    const existing = await Movie.findOne({
      title: { $regex: new RegExp(`^${escapeRegex(title.trim())}$`, 'i') },
    });
    if (existing) {
      throw new AppError(
        409,
        'DUPLICATE',
        'Movie with this title already exists'
      );
    }
  }

  // Deduplicate prerequisite IDs before saving
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
    if (cleanPrerequisites.includes(movie._id.toString())) {
      throw new AppError(
        409,
        'CIRCULAR_DEPENDENCY',
        'Movie cannot depend on itself'
      );
    }

    const movieMap = await loadMovieMap();

    // Verify all prerequisites exist in DB
    for (const prereqId of cleanPrerequisites) {
      if (!mongoose.Types.ObjectId.isValid(prereqId)) {
        throw new AppError(
          400,
          'INVALID_ID',
          `Invalid prerequisite id: ${prereqId}`
        );
      }
      if (!movieMap.has(prereqId)) {
        throw new AppError(
          400,
          'INVALID_PREREQUISITES',
          `Prerequisite movie ${prereqId} does not exist`
        );
      }
    }

    // Verify no direct or indirect cycle
    if (detectCycle(movie._id, cleanPrerequisites, movieMap)) {
      throw new AppError(
        409,
        'CIRCULAR_DEPENDENCY',
        'Movie cannot depend on itself directly or indirectly'
      );
    }
  }

  await movie.save();
  return movie;
}

export async function updateMovie(id, updates) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid id');
  }

  const movie = await Movie.findById(id);
  if (!movie) {
    throw new AppError(404, 'NOT_FOUND', 'Movie not found');
  }

  // Handle title update with case-insensitive uniqueness check
  if (updates.title !== undefined) {
    const trimmedTitle =
      typeof updates.title === 'string' ? updates.title.trim() : '';
    if (!trimmedTitle) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Title cannot be empty');
    }

    const duplicate = await Movie.findOne({
      title: { $regex: new RegExp(`^${escapeRegex(trimmedTitle)}$`, 'i') },
      _id: { $ne: movie._id },
    });

    if (duplicate) {
      throw new AppError(
        409,
        'DUPLICATE',
        'Movie with this title already exists'
      );
    }

    movie.title = trimmedTitle;
  }

  // Handle prerequisites update
  if (updates.prerequisites !== undefined) {
    const rawPrereqs = updates.prerequisites;
    if (!Array.isArray(rawPrereqs)) {
      throw new AppError(
        400,
        'VALIDATION_ERROR',
        'Prerequisites must be an array'
      );
    }

    const cleanPrerequisites = [
      ...new Set(rawPrereqs.map((p) => p.toString())),
    ];

    if (cleanPrerequisites.includes(movie._id.toString())) {
      throw new AppError(
        409,
        'CIRCULAR_DEPENDENCY',
        'Movie cannot depend on itself'
      );
    }

    if (cleanPrerequisites.length > 0) {
      const movieMap = await loadMovieMap();

      for (const prereqId of cleanPrerequisites) {
        if (!mongoose.Types.ObjectId.isValid(prereqId)) {
          throw new AppError(
            400,
            'INVALID_ID',
            `Invalid prerequisite id: ${prereqId}`
          );
        }
        if (!movieMap.has(prereqId)) {
          throw new AppError(
            400,
            'INVALID_PREREQUISITES',
            `Prerequisite movie ${prereqId} does not exist`
          );
        }
      }

      if (detectCycle(movie._id, cleanPrerequisites, movieMap)) {
        throw new AppError(
          409,
          'CIRCULAR_DEPENDENCY',
          'Movie cannot depend on itself directly or indirectly'
        );
      }
    }

    movie.prerequisites = cleanPrerequisites;
  }

  // Only apply allowed scalar fields
  const allowedFields = ['releaseYear', 'runtime', 'watched'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      movie[field] = updates[field];
    }
  }

  await movie.save();
  return movie;
}

export async function getMovieRewatchOrder(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid id');
  }

  const movieMap = await loadMovieMap();
  if (!movieMap.has(id)) {
    throw new AppError(404, 'NOT_FOUND', 'Movie not found');
  }

  return getRewatchOrder(id, movieMap);
}
