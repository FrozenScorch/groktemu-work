/**
 * main.js — wires the store to the thermometer, house and info panel.
 */

import { createStore } from './state.js';
import { mountThermometer } from './thermometer.js';
import { mountHouse } from './house.js';
import { mountInfo } from './info.js';
import { DEFAULT_TEMP_C } from './physics.js';

const app = document.querySelector('#app');

app.innerHTML = `
  <header class="app-header">
    <h1>Brick-Oven Thermometer</h1>
    <p class="subtitle">Click a temperature and watch what happens to the brick house.</p>
  </header>

  <div class="layout">
    <section class="panel thermo-panel" id="thermoPanel" aria-label="Thermometer"></section>
    <section class="panel house-panel" id="housePanel" aria-label="Brick house simulator"></section>
    <section class="panel info-panel" id="infoPanel" aria-label="What is happening"></section>
  </div>

  <footer class="app-footer">
    <p>Colours track real <em>black-body radiation</em>; thresholds are based on ceramic and
       materials-science reference points.</p>
  </footer>
`;

const store = createStore({ tempC: DEFAULT_TEMP_C, unit: 'C' });

mountThermometer(app.querySelector('#thermoPanel'), store);
mountHouse(app.querySelector('#housePanel'), store);
mountInfo(app.querySelector('#infoPanel'), store);
