// DOM wiring for the Scooby-Doo site. All document access happens inside
// functions, so importing this module never touches the DOM until init runs.

import { GANG } from './data.js';
import {
  createSnackState,
  feedSnack,
  unmaskVillain,
  quoteByIndex,
  quoteCount,
} from './logic.js';

/** Escape user/data strings before injecting as HTML. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

/** Render the Mystery Inc. roster as cards. */
export function renderGang(container) {
  if (!container) return;
  container.innerHTML = GANG.map((member) => `
    <article class="card" style="--accent:${member.color}">
      <div class="card__emoji" aria-hidden="true">${member.emoji}</div>
      <h3 class="card__name">${escapeHtml(member.name)}</h3>
      <p class="card__role">${escapeHtml(member.role)}</p>
      <p class="card__catchphrase">${escapeHtml(member.catchphrase)}</p>
      <p class="card__quirk">${escapeHtml(member.quirk)}</p>
    </article>
  `).join('');
}

/** Wire up the Scooby Snack counter. */
export function initSnackCounter(opts = {}) {
  const button = opts.button ?? document.querySelector('[data-snack-feed]');
  const countEl = opts.countEl ?? document.querySelector('[data-snack-count]');
  const titleEl = opts.titleEl ?? document.querySelector('[data-snack-title]');
  const messageEl = opts.messageEl ?? document.querySelector('[data-snack-message]');
  const mascot = opts.mascot ?? document.querySelector('[data-scooby]');
  if (!button || !countEl) return;

  let state = createSnackState();

  const apply = (result) => {
    state = result.state;
    countEl.textContent = String(result.count);
    if (titleEl) titleEl.textContent = result.reaction.title;
    if (messageEl) messageEl.textContent = result.reaction.message;
    if (mascot) {
      mascot.classList.remove('is-chomping');
      // Force reflow so the animation can restart on rapid clicks.
      void mascot.offsetWidth;
      mascot.classList.add('is-chomping');
      if (result.milestones.length) mascot.classList.add('is-flying');
    }
    if (result.milestones.length) {
      button.dispatchEvent(
        new CustomEvent('scooby:milestone', {
          bubbles: true,
          detail: { milestones: result.milestones, count: result.count },
        }),
      );
    }
  };

  button.addEventListener('click', () => apply(feedSnack(state)));
}

/** Wire up the "Unmask the Villain" game. */
export function initUnmasker(opts = {}) {
  const button = opts.button ?? document.querySelector('[data-unmask]');
  const target = opts.target ?? document.querySelector('[data-unmask-result]');
  if (!button || !target) return;

  button.addEventListener('click', () => {
    const result = unmaskVillain(randomInt(100000));
    target.innerHTML = `
      <p class="reveal__headline">${escapeHtml(result.headline)}</p>
      <p class="reveal__confession">${escapeHtml(result.confession)}</p>
      <p class="reveal__iconic">${escapeHtml(result.iconic)}</p>
    `;
    target.classList.remove('is-revealed');
    void target.offsetWidth;
    target.classList.add('is-revealed');
  });
}

/** Wire up the random quote generator. */
export function initQuoteGenerator(opts = {}) {
  const button = opts.button ?? document.querySelector('[data-quote-roll]');
  const target = opts.target ?? document.querySelector('[data-quote]');
  if (!button || !target) return;

  let last = -1;
  button.addEventListener('click', () => {
    let next = randomInt(quoteCount());
    // Avoid repeating the same quote twice in a row when there's a choice.
    if (quoteCount() > 1) {
      while (next === last) next = randomInt(quoteCount());
    }
    last = next;
    target.textContent = quoteByIndex(next);
    target.classList.remove('is-fresh');
    void target.offsetWidth;
    target.classList.add('is-fresh');
  });
}

/** Drive the Mystery Machine across the hero on a loop. */
export function initMysteryMachine(opts = {}) {
  const van = opts.van ?? document.querySelector('[data-van]');
  if (!van) return;
  // Purely decorative; the animation lives in CSS. We just make sure it's on.
  van.classList.add('is-driving');
}

/** Master initializer — call once on DOMContentLoaded. */
export function init() {
  renderGang(document.querySelector('[data-gang]'));
  initSnackCounter();
  initUnmasker();
  initQuoteGenerator();
  initMysteryMachine();
}
