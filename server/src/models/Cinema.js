import mongoose from 'mongoose';
import {
  MIN_BUNDLE_SIZE,
  MAX_BUNDLE_SIZE,
  MIN_BUNDLE_COUNT,
  MAX_BUNDLE_COUNT,
} from '../config/constants.js';

const cinemaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cinema name is required'],
      unique: true,
      trim: true,
    },
    bundleSizes: {
      type: [Number],
      required: [true, 'Bundle sizes are required'],
      validate: [
        {
          validator: function (val) {
            return (
              Array.isArray(val) &&
              val.length >= MIN_BUNDLE_COUNT &&
              val.length <= MAX_BUNDLE_COUNT
            );
          },
          message: `Bundle sizes must contain between ${MIN_BUNDLE_COUNT} and ${MAX_BUNDLE_COUNT} items`,
        },
        {
          validator: function (val) {
            return val.every(
              (num) =>
                Number.isInteger(num) &&
                num >= MIN_BUNDLE_SIZE &&
                num <= MAX_BUNDLE_SIZE
            );
          },
          message: `Each bundle size must be an integer between ${MIN_BUNDLE_SIZE} and ${MAX_BUNDLE_SIZE}`,
        },
        {
          validator: function (val) {
            return new Set(val).size === val.length;
          },
          message: 'Bundle sizes must not contain duplicate values',
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

const Cinema = mongoose.model('Cinema', cinemaSchema);

export default Cinema;
