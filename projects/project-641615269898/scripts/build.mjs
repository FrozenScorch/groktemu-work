// Production build.
//
// Bundles + minifies the JS entry into a single dist/app.js with esbuild,
// copies the stylesheet next to it, and emits a dist/index.html whose asset
// URLs are all relative (./app.js, ./styles.css). Relative URLs are required
// because the site may be published under a GitHub Pages subdirectory rather
// than the domain root.

import { rm, mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import esbuild from 'esbuild';

const ROOT = new URL('..', import.meta.url);
const resolve = (p) => new URL(p, ROOT).pathname;

await rm(resolve('dist'), { recursive: true, force: true });
await mkdir(resolve('dist'), { recursive: true });

// 1) Bundle + minify the application graph into one ES module.
await esbuild.build({
  entryPoints: [resolve('src/main.js')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  sourcemap: false,
  outfile: resolve('dist/app.js'),
  logLevel: 'info',
});

// 2) Copy the stylesheet next to the bundle.
await cp(resolve('src/styles.css'), resolve('dist/styles.css'));

// 3) Produce dist/index.html with relative asset URLs.
const html = await readFile(resolve('index.html'), 'utf8');
const outHtml = html
  .replace('./src/main.js', './app.js')
  .replace('./src/styles.css', './styles.css');
await writeFile(resolve('dist/index.html'), outHtml);

// 4) Guard the GitHub Pages assumption: no absolute (root) asset references.
const absoluteAssetRefs = [
  ...outHtml.matchAll(/(?:src|href)\s*=\s*"\/[^"]*"/gi),
].map((m) => m[0]);
if (absoluteAssetRefs.length) {
  throw new Error(`Build produced absolute asset URLs: ${absoluteAssetRefs.join(', ')}`);
}
if (!existsSync(resolve('dist/app.js'))) throw new Error('Bundle missing: dist/app.js');
if (!existsSync(resolve('dist/styles.css'))) throw new Error('Stylesheet missing: dist/styles.css');
if (!outHtml.includes('./app.js') || !outHtml.includes('./styles.css')) {
  throw new Error('index.html is not referencing the bundled assets by relative URL');
}

console.log('\n✓ Build complete → dist/');
console.log('  dist/index.html, dist/app.js, dist/styles.css');
