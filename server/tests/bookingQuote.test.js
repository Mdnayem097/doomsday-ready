import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateBookingQuote } from '../src/services/bookingQuote.js';

describe('Feature 2: Cinema Booking Quote Service (Minimum-Coin-Change DP)', () => {
  it('sizes [1, 3, 4] and group 6 -> 2 bundles (3 x 2)', () => {
    // Greedy would pick 4 + 1 + 1 (3 bundles), but DP finds optimal 3 + 3 (2 bundles)
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

  describe('Edge Cases', () => {
    it('handles group size 1 correctly', () => {
      // Possible when size 1 is available
      const possibleQuote = calculateBookingQuote(1, [1, 3, 4]);
      assert.equal(possibleQuote.possible, true);
      assert.equal(possibleQuote.totalBundles, 1);
      assert.deepEqual(possibleQuote.bundles, [{ size: 1, count: 1 }]);

      // Impossible when smallest bundle is > 1
      const impossibleQuote = calculateBookingQuote(1, [2, 5]);
      assert.equal(impossibleQuote.possible, false);
    });

    it('handles a single bundle size', () => {
      // Exact multiple
      const exactQuote = calculateBookingQuote(15, [5]);
      assert.equal(exactQuote.possible, true);
      assert.equal(exactQuote.totalBundles, 3);
      assert.deepEqual(exactQuote.bundles, [{ size: 5, count: 3 }]);

      // Non-multiple
      const nonMultipleQuote = calculateBookingQuote(14, [5]);
      assert.equal(nonMultipleQuote.possible, false);
    });

    it('group size 10000 with 10 bundle sizes finishes fast', () => {
      const largeGroupSize = 10000;
      const tenBundleSizes = [2, 5, 10, 20, 25, 50, 100, 200, 250, 500];

      const start = performance.now();
      const quote = calculateBookingQuote(largeGroupSize, tenBundleSizes);
      const elapsedMs = performance.now() - start;

      // Assert correctness: optimal is 20 bundles of 500
      assert.equal(quote.possible, true);
      assert.equal(quote.totalBundles, 20);
      assert.deepEqual(quote.bundles, [{ size: 500, count: 20 }]);

      // Assert high performance (should complete in well under 100ms)
      assert.ok(
        elapsedMs < 100,
        `DP calculation for group size 10000 should finish under 100ms, took ${elapsedMs.toFixed(2)}ms`
      );
    });
  });
});
