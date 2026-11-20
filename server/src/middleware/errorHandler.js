import { AppError } from '../utils/AppError.js';

export function notFound(req, res, next) {
  next(
    new AppError(
      404,
      'NOT_FOUND',
      `Route ${req.method} ${req.originalUrl} not found`
    )
  );
}

// All errors are returned in one format: { error: { code, message } }
export function errorHandler(err, req, res, next) {
  let {
    status = 500,
    code = 'INTERNAL_ERROR',
    message = 'Something went wrong',
  } = err;

  if (err.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err.name === 'CastError') {
    status = 400;
    code = 'INVALID_ID';
    message = 'Invalid id';
  } else if (err.code === 11000) {
    status = 409;
    code = 'DUPLICATE';
    message = `${Object.keys(err.keyValue)[0]} already exists`;
  }

  if (status === 500) console.error(err);
  res.status(status).json({ error: { code, message } });
}
