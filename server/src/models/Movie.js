import mongoose from 'mongoose';
import { MIN_RUNTIME, MAX_RUNTIME } from '../config/constants.js';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      unique: true,
      trim: true,
    },
    releaseYear: {
      type: Number,
      required: [true, 'Release year is required'],
    },
    runtime: {
      type: Number,
      required: [true, 'Runtime is required'],
      min: [MIN_RUNTIME, `Runtime must be at least ${MIN_RUNTIME} minute`],
      max: [MAX_RUNTIME, `Runtime cannot exceed ${MAX_RUNTIME} minutes`],
    },
    prerequisites: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Movie',
        },
      ],
      default: [],
    },
    watched: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;
