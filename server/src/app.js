import express from 'express';
import cors from 'cors';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import movieRoutes from './routes/movies.js';
import cinemaRoutes from './routes/cinemas.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/movies', movieRoutes);
app.use('/api/cinemas', cinemaRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
