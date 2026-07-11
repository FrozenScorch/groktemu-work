import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const exists = (p) => access(p, constants.F_OK).then(() => true, () => false);

// Runs against the built output in dist/. The build script copies index.html
// and src/ verbatim, so the published HTML must reference assets with relative
// URLs — a GitHub Pages project site is served from a subdirectory, not root.
test('dist/index.html exists and uses relative asset URLs', async () => {
  assert.ok(await exists('dist/index.html'), 'build output missing: run `npm run build`');
  const html = await readFile('dist/index.html', 'utf8');
  // must NOT point at domain root
  assert.doesNotMatch(html, /href="\/src\//, 'absolute /src/ href breaks subdirectory hosting');
  assert.doesNotMatch(html, /src="\/src\//, 'absolute /src/ script breaks subdirectory hosting');
  // must reference the app entry and stylesheet relatively
  assert.match(html, /(href|src)="\.{1,2}\/src\/styles\.css"/);
  assert.match(html, /src="\.{1,2}\/src\/main\.js"/);
});

test('dist ships the source modules the HTML loads', async () => {
  assert.ok(await exists('dist/src/main.js'));
  assert.ok(await exists('dist/src/styles.css'));
  assert.ok(await exists('dist/src/physics.js'));
});
