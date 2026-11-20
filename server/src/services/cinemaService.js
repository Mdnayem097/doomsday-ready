import mongoose from 'mongoose';
import Cinema from '../models/Cinema.js';
import { AppError } from '../utils/AppError.js';
import { MIN_GROUP_SIZE, MAX_GROUP_SIZE } from '../config/constants.js';
import { calculateBookingQuote } from './bookingQuote.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getAllCinemas() {
  return Cinema.find({});
}

export async function createCinema(data) {
  const { name, bundleSizes } = data;

  if (typeof name === 'string' && name.trim()) {
    const existing = await Cinema.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') },
    });
    if (existing) {
      throw new AppError(
        409,
        'DUPLICATE',
        'Cinema with this name already exists'
      );
    }
  }

  const cinema = new Cinema({ name, bundleSizes });
  await cinema.save();
  return cinema;
}

export async function getBookingQuote(cinemaId, rawGroupSize) {
  if (!mongoose.Types.ObjectId.isValid(cinemaId)) {
    throw new AppError(400, 'INVALID_ID', 'Invalid id');
  }

  const cinema = await Cinema.findById(cinemaId);
  if (!cinema) {
    throw new AppError(404, 'NOT_FOUND', 'Cinema not found');
  }

  // Validate groupSize is strictly an integer string from MIN_GROUP_SIZE to MAX_GROUP_SIZE
  if (typeof rawGroupSize !== 'string' || !/^\s*\d+\s*$/.test(rawGroupSize)) {
    throw new AppError(
      400,
      'INVALID_GROUP_SIZE',
      `groupSize must be an integer between ${MIN_GROUP_SIZE} and ${MAX_GROUP_SIZE}`
    );
  }

  const groupSize = Number(rawGroupSize.trim());
  if (groupSize < MIN_GROUP_SIZE || groupSize > MAX_GROUP_SIZE) {
    throw new AppError(
      400,
      'INVALID_GROUP_SIZE',
      `groupSize must be an integer between ${MIN_GROUP_SIZE} and ${MAX_GROUP_SIZE}`
    );
  }

  return calculateBookingQuote(groupSize, cinema.bundleSizes);
}
