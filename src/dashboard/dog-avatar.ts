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
// Draggable: picking the dog up (pointerdown) captures its current on-screen
// spot, adds .hk-dog-dragging (which kills the crossing animation via CSS -
// see styles.css), and switches to plain left/top for the drag, same
// approach as the mascot's manual drag. There's no single meaningful
// "resume from here" point on a full-width crossing loop, though, so on
// release only the vertical spot (the "lane" it crosses at) carries over -
// horizontal position resets to the animation's own path, restarting the
// crossing fresh at the new lane. The lane persists (storage.ts) like every
// other draggable's position. Visibility (the "avatar toggle on off"
// request) is handled generically by main.ts via draggable.ts's
// loadVisible/saveVisible and the shared .hk-widget-hidden class, exactly
// like the mascot - this file has no visibility logic of its own.

import { renderPixelSvg, type Pixel } from "./pixel-svg.js";
import { getJSON, setJSON } from "./storage.js";

const GRID_W = 16;
const GRID_H = 10;
const PX = 4;

const BODY = "#a8703f"; // warm brown - a dog-like tone, same "not pure
// black/white" rule as every other pixel character in this app
const BODY_SHADE = "#7d5230"; // darker brown, underside shading
const DARK = "#5c3b1e"; // ear/tail tip
const EYE = "#2a2a28"; // Charcoal Mist, same dark used by avatar.ts/mascot.ts

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

  return renderPixelSvg(pixels, GRID_W, GRID_H, PX, "A small dog");
}

const LANE_KEY = "hk-dog-lane-top";

/** Wires the dog into `el` (expected: a `position:fixed` .hk-dog element
 * already in the DOM - index.html - carrying the horizontal-crossing
 * animation via CSS). Renders the sprite inside a `.hk-dog-hop` wrapper that
 * carries the independent vertical bounce, restores any saved lane, and
 * wires up drag-to-relocate-lane. Idempotent - safe to call more than once,
 * clears any previous content first. */
export function wireDogAvatar(el: HTMLElement): void {
  el.innerHTML = "";
  const hop = document.createElement("div");
  hop.className = "hk-dog-hop";
  hop.innerHTML = renderDogSvg();
  el.appendChild(hop);

  const savedLane = getJSON<number | null>(LANE_KEY, null);
  if (savedLane !== null) {
    el.style.top = `${savedLane}px`;
    el.style.bottom = "auto";
  }

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  el.addEventListener("pointerdown", (e) => {
    const rect = el.getBoundingClientRect();
    dragging = true;
    el.classList.add("hk-dog-dragging");
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
    el.style.left = `${rect.left}px`;
    el.style.top = `${rect.top}px`;
    el.style.bottom = "auto";
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = `${startLeft + dx}px`;
    el.style.top = `${startTop + dy}px`;
  });

  const endDrag = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("hk-dog-dragging");
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      // capture was never actually granted (e.g. synthetic event in tests)
    }
    // Only the lane (vertical spot) carries over - horizontal position
    // resets to 0 so the crossing animation resumes its own path, rather
    // than jumping from wherever it was dropped.
    const lane = parseFloat(el.style.top);
    el.style.left = "0px";
    setJSON(LANE_KEY, lane);
  };
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);
}
