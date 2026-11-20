import mongoose from 'mongoose';
import Cinema from '../models/Cinema.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { calculateBookingQuote } from '../services/bookingQuote.js';

// Helper to escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// POST /api/cinemas - Create cinema
export const createCinema = asyncHandler(async (req, res) => {
  const { name, bundleSizes } = req.body;

  // Case-insensitive uniqueness check for name
  if (typeof name === 'string' && name.trim()) {
    const existing = await Cinema.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') },
    });
    if (existing) {
      throw new AppError(409, 'DUPLICATE', 'Cinema with this name already exists');
    }
  }

  const cinema = new Cinema({ name, bundleSizes });
  await cinema.save();
  res.status(201).json(cinema);
});

// GET /api/cinemas - List all cinemas
export const getCinemas = asyncHandler(async (req, res) => {
  const cinemas = await Cinema.find({});
  res.json(cinemas);
});

// GET /api/cinemas/:id/booking?groupSize=6 - Get booking quote for a group
export const getBookingQuote = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid id');
  }

  const cinema = await Cinema.findById(req.params.id);
  if (!cinema) {
    throw new AppError(404, 'NOT_FOUND', 'Cinema not found');
  }

  const rawGroupSize = req.query.groupSize;

  // Validate groupSize is strictly an integer string from 1 to 10000
  // Rejects missing/undefined, non-strings, floats (e.g. 5.5), non-numeric ("abc"), 0, > 10000
  if (
    typeof rawGroupSize !== 'string' ||
    !/^\s*\d+\s*$/.test(rawGroupSize)
  ) {
    throw new AppError(400, 'INVALID_GROUP_SIZE', 'groupSize must be an integer between 1 and 10000');
  }

  const groupSize = Number(rawGroupSize.trim());
  if (groupSize < 1 || groupSize > 10000) {
    throw new AppError(400, 'INVALID_GROUP_SIZE', 'groupSize must be an integer between 1 and 10000');
  }

  const result = calculateBookingQuote(groupSize, cinema.bundleSizes);
  res.json(result);
});
