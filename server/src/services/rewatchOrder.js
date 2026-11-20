import { AppError } from '../utils/AppError.js';

/**
 * Checks if assigning newPrerequisiteIds to targetId would introduce a cycle.
 * Traverses prerequisites using DFS with a visited set.
 * Returns true if the DFS reaches targetId (cycle detected).
 */
export function detectCycle(targetId, newPrerequisiteIds, moviePrereqMap) {
  const targetIdStr = targetId ? targetId.toString() : null;
  const visited = new Set();

  function dfs(currentId) {
    const idStr = currentId.toString();
    if (targetIdStr && idStr === targetIdStr) {
      return true;
    }
    if (visited.has(idStr)) {
      return false;
    }
    visited.add(idStr);

    const val = moviePrereqMap.get(idStr);
    const prereqs = Array.isArray(val) ? val : val?.prerequisites || [];

    for (const prereq of prereqs) {
      const nextId = prereq._id ? prereq._id.toString() : prereq.toString();
      if (dfs(nextId)) {
        return true;
      }
    }
    return false;
  }

  for (const prereqId of newPrerequisiteIds) {
    if (dfs(prereqId)) {
      return true;
    }
  }
  return false;
}

/**
 * Pure service function to calculate the rewatch order using DFS post-order.
 * Every prerequisite movie appears exactly once and after its own prerequisites.
 * Target movie is excluded from the order list.
 */
export function getRewatchOrder(targetMovieId, moviesMap) {
  const targetIdStr = targetMovieId.toString();
  const target = moviesMap.get(targetIdStr);
  if (!target) {
    throw new AppError(404, 'NOT_FOUND', 'Target movie not found');
  }

  const visited = new Set();
  const order = [];

  function dfs(currentId) {
    const idStr = currentId.toString();
    if (visited.has(idStr)) {
      return;
    }
    visited.add(idStr);

    const movie = moviesMap.get(idStr);
    if (!movie) return;

    const prereqs = movie.prerequisites || [];
    for (const prereq of prereqs) {
      const prereqId = prereq._id ? prereq._id.toString() : prereq.toString();
      dfs(prereqId);
    }

    if (idStr !== targetIdStr) {
      order.push(movie);
    }
  }

  dfs(targetIdStr);

  const watchedCount = order.filter((m) => m.watched).length;
  const totalCount = order.length;
  const remainingRuntime = order
    .filter((m) => !m.watched)
    .reduce((sum, m) => sum + (m.runtime || 0), 0);

  return {
    target,
    order,
    watchedCount,
    totalCount,
    remainingRuntime,
  };
}
