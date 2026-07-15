// App bootstrap. Each module guards against missing elements so a partial
// DOM (e.g. in tests) never throws.
import { initBackground } from './canvas.js';
import { initTheme } from './theme.js';
import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initForms } from './form.js';

function whenReady(fn) {
  // Guard so the entry module is safe to import in non-DOM environments
  // (tests, SSR). In a browser the DOM is always present.
  if (typeof document === 'undefined') return;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn, { once: true });
  } else {
    fn();
  }
}

whenReady(() => {
  initTheme();
  initNav();
  initReveal();
  initForms();
  initBackground(document.getElementById('bg-canvas'));
});

// Exported for potential unit testing of the bootstrap wiring.
export { initBackground, initTheme, initNav, initReveal, initForms };
