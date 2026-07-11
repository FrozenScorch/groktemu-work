import test from 'node:test';
import assert from 'node:assert/strict';

// Importing the UI modules in Node proves the whole module graph resolves and
// nothing touches the DOM at import time. These run on Node built-ins only —
// no jsdom/bundler needed — so `npm test` stays dependency-free and works
// offline. (DOM is only ever accessed inside the mount() functions.)
import { mountThermometer } from '../src/thermometer.js';
import { mountHouse, computeFrame } from '../src/house.js';
import { mountInfo } from '../src/info.js';
import { createStore } from '../src/state.js';

test('each UI module exports a mount function', () => {
  assert.equal(typeof mountThermometer, 'function');
  assert.equal(typeof mountHouse, 'function');
  assert.equal(typeof mountInfo, 'function');
  assert.equal(typeof createStore, 'function');
});

test('createStore notifies subscribers with current + updated state', () => {
  const events = [];
  const store = createStore({ tempC: 25, unit: 'C' });
  store.subscribe((s) => events.push(s.tempC));
  store.set({ tempC: 100 });
  assert.deepEqual(events, [25, 100]);
});
