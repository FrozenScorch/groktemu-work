/**
 * state.js — a tiny pub/sub store so the thermometer, house and info panel
 * can stay in sync without any of them knowing about the others.
 *
 * State shape: { tempC: number, unit: 'C' | 'F' | 'K' }
 */

export function createStore(initial) {
  let state = { ...initial };
  const listeners = new Set();

  return {
    get() {
      return state;
    },
    set(patch) {
      state = { ...state, ...patch };
      for (const fn of listeners) fn(state);
      return state;
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(state);
      return () => listeners.delete(fn);
    },
  };
}
