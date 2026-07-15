import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

async function exists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

test('build script produces a dist directory with all assets', async () => {
  execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT });
  const expected = [
    'dist/index.html',
    'dist/.nojekyll',
    'dist/build-manifest.json',
    'dist/src/styles.css',
    'dist/src/main.js',
    'dist/src/canvas.js',
    'dist/src/theme.js',
    'dist/src/nav.js',
    'dist/src/reveal.js',
    'dist/src/form.js',
  ];
  for (const rel of expected) {
    assert.ok(await exists(join(ROOT, rel)), `missing build artifact: ${rel}`);
  }
});

test('index.html loads assets with RELATIVE paths (works under a Pages subdirectory)', async () => {
  const html = await readFile(join(DIST, 'index.html'), 'utf8');
  // Must NOT use domain-root-absolute asset URLs.
  assert.doesNotMatch(html, /(?:href|src)="\/(?:src|assets)\//, 'found an absolute /src/ or /assets/ asset URL');
  // Must reference the entry module and stylesheet relatively.
  assert.match(html, /src="\.\/src\/main\.js"/, 'entry module should be referenced via ./src/main.js');
  assert.match(html, /href="\.\/src\/styles\.css"/, 'stylesheet should be referenced via ./src/styles.css');
});

test('built JS modules are valid ES modules and import siblings relatively', async () => {
  const main = await readFile(join(DIST, 'src/main.js'), 'utf8');
  for (const mod of ['canvas.js', 'theme.js', 'nav.js', 'reveal.js', 'form.js']) {
    assert.match(main, new RegExp(`from ['"]\\./${mod}['"]`), `main.js must import ./${mod} relatively`);
  }
});

test('build manifest lists the entry and assets', async () => {
  const manifest = JSON.parse(await readFile(join(DIST, 'build-manifest.json'), 'utf8'));
  assert.equal(manifest.entry, 'index.html');
  assert.ok(Array.isArray(manifest.assets) && manifest.assets.length >= 5);
});
