// Second roaming avatar: a dog that walks across the screen (2026-08-02,
// direct request: "add a new avatar, a dog moving across screen with
// jumping action"). Unlike the purple mascot (mascot.ts), which is
// user-dragged and only moves when picked up, the dog is fully autonomous -
// no pointer events at all, just two independent, always-running CSS
// keyframe animations on two nested elements:
//
//   .hk-dog (outer, set on `el` passed in)  - crosses the full viewport
//     width, right then left, flipping horizontally at each end so it
//     visibly faces its direction of travel.
//   .hk-dog-hop (inner, wraps the sprite)   - a fast, continuous vertical
//     bounce layered on top, independent of the slow horizontal crossing -
//     the "jumping action."
//
// Two separate elements because a single element's `transform` can't cleanly
// combine two independently-timed animations (a 14s horizontal crossing and
// a 0.5s hop) without one overwriting the other - same reasoning as the
// mascot's separate drag/fall handling, just split across the DOM instead of
// across time. Same pixel-grid SVG technique as avatar.ts/mascot.ts.
//
// Not draggable, not clickable - "moving across screen" describes autonomous
// motion, not something a visitor picks up. Visibility (the "avatar toggle
// on off" request) is handled generically by main.ts via draggable.ts's
// loadVisible/saveVisible and the shared .hk-widget-hidden class, exactly
// like the mascot - this file has no visibility logic of its own.

const GRID_W = 16;
const GRID_H = 10;
const PX = 4;

const BODY = "#a8703f"; // warm brown - a dog-like tone, same "not pure
// black/white" rule as every other pixel character in this app
const BODY_SHADE = "#7d5230"; // darker brown, underside shading
const DARK = "#5c3b1e"; // ear/tail tip
const EYE = "#2a2a28"; // Charcoal Mist, same dark used by avatar.ts/mascot.ts

type Pixel = readonly [row: number, col: number, color: string];

function bodyPixels(): Pixel[] {
  const px: Pixel[] = [];
  for (let r = 4; r <= 6; r++) {
    for (let c = 2; c <= 11; c++) px.push([r, c, BODY]);
  }
  for (let c = 2; c <= 11; c++) px.push([6, c, BODY_SHADE]);
  for (let r = 2; r <= 5; r++) {
    for (let c = 11; c <= 14; c++) px.push([r, c, BODY]);
  }
  px.push([4, 15, BODY]);
  px.push([5, 15, BODY]);
  px.push([1, 13, DARK]);
  px.push([2, 13, DARK]);
  px.push([2, 0, DARK]);
  px.push([3, 0, BODY]);
  px.push([3, 1, BODY]);
  px.push([7, 3, BODY]);
  px.push([8, 3, BODY]);
  px.push([7, 5, BODY]);
  px.push([8, 5, BODY]);
  px.push([7, 9, BODY]);
  px.push([8, 9, BODY]);
  px.push([7, 11, BODY]);
  px.push([8, 11, BODY]);
  return px;
}

function eyePixels(): Pixel[] {
  return [[3, 13, EYE]];
}

/** Pure function: no DOM required, fully unit-testable, same reasoning as
 * avatar.ts's renderAvatarSvg / mascot.ts's renderMascotSvg. */
export function renderDogSvg(): string {
  const pixels: Pixel[] = [...bodyPixels(), ...eyePixels()];

  const merged = new Map<string, string>();
  for (const [r, c, color] of pixels) {
    if (r < 0 || r >= GRID_H || c < 0 || c >= GRID_W) continue;
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

  return `<svg viewBox="0 0 ${GRID_W * PX} ${GRID_H * PX}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A small dog">${rects}</svg>`;
}

/** Wires the dog into `el` (expected: a `position:fixed` .hk-dog element
 * already in the DOM - index.html - carrying the horizontal-crossing
 * animation via CSS). Renders the sprite inside a `.hk-dog-hop` wrapper that
 * carries the independent vertical bounce. Idempotent - safe to call more
 * than once, clears any previous content first. */
export function wireDogAvatar(el: HTMLElement): void {
  el.innerHTML = "";
  const hop = document.createElement("div");
  hop.className = "hk-dog-hop";
  hop.innerHTML = renderDogSvg();
  el.appendChild(hop);
}
