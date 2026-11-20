import 'dotenv/config';
import mongoose from 'mongoose';
import Movie from './models/Movie.js';
import Cinema from './models/Cinema.js';
import { connectDB } from './config/db.js';

export async function runSeed(mongoUri) {
  const uri = mongoUri || process.argv[2] || process.env.MONGO_URI;
  if (!uri) {
    throw new Error(
      'MONGO_URI is required to seed the database. Provide it in .env, as an environment variable, or as a CLI argument.'
    );
  }

  // Connect if not already connected
  if (mongoose.connection.readyState !== 1) {
    await connectDB(uri);
  }

  console.log('Clearing existing movies and cinemas...');
  await Movie.deleteMany({});
  await Cinema.deleteMany({});

  console.log('Inserting 8 sample MCU movies with dependencies...');

  // Level 0: Movies without prerequisites
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

  // Level 1: The Avengers depends on Iron Man and First Avenger
  const theAvengers = await Movie.create({
    title: 'The Avengers',
    releaseYear: 2012,
    runtime: 143,
    watched: false,
    prerequisites: [ironMan._id, firstAvenger._id],
  });

  // Level 2: Civil War depends on The Avengers
  const civilWar = await Movie.create({
    title: 'Captain America: Civil War',
    releaseYear: 2016,
    runtime: 147,
    watched: false,
    prerequisites: [theAvengers._id],
  });

  // Level 3: Infinity War depends on Civil War and Thor: Ragnarok
  const infinityWar = await Movie.create({
    title: 'Avengers: Infinity War',
    releaseYear: 2018,
    runtime: 149,
    watched: false,
    prerequisites: [civilWar._id, ragnarok._id],
  });

  // Level 4: Endgame depends on Infinity War
  const endgame = await Movie.create({
    title: 'Avengers: Endgame',
    releaseYear: 2019,
    runtime: 181,
    watched: false,
    prerequisites: [infinityWar._id],
  });

  // Level 5: Avengers: Doomsday depends on Endgame
  await Movie.create({
    title: 'Avengers: Doomsday',
    releaseYear: 2026,
    runtime: 180,
    watched: false,
    prerequisites: [endgame._id],
  });

  console.log('Inserting 4 sample cinema venues...');
  const cinemas = await Cinema.create([
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

  return {
    moviesCount: 8,
    cinemasCount: cinemas.length,
  };
}

// Auto-run if executed directly via CLI
const isDirectCliRun =
  process.argv[1] &&
  (process.argv[1].endsWith('seed.js') || process.argv[1].includes('seed'));

if (isDirectCliRun) {
  runSeed()
    .then(async (result) => {
      console.log(
        `Database seeded successfully! (${result.moviesCount} movies, ${result.cinemasCount} cinemas)`
      );
      await mongoose.disconnect();
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err.message || err);
      process.exit(1);
    });
}
