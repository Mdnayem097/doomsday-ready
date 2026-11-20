import 'dotenv/config';
import mongoose from 'mongoose';
import Movie from './models/Movie.js';
import Cinema from './models/Cinema.js';
import { connectDB } from './config/db.js';

export async function seed() {
  await connectDB(process.env.MONGO_URI);
  console.log('Connected to MongoDB. Clearing existing data...');

  await Movie.deleteMany({});
  await Cinema.deleteMany({});

  console.log('Inserting 8 sample MCU movies...');

  // Movies with no prerequisites
  const ironMan = await Movie.create({
    title: 'Iron Man',
    releaseYear: 2008,
    runtime: 126,
    watched: false,
    prerequisites: [],
  });

  const firstAvenger = await Movie.create({
    title: 'Captain America: The First Avenger',
    releaseYear: 2011,
    runtime: 124,
    watched: false,
    prerequisites: [],
  });

  const ragnarok = await Movie.create({
    title: 'Thor: Ragnarok',
    releaseYear: 2017,
    runtime: 130,
    watched: false,
    prerequisites: [],
  });

  // Movies with prerequisites
  const theAvengers = await Movie.create({
    title: 'The Avengers',
    releaseYear: 2012,
    runtime: 143,
    watched: false,
    prerequisites: [ironMan._id, firstAvenger._id],
  });

  const civilWar = await Movie.create({
    title: 'Captain America: Civil War',
    releaseYear: 2016,
    runtime: 147,
    watched: false,
    prerequisites: [theAvengers._id],
  });

  const infinityWar = await Movie.create({
    title: 'Avengers: Infinity War',
    releaseYear: 2018,
    runtime: 149,
    watched: false,
    prerequisites: [civilWar._id, ragnarok._id],
  });

  const endgame = await Movie.create({
    title: 'Avengers: Endgame',
    releaseYear: 2019,
    runtime: 181,
    watched: false,
    prerequisites: [infinityWar._id],
  });

  const doomsday = await Movie.create({
    title: 'Avengers: Doomsday',
    releaseYear: 2026,
    runtime: 180,
    watched: false,
    prerequisites: [endgame._id],
  });

  console.log('Inserting 4 sample cinemas...');
  await Cinema.create([
    {
      name: 'Stark Starkplex',
      bundleSizes: [1, 3, 4],
    },
    {
      name: 'S.H.I.E.L.D. Screening Room',
      bundleSizes: [2, 5],
    },
    {
      name: 'Wakanda Royal IMAX',
      bundleSizes: [6, 9, 20],
    },
    {
      name: 'Sanctum Sanctorum Cine',
      bundleSizes: [4, 6],
    },
  ]);

  console.log('Database seeded successfully!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
