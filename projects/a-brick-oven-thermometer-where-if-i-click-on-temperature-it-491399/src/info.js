/**
 * info.js — the readout and narration panel.
 *
 * Shows the current temperature (with a °C/°F/K toggle), the stage name, a
 * plain-language summary of what the heat is doing to the house, a quick
 * bricks/mortar status, and a rotating "did you know" fact.
 */

import { classify, formatTemp, fromCelsius } from './physics.js';

const UNITS = ['C', 'F', 'K'];

export function mountInfo(root, store) {
  root.innerHTML = `
    <section class="info-card" aria-live="polite">
      <div class="readout">
        <div class="readout-value" id="readoutValue">25&nbsp;°C</div>
        <div class="unit-toggle" role="group" aria-label="Temperature unit">
          ${UNITS.map(
            (u) =>
              `<button class="unit-btn" data-unit="${u}" aria-pressed="false">°${u}</button>`,
          ).join('')}
        </div>
      </div>

      <div class="stage-badge" id="stageBadge">Comfortable</div>

      <p class="house-line" id="houseLine"></p>
      <p class="summary" id="summary"></p>

      <dl class="status-grid">
        <dt>Bricks</dt><dd id="bricksStatus"></dd>
        <dt>Mortar</dt><dd id="mortarStatus"></dd>
      </dl>

      <aside class="fact" id="fact">
        <span class="fact-label">Did you know</span>
        <span id="factText"></span>
      </aside>
    </section>
  `;

  const readoutValue = root.querySelector('#readoutValue');
  const stageBadge = root.querySelector('#stageBadge');
  const houseLine = root.querySelector('#houseLine');
  const summary = root.querySelector('#summary');
  const bricksStatus = root.querySelector('#bricksStatus');
  const mortarStatus = root.querySelector('#mortarStatus');
  const factText = root.querySelector('#factText');
  const unitBtns = root.querySelectorAll('.unit-btn');

  for (const btn of unitBtns) {
    btn.addEventListener('click', () => store.set({ unit: btn.dataset.unit }));
  }

  store.subscribe(({ tempC, unit }) => {
    const s = classify(tempC);

    readoutValue.textContent = formatTemp(tempC, unit);
    stageBadge.textContent = s.name;
    stageBadge.dataset.stage = s.id;
    houseLine.textContent = s.house;
    summary.textContent = s.summary;
    bricksStatus.textContent = s.bricks;
    mortarStatus.textContent = s.mortar;
    factText.textContent = s.fact;

    for (const btn of unitBtns) {
      const pressed = btn.dataset.unit === unit;
      btn.setAttribute('aria-pressed', String(pressed));
      btn.classList.toggle('is-active', pressed);
    }
  });
}
