import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_C,
  MAX_C,
  DEFAULT_TEMP_C,
  toCelsius,
  fromCelsius,
  formatTemp,
  blackbodyColor,
  glowStrength,
  glowColor,
  mercuryColor,
  STAGES,
  classify,
  PRESETS,
} from '../src/physics.js';

// --- range & defaults -------------------------------------------------------
test('default and range values are sane', () => {
  assert.ok(MIN_C < 0, 'minimum should be sub-zero');
  assert.ok(MAX_C > 1500, 'maximum should reach melting/vapor territory');
  assert.ok(DEFAULT_TEMP_C >= MIN_C && DEFAULT_TEMP_C <= MAX_C);
});

// --- conversion round-trips -------------------------------------------------
test('unit conversions round-trip correctly', () => {
  for (const c of [-40, 0, 25, 100, 573, 1000, 1710]) {
    assert.ok(Math.abs(toCelsius(fromCelsius(c, 'F'), 'F') - c) < 1e-9, `F round-trip @ ${c}`);
    assert.ok(Math.abs(toCelsius(fromCelsius(c, 'K'), 'K') - c) < 1e-9, `K round-trip @ ${c}`);
  }
});

test('known conversion anchors are correct', () => {
  assert.equal(Math.round(fromCelsius(0, 'F')), 32);
  assert.equal(Math.round(fromCelsius(100, 'F')), 212);
  assert.equal(Math.round(fromCelsius(0, 'K')), 273);
  assert.equal(Math.round(toCelsius(32, 'F')), 0);
  assert.equal(Math.round(toCelsius(212, 'F')), 100);
});

test('formatTemp renders the unit and value', () => {
  assert.match(formatTemp(100, 'C'), /100\s*°C/);
  assert.match(formatTemp(100, 'F'), /212\s*°F/);
});

// --- black-body colour ------------------------------------------------------
test('black-body colour is always a valid byte triple', () => {
  for (const k of [300, 1000, 1500, 2000, 2473]) {
    const [r, g, b] = blackbodyColor(k);
    for (const v of [r, g, b]) {
      assert.ok(v >= 0 && v <= 255 && Number.isInteger(v), `byte in range @ ${k}K`);
    }
  }
});

test('black-body colour heats from red toward white', () => {
  const red = blackbodyColor(1000); // 727 °C, dull red-orange
  const white = blackbodyColor(6000); // ~5727 °C, near daylight white
  // hotter body must not be less bright on any channel
  assert.ok(white[0] >= red[0] - 1);
  assert.ok(white[1] >= red[1]);
  assert.ok(white[2] >= red[2]);
  // at 1000 K the blue channel is ~0 (deep red/orange); near 6000 K it is high
  assert.ok(red[2] < 80);
  assert.ok(white[2] > 200);
});

// --- glow strength ----------------------------------------------------------
test('glow is off below 480 °C and saturated by 1000 °C', () => {
  assert.equal(glowStrength(25), 0);
  assert.equal(glowStrength(200), 0);
  assert.equal(glowStrength(479.9), 0);
  assert.ok(glowStrength(700) > 0 && glowStrength(700) < 1);
  assert.equal(glowStrength(1000), 1);
  assert.equal(glowStrength(2000), 1);
});

test('glowColor and mercuryColor return 3 bytes', () => {
  for (const t of [-20, 25, 500, 1000, 1800]) {
    assert.equal(glowColor(t).length, 3);
    assert.equal(mercuryColor(t).length, 3);
  }
});

// --- stages -----------------------------------------------------------------
test('every stage has the required descriptive fields', () => {
  for (const s of STAGES) {
    for (const key of ['id', 'name', 'effect', 'house', 'bricks', 'summary', 'fact']) {
      assert.equal(typeof s[key], 'string', `stage ${s.id} missing ${key}`);
      assert.ok(s[key].length > 0, `stage ${s.id} empty ${key}`);
    }
  }
});

test('stages are sorted ascending and the first spans -Infinity', () => {
  assert.equal(STAGES[0].at, -Infinity);
  for (let i = 1; i < STAGES.length; i++) {
    assert.ok(STAGES[i].at > STAGES[i - 1].at, `stage ${i} out of order`);
  }
});

test('classify picks the correct stage at key thresholds', () => {
  assert.equal(classify(-40).id, 'frozen');
  assert.equal(classify(-1).id, 'frozen');
  assert.equal(classify(0).id, 'cold');
  assert.equal(classify(99).id, 'cold');
  assert.equal(classify(100).id, 'boil');
  assert.equal(classify(430).id, 'pizza');
  assert.equal(classify(572).id, 'soak');
  assert.equal(classify(573).id, 'quartz');
  assert.equal(classify(800).id, 'calcine');
  assert.equal(classify(1000).id, 'fire');
  assert.equal(classify(1200).id, 'vitrify');
  assert.equal(classify(1299).id, 'vitrify');
  assert.equal(classify(1300).id, 'soften');
  assert.equal(classify(1710).id, 'slag');
  assert.equal(classify(2200).id, 'vapor');
});

test('classify never returns undefined across the full range', () => {
  for (let c = MIN_C; c <= MAX_C; c += 7) {
    assert.ok(classify(c), `classify failed @ ${c}`);
  }
});

// --- presets ----------------------------------------------------------------
test('presets are within range and map to a real stage id', () => {
  const ids = new Set(STAGES.map((s) => s.id));
  for (const p of PRESETS) {
    assert.ok(p.tempC >= MIN_C && p.tempC <= MAX_C, `preset ${p.label} out of range`);
    assert.ok(ids.has(classify(p.tempC).id), `preset ${p.label} has no stage`);
  }
});
