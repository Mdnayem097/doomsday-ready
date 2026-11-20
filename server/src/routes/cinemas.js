import express from 'express';
import {
  createCinema,
  getCinemas,
  getBookingQuote,
} from '../controllers/cinemaController.js';

const router = express.Router();

router.route('/').post(createCinema).get(getCinemas);

router.get('/:id/booking', getBookingQuote);

export default router;
