import mongoose from 'mongoose';

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
            return Array.isArray(val) && val.length >= 1 && val.length <= 10;
          },
          message: 'Bundle sizes must contain between 1 and 10 items',
        },
        {
          validator: function (val) {
            return val.every((num) => Number.isInteger(num) && num >= 1 && num <= 500);
          },
          message: 'Each bundle size must be an integer between 1 and 500',
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
