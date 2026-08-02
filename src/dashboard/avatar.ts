// Generative 8-bit-style avatar (2026-08-02, direct request: "simple
// abstract profile pic like Claude have for its user (use 8 bit vector
// style)... focus on portrait outfit wearable eg cowboy hat, moustache,
// glasses, lipstick, mexico hat, baseball cap, bowtie"). Pure pixel-grid
// SVG - <rect> elements on a small grid, no external image assets, no
// canvas. Colors are drawn only from the Forage-tinted palette already in
// styles.css (never pure black/white, per FDMAI-BRAND-001's color rule -
// Charcoal Mist stands in for "black" here).

const GRID = 12; // 12x12 pixel grid
const PX = 8; // each grid cell renders as an 8x8 SVG unit -> 96x96 viewBox

const SKIN_TONES = ["#c8a96e", "#7a8c6e", "#b0ada4", "#d5aaaa", "#aad5d4", "#aaaad5"];
const DARK = "#2a2a28"; // Charcoal Mist - the brand-safe stand-in for "black"
const LIP = "#c1286b"; // Rose Crimson

type Pixel = readonly [row: number, col: number, color: string];

function basePixels(skin: string): Pixel[] {
  const px: Pixel[] = [];
  for (let r = 2; r <= 9; r++) {
    for (let c = 2; c <= 9; c++) px.push([r, c, skin]);
  }
  px.push([5, 4, DARK], [5, 7, DARK]); // eyes
  px.push([8, 5, DARK], [8, 6, DARK]); // neutral mouth
  return px;
}

function hatPixels(kind: "cowboy" | "cap" | "sombrero"): Pixel[] {
  if (kind === "cap") {
    const px: Pixel[] = [];
    for (let c = 3; c <= 8; c++) px.push([1, c, DARK]);
    px.push([2, 9, DARK], [2, 10, DARK]);
    return px;
  }
  if (kind === "cowboy") {
    const px: Pixel[] = [];
    for (let c = 1; c <= 10; c++) px.push([1, c, DARK]);
    for (let c = 4; c <= 7; c++) px.push([0, c, DARK]);
    return px;
  }
  // sombrero - wider brim than cowboy, same crown
  const px: Pixel[] = [];
  for (let c = 0; c <= 11; c++) px.push([1, c, DARK]);
  for (let c = 3; c <= 8; c++) px.push([0, c, DARK]);
  return px;
}

function moustachePixels(): Pixel[] {
  return [
    [7, 4, DARK], [7, 5, DARK], [7, 6, DARK], [7, 7, DARK],
  ];
}

function glassesPixels(): Pixel[] {
  return [
    [4, 3, DARK], [4, 4, DARK], [4, 5, DARK], [4, 6, DARK], [4, 7, DARK], [4, 8, DARK],
    [5, 3, DARK], [5, 5, DARK], [5, 6, DARK], [5, 8, DARK],
  ];
}

function lipstickPixels(): Pixel[] {
  return [[8, 5, LIP], [8, 6, LIP]];
}

function bowtiePixels(): Pixel[] {
  return [[10, 5, DARK], [10, 6, DARK], [11, 4, DARK], [11, 7, DARK]];
}

export interface AvatarSpec {
  skin: string;
  hat: "none" | "cowboy" | "cap" | "sombrero";
  moustache: boolean;
  glasses: boolean;
  lipstick: boolean;
  bowtie: boolean;
}

// "none" appears twice so a hat isn't guaranteed on every regenerate.
const HATS: AvatarSpec["hat"][] = ["none", "none", "cowboy", "cap", "sombrero"];

export function randomAvatarSpec(): AvatarSpec {
  return {
    skin: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)]!,
    hat: HATS[Math.floor(Math.random() * HATS.length)]!,
    moustache: Math.random() < 0.4,
    glasses: Math.random() < 0.4,
    lipstick: Math.random() < 0.3,
    bowtie: Math.random() < 0.3,
  };
}

/** Pure function: spec -> SVG markup string. No DOM required, so it's fully
 * unit-testable. Later layers win on pixel overlap (a Map keyed by
 * "row,col" naturally dedupes to the last write). */
export function renderAvatarSvg(spec: AvatarSpec): string {
  let pixels: Pixel[] = basePixels(spec.skin);
  if (spec.hat !== "none") pixels = pixels.concat(hatPixels(spec.hat));
  if (spec.glasses) pixels = pixels.concat(glassesPixels());
  if (spec.moustache) pixels = pixels.concat(moustachePixels());
  if (spec.lipstick) pixels = pixels.concat(lipstickPixels());
  if (spec.bowtie) pixels = pixels.concat(bowtiePixels());

  const merged = new Map<string, string>();
  for (const [r, c, color] of pixels) {
    if (r < 0 || r >= GRID || c < 0 || c >= GRID) continue;
    merged.set(`${r},${c}`, color);
  }

  const rects = Array.from(merged.entries())
    .map(([key, color]) => {
      const parts = key.split(",");
      const r = Number(parts[0]);
      const c = Number(parts[1]);
      return `<rect x="${c * PX}" y="${r * PX}" width="${PX}" height="${PX}" fill="${color}"/>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${GRID * PX} ${GRID * PX}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Generated avatar">${rects}</svg>`;
}

const STORAGE_KEY = "hk-avatar-spec";

export function loadOrCreateAvatarSpec(): AvatarSpec {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AvatarSpec;
  } catch {
    // fall through to creating + saving a fresh one
  }
  const spec = randomAvatarSpec();
  saveAvatarSpec(spec);
  return spec;
}

export function saveAvatarSpec(spec: AvatarSpec): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(spec));
  } catch {
    // no persistence available - avatar still renders for this session
  }
}

/** Wires the avatar into `wrap` (expected: .hk-avatar-wrap, with a
 * .hk-avatar-overlay sibling already in the markup per index.html - CSS
 * handles the hover-darken/"click to regenerate" text, this only handles
 * the image itself). Renders the stored/created spec immediately;
 * regenerates and persists a new one on click. */
export function wireAvatar(wrap: HTMLElement): void {
  const render = (spec: AvatarSpec): void => {
    wrap.querySelector("svg")?.remove();
    wrap.insertAdjacentHTML("afterbegin", renderAvatarSvg(spec));
  };
  const regenerate = (): void => {
    const spec = randomAvatarSpec();
    saveAvatarSpec(spec);
    render(spec);
  };
  render(loadOrCreateAvatarSpec());
  wrap.addEventListener("click", regenerate);
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      regenerate();
    }
  });
}
