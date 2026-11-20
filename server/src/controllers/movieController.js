import { asyncHandler } from '../utils/asyncHandler.js';
import * as movieService from '../services/movieService.js';

// POST /api/movies - Create movie
export const createMovie = asyncHandler(async (req, res) => {
  const movie = await movieService.createMovie(req.body);
  res.status(201).json(movie);
});

// GET /api/movies - List movies
export const getMovies = asyncHandler(async (req, res) => {
  const movies = await movieService.getAllMovies();
  res.json(movies);
});

// PATCH /api/movies/:id - Update movie
export const updateMovie = asyncHandler(async (req, res) => {
  const movie = await movieService.updateMovie(req.params.id, req.body);
  res.json(movie);
});

// GET /api/movies/:id/rewatch-order - Get rewatch order
export const getMovieRewatchOrder = asyncHandler(async (req, res) => {
  const order = await movieService.getMovieRewatchOrder(req.params.id);
  res.json(order);
});
