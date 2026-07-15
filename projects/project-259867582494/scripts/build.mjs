// Production build: copies the static site into ./dist as-is.
// No bundler is needed — the site ships vanilla ES modules with relative
// URLs, so it works whether served from the domain root or a GitHub Pages
// subdirectory (e.g. https://user.github.io/repo/).
import { cp, mkdir, rm, writeFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';

const SOURCE_FILES = ['index.html', 'src/styles.css', 'src/main.js'];

async function exists(p) {
  try { await access(p, constants.F_OK); return true; } catch { return false; }
}

async function build() {
  // Sanity-check that required sources exist before producing output.
  for (const f of SOURCE_FILES) {
    if (!(await exists(f))) throw new Error(`Build source missing: ${f}`);
  }

  await rm('dist', { recursive: true, force: true });
  await mkdir('dist/src', { recursive: true });

  await cp('index.html', 'dist/index.html');
  await cp('src', 'dist/src', { recursive: true });

  // .nojekyll prevents GitHub Pages from stripping _-prefixed assets and
  // keeps the deployed tree byte-identical to /dist.
  await writeFile('dist/.nojekyll', '');

  const manifest = {
    name: 'aether',
    builtAt: 'production',
    entry: 'index.html',
    assets: ['index.html', 'src/styles.css', 'src/main.js', 'src/canvas.js', 'src/theme.js', 'src/nav.js', 'src/reveal.js', 'src/form.js'],
  };
  await writeFile('dist/build-manifest.json', JSON.stringify(manifest, null, 2));

  console.log('✓ Build complete → ./dist');
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exitCode = 1;
});
