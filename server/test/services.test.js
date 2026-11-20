import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectCycle, getRewatchOrder } from '../src/services/rewatchOrder.js';
import { calculateBookingQuote } from '../src/services/bookingQuote.js';

describe('Rewatch Order Service (Graph / DFS Logic)', () => {
  // Sample Marvel dataset
  const sampleMovies = [
    { _id: '1', title: 'Iron Man', runtime: 126, watched: false, prerequisites: [] },
    { _id: '2', title: 'Captain America: The First Avenger', runtime: 124, watched: false, prerequisites: [] },
    { _id: '3', title: 'The Avengers', runtime: 143, watched: false, prerequisites: ['1', '2'] },
    { _id: '4', title: 'Captain America: Civil War', runtime: 147, watched: false, prerequisites: ['3'] },
    { _id: '5', title: 'Thor: Ragnarok', runtime: 130, watched: false, prerequisites: [] },
    { _id: '6', title: 'Avengers: Infinity War', runtime: 149, watched: false, prerequisites: ['4', '5'] },
    { _id: '7', title: 'Avengers: Endgame', runtime: 181, watched: false, prerequisites: ['6'] },
    { _id: '8', title: 'Avengers: Doomsday', runtime: 180, watched: false, prerequisites: ['7'] },
  ];

  const moviesMap = new Map(sampleMovies.map((m) => [m._id, m]));
  const prereqMap = new Map(sampleMovies.map((m) => [m._id, m.prerequisites]));

  describe('detectCycle()', () => {
    it('detects indirect cycle when Endgame (7) is added as prerequisite of Iron Man (1)', () => {
      const hasCycle = detectCycle('1', ['7'], prereqMap);
      assert.equal(hasCycle, true);
    });

    it('detects indirect cycle in A -> B -> C when C is made a prerequisite of A', () => {
      // Chain: A (10) -> B (20) -> C (30)
      const chainMap = new Map([
        ['10', ['20']],
        ['20', ['30']],
        ['30', []],
      ]);
      // Making A a prerequisite of C completes the cycle A -> B -> C -> A
      const hasCycle = detectCycle('30', ['10'], chainMap);
      assert.equal(hasCycle, true);
    });

    it('detects direct self-cycle when movie depends on itself', () => {
      const hasCycle = detectCycle('1', ['1'], prereqMap);
      assert.equal(hasCycle, true);
    });

    it('returns false when no cycle is introduced', () => {
      // Adding Iron Man (1) as prerequisite to Thor: Ragnarok (5) is valid
      const hasCycle = detectCycle('5', ['1'], prereqMap);
      assert.equal(hasCycle, false);
    });

    it('returns false for empty prerequisites', () => {
      const hasCycle = detectCycle('1', [], prereqMap);
      assert.equal(hasCycle, false);
    });
  });

  describe('getRewatchOrder()', () => {
    it('returns 7 movies in valid post-order for Avengers: Doomsday', () => {
      const result = getRewatchOrder('8', moviesMap);

      assert.equal(result.target.title, 'Avengers: Doomsday');
      assert.equal(result.totalCount, 7);
      assert.equal(result.order.length, 7);

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

      // All unwatched: sum of 126 + 124 + 143 + 147 + 130 + 149 + 181 = 1000
      assert.equal(result.remainingRuntime, 1000);
      assert.equal(result.watchedCount, 0);
    });

    it('handles diamond dependency correctly, listing shared prerequisite exactly once', () => {
      // Diamond: D depends on B and C; both B and C depend on A
      const diamondMovies = [
        { _id: 'A', title: 'Movie A', runtime: 100, watched: false, prerequisites: [] },
        { _id: 'B', title: 'Movie B', runtime: 110, watched: false, prerequisites: ['A'] },
        { _id: 'C', title: 'Movie C', runtime: 120, watched: false, prerequisites: ['A'] },
        { _id: 'D', title: 'Movie D', runtime: 130, watched: false, prerequisites: ['B', 'C'] },
      ];
      const diamondMap = new Map(diamondMovies.map((m) => [m._id, m]));

      const result = getRewatchOrder('D', diamondMap);

      assert.equal(result.totalCount, 3);
      assert.equal(result.order.length, 3);

      const titles = result.order.map((m) => m.title);
      // A must appear before both B and C
      assert.ok(titles.indexOf('Movie A') < titles.indexOf('Movie B'));
      assert.ok(titles.indexOf('Movie A') < titles.indexOf('Movie C'));

      // Every movie in diamond appears exactly once
      const uniqueTitles = new Set(titles);
      assert.equal(uniqueTitles.size, 3);
      assert.ok(uniqueTitles.has('Movie A'));
      assert.ok(uniqueTitles.has('Movie B'));
      assert.ok(uniqueTitles.has('Movie C'));
      assert.ok(!uniqueTitles.has('Movie D')); // Target excluded
    });

    it('remainingRuntime never includes target runtime even when target is unwatched', () => {
      // All prerequisites watched, target movie unwatched
      const testMap = new Map([
        ['A', { _id: 'A', title: 'Movie A', runtime: 100, watched: true, prerequisites: [] }],
        ['B', { _id: 'B', title: 'Movie B', runtime: 120, watched: true, prerequisites: ['A'] }],
        ['Target', { _id: 'Target', title: 'Target Movie', runtime: 200, watched: false, prerequisites: ['B'] }],
      ]);

      const result = getRewatchOrder('Target', testMap);
      assert.equal(result.totalCount, 2);
      assert.equal(result.watchedCount, 2);
      // remainingRuntime MUST be 0 (Target's 200 is never counted)
      assert.equal(result.remainingRuntime, 0);
    });

    it('returns Iron Man and First Avenger before The Avengers for Civil War', () => {
      const result = getRewatchOrder('4', moviesMap);

      assert.equal(result.target.title, 'Captain America: Civil War');
      assert.equal(result.totalCount, 3);

      const titles = result.order.map((m) => m.title);
      assert.ok(titles.indexOf('Iron Man') < titles.indexOf('The Avengers'));
      assert.ok(titles.indexOf('Captain America: The First Avenger') < titles.indexOf('The Avengers'));
      assert.equal(titles[titles.length - 1], 'The Avengers');
    });

    it('returns empty list for Thor: Ragnarok (no prerequisites)', () => {
      const result = getRewatchOrder('5', moviesMap);

      assert.equal(result.totalCount, 0);
      assert.deepEqual(result.order, []);
      assert.equal(result.remainingRuntime, 0);
      assert.equal(result.watchedCount, 0);
    });

    it('throws 404 AppError when target movie does not exist', () => {
      assert.throws(
        () => getRewatchOrder('999', moviesMap),
        (err) => err.status === 404 && err.code === 'NOT_FOUND'
      );
    });

    it('correctly calculates watchedCount and remainingRuntime when some movies are watched', () => {
      const clonedMap = new Map(
        sampleMovies.map((m) => [
          m._id,
          { ...m, watched: m._id === '1' || m._id === '3' }, // Iron Man and The Avengers watched
        ])
      );

      const result = getRewatchOrder('4', clonedMap);
      assert.equal(result.totalCount, 3);
      assert.equal(result.watchedCount, 2);
      // Only First Avenger (124) remains
      assert.equal(result.remainingRuntime, 124);
    });
  });
});

describe('Booking Quote Service (Minimum-Coin-Change DP)', () => {
  it('sizes [1, 3, 4] and group 6 -> 2 bundles (3 x 2)', () => {
    const quote = calculateBookingQuote(6, [1, 3, 4]);

    assert.equal(quote.possible, true);
    assert.equal(quote.totalBundles, 2);
    assert.deepEqual(quote.bundles, [{ size: 3, count: 2 }]);
  });

  it('sizes [2, 5] and group 11 -> 4 bundles (5 x 1, 2 x 3)', () => {
    const quote = calculateBookingQuote(11, [2, 5]);

    assert.equal(quote.possible, true);
    assert.equal(quote.totalBundles, 4);
    assert.deepEqual(quote.bundles, [
      { size: 5, count: 1 },
      { size: 2, count: 3 },
    ]);
  });

  it('sizes [6, 9, 20] and group 44 -> 4 bundles (20 x 1, 9 x 2, 6 x 1)', () => {
    const quote = calculateBookingQuote(44, [6, 9, 20]);

    assert.equal(quote.possible, true);
    assert.equal(quote.totalBundles, 4);
    assert.deepEqual(quote.bundles, [
      { size: 20, count: 1 },
      { size: 9, count: 2 },
      { size: 6, count: 1 },
    ]);
  });

  it('sizes [4, 6] and group 7 -> not possible', () => {
    const quote = calculateBookingQuote(7, [4, 6]);

    assert.equal(quote.possible, false);
    assert.ok(typeof quote.message === 'string' && quote.message.length > 0);
    assert.equal(quote.bundles, undefined);
  });

  it('handles exact single bundle match', () => {
    const quote = calculateBookingQuote(20, [6, 9, 20]);

    assert.equal(quote.possible, true);
    assert.equal(quote.totalBundles, 1);
    assert.deepEqual(quote.bundles, [{ size: 20, count: 1 }]);
  });
});
