import express from 'express';
import {
  createMovie,
  getMovies,
  updateMovie,
  getMovieRewatchOrder,
} from '../controllers/movieController.js';

const router = express.Router();

router.route('/').post(createMovie).get(getMovies);

router.route('/:id').patch(updateMovie);

router.get('/:id/rewatch-order', getMovieRewatchOrder);

export default router;
