// App entry point. Runs after the DOM is ready, then boots the silly features.
import { init } from './ui.js';

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
