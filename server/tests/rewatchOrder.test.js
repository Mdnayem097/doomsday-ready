import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectCycle, getRewatchOrder } from '../src/services/rewatchOrder.js';

describe('Feature 1: Rewatch Order & Cycle Detection Service', () => {
  // Canonical 8 Sample MCU Movies
  const sampleMcuMovies = [
    {
      _id: 'iron-man',
      title: 'Iron Man',
      releaseYear: 2008,
      runtime: 126,
      watched: false,
      prerequisites: [],
    },
    {
      _id: 'first-avenger',
      title: 'Captain America: The First Avenger',
      releaseYear: 2011,
      runtime: 124,
      watched: false,
      prerequisites: [],
    },
    {
      _id: 'the-avengers',
      title: 'The Avengers',
      releaseYear: 2012,
      runtime: 143,
      watched: false,
      prerequisites: ['iron-man', 'first-avenger'],
    },
    {
      _id: 'civil-war',
      title: 'Captain America: Civil War',
      releaseYear: 2016,
      runtime: 147,
      watched: false,
      prerequisites: ['the-avengers'],
    },
    {
      _id: 'ragnarok',
      title: 'Thor: Ragnarok',
      releaseYear: 2017,
      runtime: 130,
      watched: false,
      prerequisites: [],
    },
    {
      _id: 'infinity-war',
      title: 'Avengers: Infinity War',
      releaseYear: 2018,
      runtime: 149,
      watched: false,
      prerequisites: ['civil-war', 'ragnarok'],
    },
    {
      _id: 'endgame',
      title: 'Avengers: Endgame',
      releaseYear: 2019,
      runtime: 181,
      watched: false,
      prerequisites: ['infinity-war'],
    },
    {
      _id: 'doomsday',
      title: 'Avengers: Doomsday',
      releaseYear: 2026,
      runtime: 180,
      watched: false,
      prerequisites: ['endgame'],
    },
  ];

  const mcuMap = new Map(sampleMcuMovies.map((m) => [m._id, m]));
  const prereqMap = new Map(
    sampleMcuMovies.map((m) => [m._id, m.prerequisites])
  );

  describe('Rewatch Order Calculations', () => {
    it('Doomsday returns the 7 other movies, each once, every movie after its prerequisites', () => {
      const result = getRewatchOrder('doomsday', mcuMap);

      // Must exclude target movie
      assert.equal(result.target.title, 'Avengers: Doomsday');
      assert.equal(result.totalCount, 7);
      assert.equal(result.order.length, 7);
      assert.ok(!result.order.some((m) => m._id === 'doomsday'));

      // Each movie appears exactly once
      const orderIds = result.order.map((m) => m._id);
      const uniqueIds = new Set(orderIds);
      assert.equal(uniqueIds.size, 7);

      // Every movie appears strictly after all its prerequisites
      for (let i = 0; i < result.order.length; i++) {
        const movie = result.order[i];
        for (const prereqId of movie.prerequisites) {
          const prereqIndex = orderIds.indexOf(prereqId);
          assert.ok(
            prereqIndex !== -1 && prereqIndex < i,
            `Prerequisite ${prereqId} must appear before ${movie._id}`
          );
        }
      }

      // Expected valid topological sequence
      const titles = result.order.map((m) => m.title);
      assert.deepEqual(titles, [
        'Iron Man',
        'Captain America: The First Avenger',
        'The Avengers',
        'Captain America: Civil War',
        'Thor: Ragnarok',
        'Avengers: Infinity War',
        'Avengers: Endgame',
      ]);
    });

    it('Civil War returns Iron Man and The First Avenger (any order) then The Avengers', () => {
      const result = getRewatchOrder('civil-war', mcuMap);

      assert.equal(result.target.title, 'Captain America: Civil War');
      assert.equal(result.totalCount, 3);
      assert.ok(!result.order.some((m) => m._id === 'civil-war'));

      const titles = result.order.map((m) => m.title);
      const ironManIdx = titles.indexOf('Iron Man');
      const firstAvengerIdx = titles.indexOf(
        'Captain America: The First Avenger'
      );
      const theAvengersIdx = titles.indexOf('The Avengers');

      assert.ok(ironManIdx !== -1);
      assert.ok(firstAvengerIdx !== -1);
      assert.ok(theAvengersIdx !== -1);

      // Iron Man and First Avenger must be before The Avengers
      assert.ok(
        ironManIdx < theAvengersIdx,
        'Iron Man must appear before The Avengers'
      );
      assert.ok(
        firstAvengerIdx < theAvengersIdx,
        'First Avenger must appear before The Avengers'
      );
      assert.equal(
        theAvengersIdx,
        2,
        'The Avengers must be the final prerequisite before Civil War'
      );
    });

    it('Thor: Ragnarok returns an empty list', () => {
      const result = getRewatchOrder('ragnarok', mcuMap);

      assert.equal(result.target.title, 'Thor: Ragnarok');
      assert.equal(result.totalCount, 0);
      assert.deepEqual(result.order, []);
      assert.equal(result.remainingRuntime, 0);
      assert.equal(result.watchedCount, 0);
    });

    it('watchedCount and remainingRuntime are correct (target never counted)', () => {
      // Mark Iron Man (126m) and The Avengers (143m) as watched
      const testMap = new Map(
        sampleMcuMovies.map((m) => [
          m._id,
          {
            ...m,
            watched: m._id === 'iron-man' || m._id === 'the-avengers',
          },
        ])
      );

      const result = getRewatchOrder('civil-war', testMap);

      assert.equal(result.totalCount, 3);
      assert.equal(result.watchedCount, 2);

      // Remaining runtime: only unwatched First Avenger (124m). Target Civil War (147m) is NOT counted!
      assert.equal(result.remainingRuntime, 124);
    });

    it('remainingRuntime is 0 when all prerequisites are watched, even if target is unwatched', () => {
      // All prerequisites of Civil War watched, target Civil War unwatched (147 min)
      const allWatchedMap = new Map(
        sampleMcuMovies.map((m) => [
          m._id,
          {
            ...m,
            watched: m._id !== 'civil-war', // Civil War unwatched, all others watched
          },
        ])
      );

      const result = getRewatchOrder('civil-war', allWatchedMap);
      assert.equal(result.watchedCount, 3);
      assert.equal(result.remainingRuntime, 0); // Target's 147 min is excluded
    });

    it('handles a diamond dependency, listing each shared prerequisite exactly once', () => {
      // Diamond Graph:
      // Movie D depends on Movie B and Movie C
      // Both Movie B and Movie C depend on Movie A
      const diamondData = [
        {
          _id: 'A',
          title: 'Movie A',
          runtime: 100,
          watched: false,
          prerequisites: [],
        },
        {
          _id: 'B',
          title: 'Movie B',
          runtime: 110,
          watched: false,
          prerequisites: ['A'],
        },
        {
          _id: 'C',
          title: 'Movie C',
          runtime: 120,
          watched: false,
          prerequisites: ['A'],
        },
        {
          _id: 'D',
          title: 'Movie D',
          runtime: 130,
          watched: false,
          prerequisites: ['B', 'C'],
        },
      ];
      const diamondMap = new Map(diamondData.map((m) => [m._id, m]));

      const result = getRewatchOrder('D', diamondMap);

      assert.equal(result.totalCount, 3);
      assert.equal(result.order.length, 3);

      const orderIds = result.order.map((m) => m._id);

      // Movie A must appear before Movie B and Movie C
      assert.ok(orderIds.indexOf('A') < orderIds.indexOf('B'));
      assert.ok(orderIds.indexOf('A') < orderIds.indexOf('C'));

      // Every node appears strictly once
      assert.equal(new Set(orderIds).size, 3);
      assert.ok(!orderIds.includes('D')); // Target excluded
    });
  });

  describe('Cycle Detection (detectCycle)', () => {
    it('Making Endgame a prerequisite of Iron Man is detected as a cycle', () => {
      // In the sample MCU graph, Endgame indirectly depends on Iron Man:
      // Endgame -> Infinity War -> Civil War -> The Avengers -> Iron Man
      // Adding Endgame as a prerequisite of Iron Man closes the loop
      const hasCycle = detectCycle('iron-man', ['endgame'], prereqMap);
      assert.equal(hasCycle, true);
    });

    it('Self-dependency is detected as a cycle', () => {
      const hasCycle = detectCycle('iron-man', ['iron-man'], prereqMap);
      assert.equal(hasCycle, true);
    });

    it('Valid dependencies without cycles return false', () => {
      // Adding Iron Man as a prerequisite of Thor: Ragnarok is a valid DAG extension
      const hasCycle = detectCycle('ragnarok', ['iron-man'], prereqMap);
      assert.equal(hasCycle, false);
    });

    it('Empty prerequisites array returns false', () => {
      const hasCycle = detectCycle('iron-man', [], prereqMap);
      assert.equal(hasCycle, false);
    });
  });
});
