import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Importing the module graph verifies all ES module syntax is valid and
// every relative import resolves. The init functions are not invoked here
// (they touch the DOM / window), only checked for existence.
test('all source modules import without syntax/resolution errors', async () => {
  const main = await import(join(ROOT, 'src/main.js'));
  for (const name of ['initBackground', 'initTheme', 'initNav', 'initReveal', 'initForms']) {
    assert.equal(typeof main[name], 'function', `main should re-export ${name}`);
  }
});

test('each feature module exports its init function', async () => {
  const checks = [
    ['src/canvas.js', 'initBackground'],
    ['src/theme.js', 'initTheme'],
    ['src/nav.js', 'initNav'],
    ['src/reveal.js', 'initReveal'],
    ['src/form.js', 'initForms'],
  ];
  for (const [file, fn] of checks) {
    const mod = await import(join(ROOT, file));
    assert.equal(typeof mod[fn], 'function', `${file} should export ${fn}`);
  }
});
