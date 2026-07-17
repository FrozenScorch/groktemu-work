// Pure, DOM-free logic for the silly features.
// Safe to import from Node tests without a window/document.

import { VILLAINS, ICONIC_REVEAL, QUOTES, SNACK_REACTIONS } from './data.js';

// --- Scooby Snack counter -------------------------------------------------

/**
 * Create a fresh snack-counter state object.
 * @returns {{ count: number }}
 */
export function createSnackState() {
  return { count: 0 };
}

/**
 * Pick the reaction whose milestone is the highest one not greater than `count`.
 * @param {number} count
 * @returns {{ milestone: number, title: string, message: string }}
 */
export function reactionForCount(count) {
  let best = SNACK_REACTIONS[0];
  for (const reaction of SNACK_REACTIONS) {
    if (count >= reaction.milestone && reaction.milestone >= best.milestone) {
      best = reaction;
    }
  }
  return best;
}

/**
 * Returns the milestone values that should trigger a "celebration" for a given
 * count — i.e. milestones equal to the count. Used so the UI can fire confetti
 * only on the exact frame a milestone is reached, not on every feed afterwards.
 * @param {number} count
 * @returns {number[]}
 */
export function milestonesHit(count) {
  return SNACK_REACTIONS.filter((r) => r.milestone > 0 && r.milestone === count)
    .map((r) => r.milestone);
}

/**
 * Feed Scooby one snack and describe the result. Pure: takes state, returns a
 * new state plus an event describing what happened (does not mutate input).
 *
 * @param {{ count: number }} state
 * @returns {{ state: { count: number }, count: number, reaction: object, milestones: number[] }}
 */
export function feedSnack(state) {
  const count = (state?.count ?? 0) + 1;
  return {
    state: { count },
    count,
    reaction: reactionForCount(count),
    milestones: milestonesHit(count),
  };
}

// --- Villain unmasking ----------------------------------------------------

/** Deterministic clamp to [0, len). Throws on empty list (helps catch bad data). */
function clampIndex(value, len) {
  if (len <= 0) throw new Error('cannot index into an empty list');
  const mod = ((value % len) + len) % len;
  return mod;
}

/**
 * Pick a villain by index, wrapping safely. Pure and deterministic given an index.
 * @param {number} index
 * @param {Array} [pool]
 */
export function villainByIndex(index, pool = VILLAINS) {
  return pool[clampIndex(index, pool.length)];
}

/**
 * Build the "it was [X] the whole time" reveal string for a villain object.
 * @param {{ disguise: string, real: string, motive: string }} villain
 * @returns {{ headline: string, confession: string, iconic: string }}
 */
export function describeReveal(villain) {
  return {
    headline: `It was ${villain.real} the whole time!`,
    confession: `"The ${villain.disguise} was just a costume so I could ${villain.motive}!"`,
    iconic: ICONIC_REVEAL,
  };
}

/**
 * Unmask a villain by index. Combines lookup + reveal copy into one event.
 * @param {number} index
 * @param {Array} [pool]
 */
export function unmaskVillain(index, pool = VILLAINS) {
  const villain = villainByIndex(index, pool);
  return { villain, ...describeReveal(villain) };
}

// --- Quote generator ------------------------------------------------------

/**
 * Deterministically pick a quote by index (wraps safely).
 * @param {number} index
 * @param {string[]} [pool]
 */
export function quoteByIndex(index, pool = QUOTES) {
  return pool[clampIndex(index, pool.length)];
}

/** All distinct quote indices — useful for cycling without repeats. */
export function quoteCount(pool = QUOTES) {
  return pool.length;
}
