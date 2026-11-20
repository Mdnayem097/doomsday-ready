import { asyncHandler } from '../utils/asyncHandler.js';
import * as cinemaService from '../services/cinemaService.js';

// POST /api/cinemas - Create cinema
export const createCinema = asyncHandler(async (req, res) => {
  const cinema = await cinemaService.createCinema(req.body);
  res.status(201).json(cinema);
});

// GET /api/cinemas - List all cinemas
export const getCinemas = asyncHandler(async (req, res) => {
  const cinemas = await cinemaService.getAllCinemas();
  res.json(cinemas);
});

// GET /api/cinemas/:id/booking?groupSize=6 - Get booking quote for a group
export const getBookingQuote = asyncHandler(async (req, res) => {
  const result = await cinemaService.getBookingQuote(
    req.params.id,
    req.query.groupSize
  );
  res.json(result);
});
