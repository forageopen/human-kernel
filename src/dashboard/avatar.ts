// Generative 8-bit-style avatar (2026-08-02, direct request: "simple
// abstract profile pic like Claude have for its user (use 8 bit vector
// style)... focus on portrait outfit wearable eg cowboy hat, moustache,
// glasses, lipstick, mexico hat, baseball cap, bowtie"). Pure pixel-grid
// SVG - <rect> elements on a small grid, no external image assets, no
// canvas. Colors are drawn only from the Forage-tinted palette already in
// styles.css (never pure black/white, per FDMAI-BRAND-001's color rule -
// Charcoal Mist stands in for "black" here).
//
// Second pass (2026-08-03, direct request: "if press & hold, it cycles
// rapidly until the user stops clicking it"): wireAvatar's interaction
// grew a press-and-hold rapid-cycle on top of the original single-click
// regenerate, see its own header comment below for how the two coexist
// without double-firing on a plain click.

import { renderPixelSvg, type Pixel } from "./pixel-svg.js";
import { getJSON, setJSON } from "./storage.js";

const GRID = 12; // 12x12 pixel grid
const PX = 8; // each grid cell renders as an 8x8 SVG unit -> 96x96 viewBox

const SKIN_TONES = ["#c8a96e", "#7a8c6e", "#b0ada4", "#d5aaaa", "#aad5d4", "#aaaad5"];
const DARK = "#2a2a28"; // Charcoal Mist - the brand-safe stand-in for "black"
const LIP = "#c1286b"; // Rose Crimson

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

  return renderPixelSvg(pixels, GRID, GRID, PX, "Generated avatar");
}

const STORAGE_KEY = "hk-avatar-spec";

export function loadOrCreateAvatarSpec(): AvatarSpec {
  const stored = getJSON<AvatarSpec | null>(STORAGE_KEY, null);
  if (stored) return stored;
  const spec = randomAvatarSpec();
  saveAvatarSpec(spec);
  return spec;
}

export function saveAvatarSpec(spec: AvatarSpec): void {
  setJSON(STORAGE_KEY, spec);
}

const HOLD_DELAY_MS = 350; // press-and-hold threshold before rapid-cycling kicks in
const CYCLE_INTERVAL_MS = 100; // rapid-cycle rate once holding (2026-08-03, direct request: "if press & hold, it cycles rapidly until the user stops")

/** Wires the avatar into `wrap` (expected: .hk-avatar-wrap, with a
 * .hk-avatar-overlay sibling already in the markup per index.html - CSS
 * handles the hover-darken/"click to regenerate" text, this only handles
 * the image itself). Renders the stored/created spec immediately.
 *
 * Two interactions layer on the same `regenerate`:
 * - A plain click (or Enter/Space) regenerates once - unchanged original
 *   behavior.
 * - A press held past HOLD_DELAY_MS starts rapid-cycling every
 *   CYCLE_INTERVAL_MS until released (pointerup/leave/cancel), landing on
 *   whichever spec was showing at release. A quick tap never reaches the
 *   delay, so it falls through to the plain click path untouched - this is
 *   what keeps a normal click a single regenerate instead of double-firing
 *   (once from the hold path, once from click). `didCycle` is the flag that
 *   tells the click handler "the hold already ran, don't add one more". */
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

  let holdTimeout: ReturnType<typeof setTimeout> | null = null;
  let cycleInterval: ReturnType<typeof setInterval> | null = null;
  let didCycle = false;

  const stopHold = (): void => {
    if (holdTimeout !== null) {
      clearTimeout(holdTimeout);
      holdTimeout = null;
    }
    if (cycleInterval !== null) {
      clearInterval(cycleInterval);
      cycleInterval = null;
    }
  };

  wrap.addEventListener("pointerdown", () => {
    stopHold(); // defensive - clears any stray timers from an interrupted previous press
    didCycle = false;
    holdTimeout = setTimeout(() => {
      didCycle = true;
      regenerate();
      cycleInterval = setInterval(regenerate, CYCLE_INTERVAL_MS);
    }, HOLD_DELAY_MS);
  });
  wrap.addEventListener("pointerup", stopHold);
  wrap.addEventListener("pointerleave", stopHold);
  wrap.addEventListener("pointercancel", stopHold);

  wrap.addEventListener("click", () => {
    if (didCycle) {
      // The hold already regenerated repeatedly - the click firing on
      // release is the same physical press, not a second one, so don't
      // regenerate again on top of it.
      didCycle = false;
      return;
    }
    regenerate();
  });
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      regenerate();
    }
  });
}
