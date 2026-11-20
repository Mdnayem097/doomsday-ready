/**
 * Calculates the minimum number of bundles required to satisfy groupSize
 * using dynamic programming (minimum coin change algorithm).
 *
 * @param {number} groupSize - The target size (integer between 1 and 10000)
 * @param {number[]} bundleSizes - Available bundle sizes from the cinema
 * @returns {object} { possible: false, message } or { possible: true, totalBundles, bundles }
 */
export function calculateBookingQuote(groupSize, bundleSizes) {
  // dp[i] holds the minimum bundles needed for size i
  const dp = new Array(groupSize + 1).fill(Infinity);
  // choice[i] tracks the bundle size chosen to achieve optimal dp[i]
  const choice = new Array(groupSize + 1).fill(null);

  dp[0] = 0;

  for (let i = 1; i <= groupSize; i++) {
    for (const size of bundleSizes) {
      if (size <= i && dp[i - size] + 1 < dp[i]) {
        dp[i] = dp[i - size] + 1;
        choice[i] = size;
      }
    }
  }

  // If unreachable with available bundle sizes
  if (dp[groupSize] === Infinity) {
    return {
      possible: false,
      message: `Cannot form group size of ${groupSize} with available bundle sizes`,
    };
  }

  // Backtrack to assemble bundle counts
  const counts = new Map();
  let current = groupSize;
  while (current > 0) {
    const size = choice[current];
    counts.set(size, (counts.get(size) || 0) + 1);
    current -= size;
  }

  // Format array sorted descending by bundle size
  const bundles = Array.from(counts.entries())
    .map(([size, count]) => ({ size, count }))
    .sort((a, b) => b.size - a.size);

  return {
    possible: true,
    totalBundles: dp[groupSize],
    bundles,
  };
}
