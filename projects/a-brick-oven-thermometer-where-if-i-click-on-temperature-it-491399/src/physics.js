/**
 * physics.js — the scientific core of the brick-oven thermometer.
 *
 * Everything in here is pure (no DOM) so it can be unit-tested under Node.
 * The UI modules import these helpers to decide what the brick house looks
 * like and what to tell the user at a given temperature.
 */

// ---------------------------------------------------------------------------
// Temperature range shown on the thermometer (°C).
// ---------------------------------------------------------------------------
export const MIN_C = -40;
export const MAX_C = 2200;
export const DEFAULT_TEMP_C = 25;

// ---------------------------------------------------------------------------
// Unit conversion. `unit` is 'C' | 'F' | 'K'.
// ---------------------------------------------------------------------------
export function toCelsius(value, unit) {
  switch (unit) {
    case 'F':
      return (value - 32) * (5 / 9);
    case 'K':
      return value - 273.15;
    case 'C':
    default:
      return value;
  }
}

export function fromCelsius(celsius, unit) {
  switch (unit) {
    case 'F':
      return celsius * (9 / 5) + 32;
    case 'K':
      return celsius + 273.15;
    case 'C':
    default:
      return celsius;
  }
}

/** Round half away from zero so 573.5 -> 574, -0.5 -> -1. */
function roundHalfAway(n) {
  return n < 0 ? -Math.round(-n) : Math.round(n);
}

export function formatTemp(celsius, unit) {
  const value = fromCelsius(celsius, unit);
  return `${roundHalfAway(value)} °${unit}`;
}

// ---------------------------------------------------------------------------
// Black-body colour — Tanner Helland's approximation, returns sRGB [r,g,b].
// Used to colour the brick glow and the mercury as the oven heats up.
// ---------------------------------------------------------------------------
function clampByte(x) {
  if (x < 0) return 0;
  if (x > 255) return 255;
  return x;
}

export function blackbodyColor(kelvin) {
  const t = kelvin / 100;
  let r;
  let g;
  let b;

  // Red
  if (t <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
  }

  // Green
  if (t <= 66) {
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  }

  // Blue
  if (t >= 66) {
    b = 255;
  } else if (t <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  }

  return [Math.round(clampByte(r)), Math.round(clampByte(g)), Math.round(clampByte(b))];
}

export function rgb([r, g, b], alpha) {
  if (alpha === undefined) return `rgb(${r}, ${g}, ${b})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * How strongly the bricks are visibly glowing, 0..1.
 * Incandescence first becomes visible to dark-adapted eyes around ~480 °C
 * and is unmistakable by ~1000 °C.
 */
export function glowStrength(celsius) {
  if (celsius < 480) return 0;
  if (celsius >= 1000) return 1;
  return (celsius - 480) / (1000 - 480);
}

/** Colour of the glowing brick surface at a given temperature. */
export function glowColor(celsius) {
  return blackbodyColor(celsius + 273.15);
}

/**
 * Decorative colour for the thermometer's mercury column. Real mercury dye
 * doesn't emit light, so below the incandescence threshold we use a stylised
 * cold→hot ramp; above it we switch to the physical black-body colour.
 */
export function mercuryColor(celsius) {
  if (celsius < 0) return [59, 130, 246]; // icy blue
  if (celsius < 100) return [100, 116, 139]; // slate (ambient)
  if (celsius < 480) return [185, 28, 28]; // dark red (heating)
  return glowColor(celsius);
}

// ---------------------------------------------------------------------------
// Stages. `at` is the lower-bound temperature (°C); a reading belongs to the
// last stage whose `at` it is >=. Sorted ascending; -Infinity first.
// ---------------------------------------------------------------------------
export const STAGES = [
  {
    at: -Infinity,
    id: 'frozen',
    name: 'Frozen',
    effect: 'frost',
    house: 'Frost clings to the walls and icicles hang from the eaves.',
    bricks: 'Pore water inside the bricks freezes and expands — they turn brittle.',
    mortar: 'Frozen solid.',
    summary:
      'Bitter cold. Any moisture trapped in the bricks freezes solid. Over many freeze–thaw cycles the brick faces can pop off in flakes — a slow weathering called spalling.',
    fact: 'Freeze–thaw weathering is why old brickwork crumbles fastest in cold, wet climates.',
  },
  {
    at: 0,
    id: 'cold',
    name: 'Comfortable',
    effect: 'none',
    house: 'A snug brick house at everyday temperature.',
    bricks: 'Solid and unchanged.',
    mortar: 'Holding strong.',
    summary:
      'A normal day. Fired brick is remarkably inert between freezing and boiling — it just sits there, storing and releasing heat slowly thanks to its thermal mass.',
    fact: "A brick wall's heavy thermal mass is why brick houses stay cool by day and warm by night.",
  },
  {
    at: 100,
    id: 'boil',
    name: 'Water boils',
    effect: 'steam',
    house: 'Damp patches hiss as trapped water flashes to steam.',
    bricks: 'Unchanged structurally, but drying out fast.',
    mortar: 'Still sound.',
    summary:
      "100 °C — the boiling point of water at sea level. There's no damage yet, but any water inside the bricks or mortar turns to steam and jets out through the pores.",
    fact: 'Steam expands to roughly 1,700× the volume of the water it came from — that hiss is a lot of gas escaping.',
  },
  {
    at: 150,
    id: 'bake',
    name: 'Baking heat',
    effect: 'none',
    house: 'Warm to the touch, like the wall of an oven.',
    bricks: 'Completely fine.',
    mortar: 'Fine.',
    summary:
      'Hot kitchen territory. Bread bakes around here (≈200–230 °C). The bricks happily absorb and hold this heat — this is exactly what a masonry oven relies on.',
    fact: 'A brick oven cooks with stored radiant heat, not a live flame — load it once, bake all day.',
  },
  {
    at: 300,
    id: 'hot',
    name: 'Roasting',
    effect: 'none',
    house: 'Glowing warm, radiating heat.',
    bricks: 'A little over warm, but perfectly stable.',
    mortar: 'Beginning to lose its free water.',
    summary:
      'Approaching true oven heat. The bricks are untroubled; the mortar is quietly dehydrating as its chemically unbound water steams away.',
    fact: 'Even now the bricks show no glow — solid materials only start to visibly incandesce above ~480 °C.',
  },
  {
    at: 430,
    id: 'pizza',
    name: 'Pizza-oven heat',
    effect: 'shimmer',
    house: 'This is the sweet spot a brick oven is built for.',
    bricks: 'In their element — soaking and radiating perfect hearth heat.',
    mortar: 'Stressed but holding.',
    summary:
      'Around 430–480 °C is the legendary temperature of a Neapolitan brick pizza oven. The dome and floor store this heat and radiate it back onto the dough, baking a pizza in about 90 seconds.',
    fact: 'A real Neapolitan pizza is legally defined to bake in 60–90 seconds on a ~430 °C brick floor.',
  },
  {
    at: 500,
    id: 'soak',
    name: 'Soaking heat',
    effect: 'shimmer',
    house: 'The air above the roof ripples with heat shimmer.',
    bricks: 'On the very edge of glowing.',
    mortar: 'Dehydrated and becoming brittle.',
    summary:
      'Deep, soaking heat. The mortar has now lost most of its bound water and is growing powdery; the bricks are almost — but not quite — hot enough to glow.',
    fact: 'Masons "soak" brickwork with steady heat to drive out every last drop of moisture before pushing hotter.',
  },
  {
    at: 573,
    id: 'quartz',
    name: 'Quartz inversion',
    effect: 'embers',
    house: 'A faint dull-red glow appears, and the walls can crack without warning.',
    bricks: 'The quartz inside the clay suddenly expands — a cracking hazard.',
    mortar: 'Brittle and crumbling.',
    summary:
      '573 °C is the famous quartz-inversion point. Quartz crystals in the clay flip from α to β form and instantly grow about 0.8%. Heat through this too fast and the bricks crack with an audible "ping" (dunting).',
    fact: 'Potters and kiln operators always ramp temperature slowly through 573 °C to avoid dunting their work.',
  },
  {
    at: 650,
    id: 'redheat',
    name: 'Red heat',
    effect: 'embers',
    house: 'The whole house glows a dull cherry red in the dark.',
    bricks: 'Glowing red; their chemically combined water is finally driven off.',
    mortar: 'Powder.',
    summary:
      'Cherry-red heat. The last of the chemically bound water is leaving the clay. The bricks are now permanently altered — re-fire them from here and they will vitrify into harder ceramic.',
    fact: '"Red heat" is an old blacksmiths\' temperature gauge: visible red glow begins near 650 °C.',
  },
  {
    at: 800,
    id: 'calcine',
    name: 'Mortar calcines',
    effect: 'embers',
    house: 'The mortar turns to dust and the bricks begin to come loose.',
    bricks: 'Solid and glowing bright red.',
    mortar: 'Calcined — the cement has decomposed.',
    summary:
      "800 °C is where Portland-cement mortar calcines: calcium hydroxide and calcium carbonate decompose, and the mortar crumbles to powder. With nothing holding them, the bricks start to shift and fall.",
    fact: 'This is why fireplaces and kilns use refractory (fireclay) mortar — ordinary cement simply cannot survive 800 °C.',
  },
  {
    at: 900,
    id: 'fire',
    name: 'Kiln-firing heat',
    effect: 'embers',
    house: 'Glowing bright red-orange, the way it looked the day the bricks were born.',
    bricks: 'Beginning to sinter — clay particles are fusing together.',
    mortar: 'Gone.',
    summary:
      'This is the temperature at which clay bricks are actually manufactured. Above 900 °C the clay particles start to sinter (fuse), which is what turns soft mud into a hard, durable brick in the first place.',
    fact: 'A "brick" is really mud that has been fired past 900 °C until it partly turns to glass.',
  },
  {
    at: 1050,
    id: 'sinter',
    name: 'Vitrifying',
    effect: 'embers',
    house: 'The walls glow orange as the clay melts into glassy ceramic.',
    bricks: 'Partly vitrified — denser and harder than the day they were laid.',
    mortar: 'Long gone.',
    summary:
      'Vitrification. The clay partially melts and a glassy phase flows between the particles, fusing the brick into a single dense ceramic. Paradoxically the bricks are now harder than ever — but locked together into one rigid mass.',
    fact: 'Vitrification is the difference between porous terracotta (low-fire) and waterproof stoneware (high-fire).',
  },
  {
    at: 1200,
    id: 'vitrify',
    name: 'Full vitrification',
    effect: 'embers',
    house: 'Blazing bright orange — a single fused ceramic block.',
    bricks: 'Fully vitrified, the standard top temperature for firing red clay brick.',
    mortar: '—',
    summary:
      'Around 1200 °C, near the top of the brick-firing range. The clay is fully vitrified. The structure is essentially one giant ceramic now — solid, brittle, and glowing brilliant orange.',
    fact: 'Firebrick (refractory) is engineered to keep its shape past 1500 °C; ordinary clay brick does not.',
  },
  {
    at: 1300,
    id: 'soften',
    name: 'Bricks soften',
    effect: 'embers',
    house: 'The glassy walls can no longer hold their shape and begin to sag.',
    bricks: 'Softening — the fused ceramic is starting to flow.',
    mortar: '—',
    summary:
      "1300 °C is about where red clay brick gives up. The glassy matrix that made it strong now melts enough that gravity wins: walls bow, edges round, and the house starts to slump under its own weight.",
    fact: 'The "softening point" of a clay is the temperature where it deforms under its own load — the practical melting point.',
  },
  {
    at: 1450,
    id: 'slump',
    name: 'Slumping',
    effect: 'embers',
    house: 'Walls deform visibly; a glassy skin forms and starts to drip.',
    bricks: 'Slumping like warm wax.',
    mortar: '—',
    summary:
      'Now clearly deforming. A runny glassy skin coats the surface and begins to drip and pool. The roofline has sagged into a molten hump.',
    fact: 'Glassblowers work at this same range (~1450 °C) because that is where silica-rich material flows freely.',
  },
  {
    at: 1600,
    id: 'melt',
    name: 'Melting',
    effect: 'embers',
    house: 'The house loses all shape and flows like thick syrup.',
    bricks: 'Liquid — running down into a glowing pool.',
    mortar: '—',
    summary:
      'The bricks are molten. The entire structure has collapsed into a viscous, glowing river of ceramic slag that runs downhill and gathers at the base.',
    fact: 'Lava from a basalt volcano is cooler than this — around 1000–1200 °C. The house is now hotter than fresh lava.',
  },
  {
    at: 1710,
    id: 'slag',
    name: 'Slag',
    effect: 'embers',
    house: 'A bubbling puddle of slag where the house used to stand.',
    bricks: 'A pool of liquid glass and mineral slag.',
    mortar: '—',
    summary:
      'Around 1710 °C the silica itself finally melts. There is no "house" anymore — only a blinding yellow-white puddle of molten glass and slag, fizzing as gases escape.',
    fact: '1710 °C is the melting point of pure silica (SiO₂), the main ingredient of both brick and glass.',
  },
  {
    at: 2000,
    id: 'vapor',
    name: 'Vaporizing',
    effect: 'vapor',
    house: 'Even the slag boils away into a brilliant, blinding plume.',
    bricks: 'Boiling and vaporizing.',
    mortar: '—',
    summary:
      'Past 2000 °C the puddle is boiling. Silica boils near 2230 °C and alumina near 3000 °C, so the remaining mass is vaporizing into a searing white plume. Not much is left.',
    fact: 'This is hotter than the surface of many stars’ photospheres — the Sun’s surface is only ~5500 °C, just a few times hotter than this.',
  },
];

/**
 * Return the stage object that applies to a given temperature (°C).
 */
export function classify(celsius) {
  let current = STAGES[0];
  for (const stage of STAGES) {
    if (celsius >= stage.at) current = stage;
    else break;
  }
  return current;
}

// ---------------------------------------------------------------------------
// Notable preset temperatures surfaced as quick-click chips on the UI.
// ---------------------------------------------------------------------------
export const PRESETS = [
  { tempC: 0, label: 'Freezing', note: 'water freezes' },
  { tempC: 100, label: 'Boils', note: 'water boils' },
  { tempC: 430, label: 'Pizza oven', note: 'Neapolitan hearth' },
  { tempC: 573, label: 'Quartz', note: 'inversion' },
  { tempC: 800, label: 'Mortar fails', note: 'calcines' },
  { tempC: 1000, label: 'Kiln', note: 'firing clay' },
  { tempC: 1300, label: 'Softens', note: 'bricks deform' },
  { tempC: 1710, label: 'Melts', note: 'silica melts' },
  { tempC: 2200, label: 'Vaporizes', note: 'boils away' },
];
