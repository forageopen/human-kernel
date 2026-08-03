// Fourth ambient background layer: periodic firework bursts (2026-08-02,
// direct request: "fireworks background animation, with how many colors
// slider (1-24 variations)"). Unlike the other three ambient layers
// (particles.ts, starchase.ts, sakura.ts), which create their elements once
// and let an infinite CSS keyframe loop run forever, a firework burst is a
// one-shot event - it has to actually appear and disappear over time - so
// this file is genuinely timer-driven: spawnBurst() builds one burst's DOM,
// styles.css's keyframe animates it once, and a matching setTimeout removes
// it when that animation would have finished. Each spark's outward travel
// uses the same "rotate once to its angle, then translateX along that
// rotated axis" trick as starchase.ts - no CSS trig functions needed.
//
// The color-count slider is genuinely a JS-level concern, not a CSS
// variable like --hk-speed - "use only N of the 24 possible hues" is a
// discrete choice about which colors get randomly picked for the NEXT
// burst, which CSS alone can't express. paletteForCount() generates N
// evenly-spaced hues around the color wheel (so 1 is monochrome, 24 is the
// full spread, and everything in between stays visually coherent) rather
// than a hand-picked list of 24 specific colors.

export const MIN_COLORS = 1;
export const MAX_COLORS = 24;

const SPARKS_PER_BURST = 14;
const BURST_DURATION_MS = 1200;
const MIN_INTERVAL_MS = 2500;
const MAX_INTERVAL_MS = 5000;
const FIRST_BURST_DELAY_MS = 500;

export function clampColorCount(n: number): number {
  if (!Number.isFinite(n)) return MIN_COLORS;
  return Math.max(MIN_COLORS, Math.min(MAX_COLORS, Math.round(n)));
}

/** N evenly-spaced hues around the color wheel, as ready-to-use `hsl()`
 * strings. Pure and deterministic - same saturation/lightness every time,
 * only the hue spacing changes with `count`. */
export function paletteForCount(count: number): string[] {
  const n = clampColorCount(count);
  const colors: string[] = [];
  for (let i = 0; i < n; i++) {
    const hue = Math.round((360 / n) * i);
    colors.push(`hsl(${hue}, 78%, 62%)`);
  }
  return colors;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function pickColor(colorCount: number): string {
  const palette = paletteForCount(colorCount);
  return palette[Math.floor(Math.random() * palette.length)]!;
}

/** Builds one burst - a positioned wrapper plus SPARKS_PER_BURST radiating
 * spark elements, all sharing one randomly-picked color from the current
 * palette - appends it to `container`, and removes it again once its
 * animation would have finished. */
export function spawnBurst(container: HTMLElement, colorCount: number): HTMLElement {
  const color = pickColor(colorCount);
  const burst = document.createElement("div");
  burst.className = "hk-firework-burst";
  burst.style.setProperty("--hk-fw-left", `${5 + Math.random() * 90}vw`);
  burst.style.setProperty("--hk-fw-top", `${5 + Math.random() * 55}vh`); // upper/mid screen, like a real firework

  for (let i = 0; i < SPARKS_PER_BURST; i++) {
    const spark = document.createElement("span");
    spark.className = "hk-firework-spark";
    const angle = (360 / SPARKS_PER_BURST) * i + (Math.random() * 10 - 5);
    const distance = 40 + Math.random() * 45;
    spark.style.setProperty("--hk-fw-angle", `${angle}deg`);
    spark.style.setProperty("--hk-fw-distance", `${distance}px`);
    spark.style.setProperty("--hk-fw-color", color);
    burst.appendChild(spark);
  }

  container.appendChild(burst);
  setTimeout(() => burst.remove(), BURST_DURATION_MS);
  return burst;
}

export interface FireworksController {
  /** Changes how many hues future bursts are allowed to pick from - does
   * not affect a burst already in flight. */
  setColorCount: (count: number) => void;
  /** Stops scheduling further bursts (for teardown/tests). */
  stop: () => void;
}

/** Starts the firework loop in `container`. Skips entirely under
 * prefers-reduced-motion (checked before every scheduled burst, not just
 * once at start) rather than firing a single static burst - a flashing,
 * radiating animation is exactly the kind of motion that setting exists to
 * suppress. */
export function initFireworks(container: HTMLElement, initialColorCount: number): FireworksController {
  container.innerHTML = "";
  let colorCount = clampColorCount(initialColorCount);
  let stopped = false;
  let timerId: ReturnType<typeof setTimeout> | null = null;

  const scheduleNext = (delayMs: number): void => {
    if (stopped) return;
    timerId = setTimeout(() => {
      if (stopped) return;
      if (!prefersReducedMotion()) spawnBurst(container, colorCount);
      scheduleNext(MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS));
    }, delayMs);
  };

  if (!prefersReducedMotion()) scheduleNext(FIRST_BURST_DELAY_MS);

  return {
    setColorCount(n: number): void {
      colorCount = clampColorCount(n);
    },
    stop(): void {
      stopped = true;
      if (timerId !== null) clearTimeout(timerId);
    },
  };
}
