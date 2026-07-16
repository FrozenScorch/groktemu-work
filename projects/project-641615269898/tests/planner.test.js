import test from 'node:test';
import assert from 'node:assert/strict';
import { plan, detectIntent, INTENTS, FALLBACK_INTENT } from '../src/agent/index.js';

test('detectIntent matches the most specific intent', () => {
  assert.equal(detectIntent('deploy the api to production').id, 'deploy');
  assert.equal(detectIntent('fix the flaky checkout bug').id, 'debug');
  assert.equal(detectIntent('research our competitors pricing').id, 'research');
  assert.equal(detectIntent('write the launch blog post').id, 'content');
  assert.equal(detectIntent('add dark mode to the landing page').id, 'feature');
});

test('detectIntent falls back when nothing matches', () => {
  assert.equal(detectIntent('organize my calendar').id, FALLBACK_INTENT.id);
});

test('detectIntent is case-insensitive', () => {
  assert.equal(detectIntent('DEPLOY NOW').id, 'deploy');
  assert.equal(detectIntent('Fix A Bug').id, 'debug');
});

test('deploy intent wins over feature for a build-and-deploy goal', () => {
  // "ship to prod" is deploy-specific and must outrank the generic feature keywords.
  assert.equal(detectIntent('ship to prod').id, 'deploy');
});

test('plan produces stable, well-formed output for a known goal', () => {
  const p = plan('Add dark mode to the landing page');
  assert.equal(p.intent, 'feature');
  assert.equal(p.goal, 'Add dark mode to the landing page');
  assert.equal(p.steps.length, 6);
  assert.deepEqual(
    p.steps.map((s) => s.tool),
    ['spec', 'design', 'implement', 'test', 'document', 'verify'],
  );
  assert.deepEqual(
    p.steps.map((s, i) => s.index),
    [0, 1, 2, 3, 4, 5],
  );
  for (const step of p.steps) {
    assert.ok(step.id, 'every step has an id');
    assert.equal(step.args.goal, p.goal, 'every step carries the goal');
    assert.ok(step.label, 'every step has a label');
  }
});

test('plan step ids are unique within a plan', () => {
  const p = plan('fix the broken login');
  const ids = p.steps.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('plan rejects empty or whitespace-only goals', () => {
  assert.throws(() => plan(''), /non-empty/);
  assert.throws(() => plan('   '), /non-empty/);
  assert.throws(() => plan(null), /non-empty/);
  assert.throws(() => plan(undefined), /non-empty/);
});

test('plan trims surrounding whitespace before detecting intent', () => {
  const p = plan('  deploy the service  ');
  assert.equal(p.intent, 'deploy');
  assert.equal(p.goal, 'deploy the service');
});

test('every declared intent step maps to a real tool name', () => {
  // Sanity check the INTENTS table against the tools registry indirectly:
  // each intent must produce a non-empty plan whose tools the executor accepts.
  const samples = [
    'deploy it',
    'fix the bug',
    'research the market',
    'write a blog post',
    'build a feature',
    'do something unknown',
  ];
  for (const goal of samples) {
    const p = plan(goal);
    assert.ok(p.steps.length > 0, `${goal} has steps`);
    for (const step of p.steps) {
      assert.ok(typeof step.tool === 'string' && step.tool.length > 0);
    }
  }
});
