import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

import {
  createSnackState,
  feedSnack,
  reactionForCount,
  milestonesHit,
  villainByIndex,
  describeReveal,
  unmaskVillain,
  quoteByIndex,
  quoteCount,
} from '../src/logic.js';
import {
  GANG,
  VILLAINS,
  QUOTES,
  SNACK_REACTIONS,
  ICONIC_REVEAL,
} from '../src/data.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const read = (rel) => readFile(path.join(ROOT, rel), 'utf8');

// --- Seed sanity (kept from scaffold, expanded) --------------------------

test('seed arithmetic is valid', () => assert.equal(1 + 1, 2));

// --- Data integrity ------------------------------------------------------

test('GANG has the five meddling kids with required fields', () => {
  assert.equal(GANG.length, 5);
  for (const member of GANG) {
    assert.ok(member.name, 'member needs a name');
    assert.ok(member.role, `${member.name} needs a role`);
    assert.ok(member.catchphrase, `${member.name} needs a catchphrase`);
    assert.ok(member.quirk, `${member.name} needs a quirk`);
    assert.match(member.color, /^#[0-9a-f]{6}$/i, 'color must be a hex code');
  }
});

test('VILLAINS are non-empty and well-formed', () => {
  assert.ok(VILLAINS.length >= 6, 'should include several classic villains');
  for (const v of VILLAINS) {
    assert.ok(v.disguise, 'villain needs a disguise');
    assert.ok(v.real, `${v.disguise} needs a real identity`);
    assert.ok(v.motive, `${v.disguise} needs a motive`);
  }
});

test('QUOTES are non-empty and unique', () => {
  assert.ok(QUOTES.length >= 5);
  assert.equal(new Set(QUOTES).size, QUOTES.length, 'quotes must be unique');
});

test('SNACK_REACTIONS milestones are sorted and start at 0', () => {
  const milestones = SNACK_REACTIONS.map((r) => r.milestone);
  assert.equal(milestones[0], 0);
  for (let i = 1; i < milestones.length; i++) {
    assert.ok(milestones[i] > milestones[i - 1], 'milestones must strictly increase');
  }
  for (const r of SNACK_REACTIONS) {
    assert.ok(r.title, `milestone ${r.milestone} needs a title`);
    assert.ok(r.message, `milestone ${r.milestone} needs a message`);
  }
});

// --- Snack counter logic -------------------------------------------------

test('createSnackState starts at zero', () => {
  assert.deepEqual(createSnackState(), { count: 0 });
});

test('feedSnack increments without mutating the input state', () => {
  const state = createSnackState();
  const frozen = { count: state.count };
  const r1 = feedSnack(state);
  const r2 = feedSnack(r1.state);
  assert.equal(r1.count, 1);
  assert.equal(r2.count, 2);
  assert.equal(state.count, frozen.count, 'original state must not be mutated');
});

test('reactionForCount escalates at each milestone', () => {
  assert.equal(reactionForCount(0).milestone, 0);
  assert.equal(reactionForCount(4).milestone, 0);
  assert.equal(reactionForCount(5).milestone, 5);
  assert.equal(reactionForCount(9).milestone, 5);
  assert.equal(reactionForCount(10).milestone, 10);
  assert.equal(reactionForCount(99).milestone, 50);
  assert.equal(reactionForCount(1000).milestone, 100);
});

test('milestonesHit only fires on the exact milestone', () => {
  assert.deepEqual(milestonesHit(0), []);
  assert.deepEqual(milestonesHit(4), []);
  assert.deepEqual(milestonesHit(10), [10]);
  assert.deepEqual(milestonesHit(50), [50]);
});

test('feedSnack reports a milestone exactly once when reached', () => {
  let state = createSnackState();
  const hits = [];
  for (let i = 0; i < 12; i++) {
    const r = feedSnack(state);
    state = r.state;
    if (r.milestones.length) hits.push(...r.milestones);
  }
  assert.deepEqual(hits, [5, 10]);
});

// --- Villain unmasking logic ---------------------------------------------

test('villainByIndex wraps safely on out-of-range and negative indices', () => {
  assert.equal(villainByIndex(0), VILLAINS[0]);
  assert.equal(villainByIndex(VILLAINS.length), VILLAINS[0], 'wraps past the end');
  assert.equal(villainByIndex(-1), VILLAINS[VILLAINS.length - 1], 'wraps negative');
  assert.throws(() => villainByIndex(0, []), /empty list/);
});

test('describeReveal includes the iconic meddling-kids confession', () => {
  const reveal = describeReveal(VILLAINS[0]);
  assert.ok(reveal.headline.includes(VILLAINS[0].real));
  assert.equal(reveal.iconic, ICONIC_REVEAL);
  assert.match(reveal.iconic, /meddling kids/);
});

test('unmaskVillain bundles villain + reveal copy', () => {
  const result = unmaskVillain(2);
  assert.equal(result.villain, VILLAINS[2]);
  assert.ok(result.headline && result.confession && result.iconic);
});

// --- Quote generator logic -----------------------------------------------

test('quoteByIndex wraps and only returns known quotes', () => {
  const set = new Set(QUOTES);
  assert.ok(set.has(quoteByIndex(0)));
  assert.ok(set.has(quoteByIndex(QUOTES.length + 3)));
  assert.equal(quoteByIndex(-2), quoteByIndex(QUOTES.length - 2));
  assert.equal(quoteCount(), QUOTES.length);
});

// --- Relative URL guard (subdirectory-safe for GitHub Pages) -------------

/** Fail if any asset reference is an absolute path (would break under a subdirectory). */
function assertRelativeAssets(html, label) {
  const matches = [...html.matchAll(/\s(?:src|href)\s*=\s*"\/[^/]/gi)];
  assert.equal(
    matches.length,
    0,
    `${label} must use relative asset URLs; found absolute: ${matches.map((m) => m[0]).join(', ')}`,
  );
}

test('index.html uses relative asset URLs and wires up the app', async () => {
  const html = await read('index.html');
  assertRelativeAssets(html, 'index.html');
  assert.match(html, /href="\.\/src\/style\.css"/, 'must link the stylesheet relatively');
  assert.match(html, /src="\.\/src\/main\.js"/, 'must load the entry script relatively');
});

/** Strip JS comments so we test code, not prose (comments may mention DOM APIs). */
function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

test('data.js and logic.js are DOM-free so they import cleanly in Node', async () => {
  // These modules are imported by the tests directly. Any `document`/`window`
  // reference would crash under node:test. ui.js is the DOM layer and is only
  // loaded by the browser entry point.
  const data = await read('src/data.js');
  const logic = await read('src/logic.js');
  const ui = await read('src/ui.js');
  assert.doesNotMatch(stripJsComments(data), /\b(document|window)\b/, 'data.js must be DOM-free');
  assert.doesNotMatch(stripJsComments(logic), /\b(document|window)\b/, 'logic.js must be DOM-free');
  assert.match(stripJsComments(ui), /document\.querySelector/, 'ui.js should be the DOM layer');
});

// --- Build integration ---------------------------------------------------

test('production build copies assets and keeps relative URLs', () => {
  // Run the real build script. Fast & deterministic (pure file copies).
  execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT });

  const distIndex = path.join(ROOT, 'dist', 'index.html');
  const distMain = path.join(ROOT, 'dist', 'src', 'main.js');
  const distStyle = path.join(ROOT, 'dist', 'src', 'style.css');
  const distData = path.join(ROOT, 'dist', 'src', 'data.js');
  const distLogic = path.join(ROOT, 'dist', 'src', 'logic.js');
  const distUi = path.join(ROOT, 'dist', 'src', 'ui.js');

  for (const f of [distIndex, distMain, distStyle, distData, distLogic, distUi]) {
    assert.ok(existsSync(f) && statSync(f).size > 0, `build output missing/empty: ${path.relative(ROOT, f)}`);
  }

  const distHtml = execFileSync('cat', [distIndex], { encoding: 'utf8' });
  assertRelativeAssets(distHtml, 'dist/index.html');
  assert.match(distHtml, /src="\.\/src\/main\.js"/, 'dist must keep the relative script path');
});
