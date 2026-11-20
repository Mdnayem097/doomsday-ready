import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import movieRoutes from './routes/movies.js';
import cinemaRoutes from './routes/cinemas.js';
import { runSeed } from './seed.js';

const app = express();

// Parse CLIENT_URL from environment (supports comma-separated URLs)
const rawClientUrl = process.env.CLIENT_URL || '';
const configuredOrigins = rawClientUrl
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// CORS configuration:
// - Always allows server-to-server or headless requests without origin (health checks, curl, Postman)
// - In development (NODE_ENV !== 'production'), always permits localhost ports
// - In production, allows configured CLIENT_URL origin(s)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isDev = process.env.NODE_ENV !== 'production';
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(
      origin
    );

    if (isDev && isLocalhost) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, '');
    if (configuredOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // Fallback: if no CLIENT_URL set and running in development, permit all
    if (configuredOrigins.length === 0 && isDev) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint (supports both /api/health and /health for Render)
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Optional one-time seed endpoint for environments without shell access (e.g. Render Free Tier)
// Enabled if ALLOW_SEED=true or if protected by SEED_SECRET header
app.post('/api/seed', async (req, res, next) => {
  const allowSeed = process.env.ALLOW_SEED === 'true';
  const seedSecret = process.env.SEED_SECRET;
  const providedSecret = req.headers['x-seed-secret'];

  if (!allowSeed && (!seedSecret || providedSecret !== seedSecret)) {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message:
          'Seeding endpoint is disabled. Set ALLOW_SEED=true or provide a matching X-Seed-Secret header.',
      },
    });
  }

  try {
    const result = await runSeed(process.env.MONGO_URI);
    res.json({
      message: 'Database seeded successfully',
      result,
    });
  } catch (err) {
    next(err);
  }
});

// Mount domain routes
app.use('/api/movies', movieRoutes);
app.use('/api/cinemas', cinemaRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

export default app;
