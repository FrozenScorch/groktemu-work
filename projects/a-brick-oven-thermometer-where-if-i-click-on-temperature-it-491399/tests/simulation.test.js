import test from 'node:test';
import assert from 'node:assert/strict';
import { classify, glowStrength } from '../src/physics.js';
import { computeFrame } from '../src/house.js';

// computeFrame is the pure simulation math (no DOM). It decides how the house
// looks at a given temperature; the renderer just applies these values.

test('room temperature is quiet — no glow, no cracks, no melt, no frost', () => {
  const f = computeFrame(25);
  assert.equal(f.glowAlpha, 0);
  assert.equal(f.crackOpacity, 0);
  assert.equal(f.melt, 0);
  assert.equal(f.frostAlpha, 0);
  assert.equal(f.dripOpacity, 0);
  assert.equal(f.stage.id, 'cold');
});

test('freezing temperatures produce a frost tint', () => {
  const f = computeFrame(-30);
  assert.ok(f.frostAlpha > 0);
  assert.equal(f.stage.id, 'frozen');
});

test('glow ramps in with temperature and matches glowStrength', () => {
  const cool = computeFrame(300);
  const hot = computeFrame(900);
  assert.equal(cool.glowAlpha, 0);
  assert.ok(hot.glowAlpha > 0);
  assert.ok(Math.abs(hot.glowAlpha - glowStrength(900) * 0.92) < 1e-9);
});

test('cracks open between 573 and 900 °C', () => {
  assert.equal(computeFrame(400).crackOpacity, 0);
  assert.ok(computeFrame(700).crackOpacity > 0);
  assert.ok(computeFrame(800).crackOpacity > computeFrame(700).crackOpacity);
});

test('melt starts at 1300 °C and grows', () => {
  assert.equal(computeFrame(1200).melt, 0);
  assert.ok(computeFrame(1500).melt > 0);
  assert.ok(computeFrame(1900).melt > computeFrame(1500).melt);
  assert.equal(computeFrame(2200).melt, 1);
});

test('building matrix collapses (scaleY < 1) once melting', () => {
  const cold = computeFrame(25).buildingMatrix;
  const melted = computeFrame(2000).buildingMatrix;
  // matrix(a b c d e f) -> 4th token is the vertical scale
  const scaleY = (m) => Number(m.split(' ')[3]);
  assert.equal(scaleY(cold), 1);
  assert.ok(scaleY(melted) < 1, 'building should slump');
});

test('puddle spreads as the house melts (and is absent until melting)', () => {
  assert.equal(computeFrame(25).puddleRx, 0);
  assert.equal(computeFrame(1200).puddleRx, 0);
  assert.ok(computeFrame(1800).puddleRx > 0);
  assert.ok(computeFrame(1200).puddleRx < computeFrame(1800).puddleRx);
  assert.equal(computeFrame(2200).puddleRx, 110);
});

test('colour outputs are valid css rgb/rgba strings', () => {
  for (const t of [-30, 25, 600, 1200, 2000]) {
    const f = computeFrame(t);
    assert.match(f.skyFill, /^rgb\(\d+, \d+, \d+\)$/);
    assert.match(f.glowFill, /^rgb\(\d+, \d+, \d+\)$/);
  }
});

test('frame stage always agrees with classify', () => {
  for (const t of [-40, 0, 100, 573, 900, 1300, 1710, 2200]) {
    assert.equal(computeFrame(t).stage.id, classify(t).id);
  }
});
