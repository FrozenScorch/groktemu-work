/**
 * house.js — the brick-house simulator.
 *
 * A single SVG scene whose every part reacts to the temperature: the sky
 * warms, the bricks incandesce (real black-body colour), cracks open, the
 * walls slump and melt, and a particle layer throws off frost, steam, smoke,
 * embers or vapour depending on the stage.
 */

import { classify, glowColor, glowStrength, rgb } from './physics.js';

const GROUND_Y = 300;
const SKY_COLD = [11, 16, 38]; // night
const SKY_WARM = [58, 22, 8]; // ember-lit

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [
  Math.round(lerp(c1[0], c2[0], t)),
  Math.round(lerp(c1[1], c2[1], t)),
  Math.round(lerp(c1[2], c2[2], t)),
];

/** Everything the renderer needs to know, derived from a single °C reading. */
export function computeFrame(tempC) {
  const stage = classify(tempC);
  const warmth = clamp((tempC + 40) / 900, 0, 1);
  const melt = clamp((tempC - 1300) / (2200 - 1300), 0, 1); // 0 until 1300 °C
  const crack = clamp((tempC - 573) / (900 - 573), 0, 1) * (1 - melt); // opens 573–900, fades as it melts
  const glow = glowStrength(tempC);

  const sky = mix(SKY_COLD, SKY_WARM, warmth);
  const gc = glowColor(tempC);

  // Building "slump": vertical scale about the ground line + slight shear.
  const scaleY = 1 - 0.5 * melt;
  const shear = 0.05 * melt;
  const fy = GROUND_Y * (1 - scaleY);
  const buildingMatrix = `matrix(1 0 ${shear} ${scaleY} 0 ${fy})`;

  return {
    stage,
    skyFill: rgb(sky),
    starOpacity: 1 - warmth,
    glowFill: rgb(gc),
    glowAlpha: glow * 0.92,
    frostAlpha: tempC < 0 ? clamp(-tempC / 40, 0, 1) * 0.4 : 0,
    crackOpacity: crack,
    melt,
    buildingMatrix,
    puddleRx: 110 * melt,
    dripOpacity: melt,
    showSmoke: tempC >= 100 && tempC < 1710 ? clamp((tempC - 60) / 120, 0, 1) : 0,
  };
}

export function mountHouse(root, store) {
  root.innerHTML = `
    <div class="house-stage" id="houseStage" data-effect="none">
      <svg id="house" viewBox="0 0 420 360" preserveAspectRatio="xMidYMid meet"
           role="img" aria-labelledby="houseTitle">
        <title id="houseTitle">Brick house simulator</title>
        <defs>
          <pattern id="brickPat" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="40" height="40" fill="#9d4533"/>
            <rect y="0" width="40" height="2.4" fill="#ecdcc6"/>
            <rect y="20" width="40" height="2.4" fill="#ecdcc6"/>
            <rect x="0" y="0" width="2.4" height="20" fill="#ecdcc6"/>
            <rect x="20" y="20" width="2.4" height="20" fill="#ecdcc6"/>
          </pattern>
          <radialGradient id="windowGlow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0" stop-color="#ffe7a8"/>
            <stop offset="1" stop-color="#e0a541"/>
          </radialGradient>
        </defs>

        <!-- sky -->
        <rect id="sky" x="0" y="0" width="420" height="360"/>
        <g id="stars" opacity="1">
          <circle cx="60" cy="50" r="1.6" class="star"/>
          <circle cx="110" cy="30" r="1.2" class="star"/>
          <circle cx="330" cy="60" r="1.6" class="star"/>
          <circle cx="380" cy="35" r="1.2" class="star"/>
          <circle cx="300" cy="25" r="1" class="star"/>
          <circle cx="40" cy="90" r="1" class="star"/>
        </g>
        <circle id="moon" cx="70" cy="70" r="22" fill="#f4f1e0"/>

        <!-- ground -->
        <rect x="0" y="${GROUND_Y}" width="420" height="60" fill="#1c2b14"/>
        <rect x="0" y="${GROUND_Y}" width="420" height="6" fill="#2c401d"/>

        <!-- molten puddle (drawn behind the building so it looks like it spreads out) -->
        <ellipse id="puddle" cx="210" cy="${GROUND_Y}" rx="0" ry="0"/>

        <!-- building group (slumps/melts as one) -->
        <g id="building">
          <!-- chimney smoke puffs -->
          <g id="smoke">
            <circle cx="266" cy="104" r="7" class="puff puff1"/>
            <circle cx="266" cy="104" r="6" class="puff puff2"/>
            <circle cx="266" cy="104" r="5" class="puff puff3"/>
          </g>

          <!-- roof -->
          <polygon points="110,165 310,165 210,92" fill="#5a2a1c" stroke="#3a1a12" stroke-width="2"/>
          <polygon points="110,165 310,165 210,92" fill="none" stroke="#2a120d" stroke-width="2" opacity="0.4"/>
          <!-- chimney -->
          <rect x="252" y="108" width="22" height="58" fill="#7e3a2b" stroke="#3a1a12" stroke-width="1.5"/>
          <!-- wall -->
          <rect x="120" y="160" width="180" height="140" fill="url(#brickPat)" stroke="#3a1a12" stroke-width="2"/>
          <!-- door -->
          <rect x="195" y="246" width="50" height="54" fill="#2a1a10" rx="3"/>
          <circle cx="236" cy="274" r="2" fill="#caa24a"/>
          <!-- windows -->
          <rect x="140" y="196" width="44" height="44" fill="url(#windowGlow)" rx="2"/>
          <rect x="236" y="196" width="44" height="44" fill="url(#windowGlow)" rx="2"/>
          <path d="M162 196 V240 M140 218 H184 M258 196 V240 M236 218 H280" stroke="#2a1a10" stroke-width="1.6" opacity="0.6"/>

          <!-- cracks -->
          <g id="cracks" stroke="#170b06" stroke-width="1.6" fill="none" stroke-linecap="round" opacity="0">
            <path d="M150 160 l8 30 l-6 22 l10 24 l-4 30 l8 24"/>
            <path d="M260 162 l-7 26 l9 18 l-6 26 l7 20"/>
            <path d="M210 160 l5 18 l-8 16 l6 22 l-5 16 l9 14"/>
            <path d="M180 246 l10 16 M240 250 l-9 14 M155 250 l6 14"/>
          </g>

          <!-- melt drips along the wall base -->
          <g id="drips" opacity="0">
            <ellipse cx="150" cy="296" rx="5" ry="9"/>
            <ellipse cx="200" cy="298" rx="6" ry="11"/>
            <ellipse cx="245" cy="296" rx="5" ry="8"/>
            <ellipse cx="280" cy="297" rx="4" ry="7"/>
          </g>
        </g>

        <!-- black-body glow over everything (screen blend) -->
        <rect id="glow" x="100" y="80" width="230" height="230" style="mix-blend-mode:screen"/>
        <!-- frost tint (cold) -->
        <rect id="frost" x="100" y="80" width="230" height="230" fill="#bfe3ff" style="mix-blend-mode:screen"/>
      </svg>

      <!-- CSS particle layer -->
      <div class="fx" aria-hidden="true">
        ${Array.from({ length: 16 }, (_, i) => `<span class="particle p${i}"></span>`).join('')}
      </div>
    </div>
  `;

  // Collect references once; mutate attributes on each store change.
  const stage = root.querySelector('#houseStage');
  const sky = root.querySelector('#sky');
  const stars = root.querySelector('#stars');
  const moon = root.querySelector('#moon');
  const glow = root.querySelector('#glow');
  const frost = root.querySelector('#frost');
  const building = root.querySelector('#building');
  const cracks = root.querySelector('#cracks');
  const drips = root.querySelector('#drips');
  const puddle = root.querySelector('#puddle');
  const smoke = root.querySelector('#smoke');

  // Coalesce rapid drag updates into one animation frame.
  let pending = null;
  function schedule(state) {
    pending = state;
    if (schedule.raf) return;
    schedule.raf = requestAnimationFrame(() => {
      schedule.raf = null;
      paint(pending);
    });
  }
  schedule.raf = null;

  function paint(state) {
    const f = computeFrame(state.tempC);

    sky.setAttribute('fill', f.skyFill);
    stars.setAttribute('opacity', f.starOpacity);
    moon.setAttribute('opacity', f.starOpacity);
    glow.setAttribute('fill', f.glowFill);
    glow.setAttribute('opacity', f.glowAlpha);
    frost.setAttribute('opacity', f.frostAlpha);
    building.setAttribute('transform', f.buildingMatrix);
    cracks.setAttribute('opacity', f.crackOpacity);
    drips.setAttribute('opacity', f.dripOpacity);
    drips.setAttribute('fill', f.glowFill);
    puddle.setAttribute('rx', f.puddleRx);
    puddle.setAttribute('ry', 8 + 16 * f.melt);
    puddle.setAttribute('fill', rgb(glowColor(state.tempC), 0.9 * f.melt));
    smoke.setAttribute('opacity', f.showSmoke);
    stage.setAttribute('data-effect', f.stage.effect);
    stage.setAttribute('data-temp', Math.round(state.tempC));
  }

  store.subscribe(schedule);
}
