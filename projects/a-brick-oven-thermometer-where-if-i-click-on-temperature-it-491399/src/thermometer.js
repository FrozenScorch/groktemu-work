/**
 * thermometer.js — the interactive thermometer.
 *
 * Renders a vertical mercury thermometer as SVG. Click (or drag) anywhere on
 * the column to set the oven temperature; preset chips jump to notable points.
 * The mercury height, colour and a moving readout all track the store.
 */

import {
  MIN_C,
  MAX_C,
  PRESETS,
  fromCelsius,
  mercuryColor,
  glowColor,
  glowStrength,
  rgb,
} from './physics.js';

// SVG geometry (viewBox units). The mercury column maps linearly between these.
const VB_W = 150;
const TUBE_X = 62;
const TUBE_W = 26;
const TUBE_TOP = 44; // y at MAX_C
const TUBE_BOTTOM = 452; // y at MIN_C
const BULB_CY = 478;
const BULB_R = 30;

const clampTemp = (c) => Math.max(MIN_C, Math.min(MAX_C, c));

function yFor(tempC) {
  const t = (tempC - MIN_C) / (MAX_C - MIN_C);
  return TUBE_BOTTOM - t * (TUBE_BOTTOM - TUBE_TOP);
}

/** °C value for a given SVG y-coordinate inside the column. */
function tempForY(y) {
  const t = (TUBE_BOTTOM - y) / (TUBE_BOTTOM - TUBE_TOP);
  return clampTemp(MIN_C + t * (MAX_C - MIN_C));
}

/** Build <text>/line tick marks for the scale. */
function buildTicks() {
  const frag = [];
  for (let c = MIN_C; c <= MAX_C; c += 100) {
    const y = yFor(c);
    const major = c % 200 === 0;
    frag.push(
      `<line class="tick ${major ? 'tick-major' : 'tick-minor'}" x1="${
        TUBE_X - 4
      }" y1="${y}" x2="${TUBE_X}" y2="${y}"/>`,
    );
    if (major) {
      frag.push(
        `<text class="tick-label" x="${TUBE_X - 8}" y="${y + 4}" text-anchor="end">${c}</text>`,
      );
    }
  }
  return frag.join('');
}

/** Coloured dots marking the preset "story" temperatures. */
function buildPresetDots() {
  return PRESETS.map((p) => {
    const y = yFor(p.tempC);
    return `<circle class="preset-dot" data-temp="${p.tempC}" cx="${
      TUBE_X + TUBE_W + 8
    }" cy="${y}" r="4.5" role="button" tabindex="0" aria-label="${p.label}: ${p.tempC} degrees Celsius"><title>${p.label} — ${p.tempC} °C</title></circle>`;
  }).join('');
}

export function mountThermometer(root, store) {
  root.innerHTML = `
    <div class="thermo-card">
      <svg id="thermo" viewBox="0 0 ${VB_W} 520" preserveAspectRatio="xMidYMid meet"
           role="slider" aria-label="Oven temperature" aria-valuemin="${MIN_C}"
           aria-valuemax="${MAX_C}" tabindex="0">
        <defs>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stop-color="#1f2937"/>
            <stop offset="0.4" stop-color="#374151"/>
            <stop offset="1" stop-color="#111827"/>
          </linearGradient>
          <radialGradient id="bulbSheen" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stop-color="rgba(255,255,255,0.55)"/>
            <stop offset="0.5" stop-color="rgba(255,255,255,0)"/>
          </radialGradient>
          <clipPath id="tubeClip">
            <rect x="${TUBE_X}" y="${TUBE_TOP}" width="${TUBE_W}" height="${
              TUBE_BOTTOM - TUBE_TOP
            }" rx="13"/>
          </clipPath>
        </defs>

        ${buildTicks()}

        <!-- glass tube + bulb outline -->
        <rect x="${TUBE_X}" y="${TUBE_TOP}" width="${TUBE_W}" height="${
          TUBE_BOTTOM - TUBE_TOP
        }" rx="13" fill="url(#glass)" stroke="#0b1220" stroke-width="2"/>
        <circle cx="${TUBE_X + TUBE_W / 2}" cy="${BULB_CY}" r="${BULB_R}"
                fill="url(#glass)" stroke="#0b1220" stroke-width="2"/>

        <!-- mercury (filled dynamically) -->
        <g clip-path="url(#tubeClip)">
          <rect id="mercuryCol" x="${TUBE_X}" y="${TUBE_BOTTOM}" width="${TUBE_W}"
                height="0"/>
        </g>
        <circle id="mercuryBulb" cx="${TUBE_X + TUBE_W / 2}" cy="${BULB_CY}" r="${BULB_R - 5}"/>
        <circle cx="${TUBE_X + TUBE_W / 2}" cy="${BULB_CY}" r="${BULB_R}"
                fill="url(#bulbSheen)" pointer-events="none"/>

        <!-- moving readout marker -->
        <g id="marker">
          <line id="markerLine" x1="${TUBE_X - 6}" y1="${TUBE_BOTTOM}" x2="${
            TUBE_X + TUBE_W + 28
          }" y2="${TUBE_BOTTOM}"/>
          <rect id="markerTag" x="${TUBE_X + TUBE_W + 30}" y="${TUBE_BOTTOM - 11}"
                width="56" height="22" rx="5"/>
          <text id="markerText" x="${TUBE_X + TUBE_W + 58}" y="${
            TUBE_BOTTOM + 4
          }" text-anchor="middle"></text>
        </g>

        <!-- preset dots (clickable) -->
        ${buildPresetDots()}
      </svg>

      <p class="thermo-hint">Click the column or a dot — drag to sweep.</p>
    </div>
  `;

  const svg = root.querySelector('#thermo');
  const mercuryCol = root.querySelector('#mercuryCol');
  const mercuryBulb = root.querySelector('#mercuryBulb');
  const markerLine = root.querySelector('#markerLine');
  const markerTag = root.querySelector('#markerTag');
  const markerText = root.querySelector('#markerText');

  function clientYToTemp(clientY) {
    const pt = svg.createSVGPoint();
    pt.x = 0;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return MIN_C;
    const local = pt.matrixTransform(ctm.inverse());
    return tempForY(local.y);
  }

  // Pointer drag on the column.
  let dragging = false;
  function apply(clientY) {
    store.set({ tempC: Math.round(clientYToTemp(clientY)) });
  }
  function onDown(e) {
    // Ignore clicks that land on a preset dot — it has its own handler.
    if (e.target.classList && e.target.classList.contains('preset-dot')) return;
    dragging = true;
    svg.setPointerCapture?.(e.pointerId);
    apply(e.clientY);
    e.preventDefault();
  }
  function onMove(e) {
    if (!dragging) return;
    apply(e.clientY);
  }
  function onUp(e) {
    dragging = false;
    svg.releasePointerCapture?.(e.pointerId);
  }
  svg.addEventListener('pointerdown', onDown);
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerup', onUp);
  svg.addEventListener('pointercancel', onUp);

  // Keyboard: arrow keys nudge the temperature.
  svg.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 50 : 5;
    const cur = store.get().tempC;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      store.set({ tempC: clampTemp(cur + step) });
      e.preventDefault();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      store.set({ tempC: clampTemp(cur - step) });
      e.preventDefault();
    }
  });

  // Preset dot clicks (mouse + keyboard).
  for (const dot of svg.querySelectorAll('.preset-dot')) {
    const tempC = Number(dot.dataset.temp);
    const activate = () => store.set({ tempC });
    dot.addEventListener('click', activate);
    dot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        activate();
        e.preventDefault();
      }
    });
  }

  // React to store changes.
  store.subscribe(({ tempC, unit }) => {
    const y = yFor(tempC);
    const col = mercuryColor(tempC);
    const fill = rgb(col);

    mercuryCol.setAttribute('y', y);
    mercuryCol.setAttribute('height', TUBE_BOTTOM - y);
    mercuryCol.setAttribute('fill', fill);
    mercuryBulb.setAttribute('fill', fill);

    // Marker
    markerLine.setAttribute('y1', y);
    markerLine.setAttribute('y2', y);
    markerTag.setAttribute('y', y - 11);
    markerText.setAttribute('y', y + 4);
    const readout = Math.round(fromCelsius(tempC, unit));
    markerText.textContent = `${readout} °${unit}`;
    // Solid, readable tag; picks up the black-body tint only once glowing.
    markerTag.setAttribute(
      'fill',
      glowStrength(tempC) > 0 ? rgb(glowColor(tempC), 0.9) : '#334155',
    );

    svg.setAttribute('aria-valuenow', Math.round(tempC));
    svg.setAttribute('aria-valuetext', `${readout} degrees ${unit === 'K' ? 'kelvin' : unit === 'F' ? 'fahrenheit' : 'celsius'}`);
  });
}
