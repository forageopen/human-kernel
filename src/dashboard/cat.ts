// Fourth roaming character: a cat that chases the dog (dog-avatar.ts) around
// the page. Unlike the dog - which is pure CSS keyframes on its outer
// .hk-dog element and never touched by JS after wireDogAvatar runs - the cat
// has to actually track wherever the dog currently is, and the dog's real
// on-screen position at any instant is the *result* of its CSS animation
// (translateX + a flip), not something stored anywhere. getBoundingClientRect
// on the dog's element already accounts for that applied transform, so
// that's the one read this file needs each tick; it never inspects the dog's
// animation/keyframes directly.
//
// Position is JS-driven (a repeating setInterval tick, same "tick + returned
// stop function" shape as clock.ts's startLiveClock) rather than a second CSS
// keyframe animation, since the target (the dog) moves independently and
// there's no way to author a CSS animation against another element's live
// transform. Draggable - the drag handlers and the chase tick share the same
// `pos` variable, so picking the cat up just pauses the tick, and dropping
// it resumes the chase from wherever it landed.

import { renderPixelSvg, type Pixel } from "./pixel-svg.js";
import { prefersReducedMotion } from "./dom-utils.js";

const GRID_W = 14;
const GRID_H = 9;
const PX = 4;

const BODY = "#9a978c"; // grey - a cat-like tone, same "not pure black/white" rule as every other character
const BODY_SHADE = "#726f66"; // darker grey, underside shading
const DARK = "#4f4d47"; // ear tip / tail tip
const EYE = "#2a2a28"; // Charcoal Mist, same dark used by every other character

function bodyPixels(): Pixel[] {
  const px: Pixel[] = [];
  for (let r = 3; r <= 5; r++) {
    for (let c = 2; c <= 9; c++) px.push([r, c, BODY]);
  }
  for (let c = 2; c <= 9; c++) px.push([5, c, BODY_SHADE]);
  // head, forward of the body
  for (let r = 1; r <= 3; r++) {
    for (let c = 9; c <= 12; c++) px.push([r, c, BODY]);
  }
  // pointy ears
  px.push([0, 9, DARK]);
  px.push([0, 12, DARK]);
  // legs
  px.push([6, 3, BODY]); px.push([7, 3, BODY]);
  px.push([6, 5, BODY]); px.push([7, 5, BODY]);
  px.push([6, 7, BODY]); px.push([7, 7, BODY]);
  px.push([6, 9, BODY]); px.push([7, 9, BODY]);
  // tail, curling up at the back
  px.push([2, 1, BODY]);
  px.push([1, 0, BODY]);
  px.push([0, 0, DARK]);
  return px;
}

function eyePixels(): Pixel[] {
  return [[2, 11, EYE]];
}

/** Pure function: no DOM required, fully unit-testable, same reasoning as
 * dog-avatar.ts's renderDogSvg. Deterministic - no randomness. */
export function renderCatSvg(): string {
  const pixels: Pixel[] = [...bodyPixels(), ...eyePixels()];

  return renderPixelSvg(pixels, GRID_W, GRID_H, PX, "A small cat chasing the dog");
}

export interface Point {
  left: number;
  top: number;
}

// How far behind the dog the cat holds back - "chases" without ever
// actually catching/overlapping it.
const FOLLOW_DISTANCE_PX = 90;
// Per-tick movement cap under normal motion - eases toward the target rather
// than teleporting, so the chase actually reads as motion.
const STEP_PX = 6;

/** Pure function: given the cat's current position, the dog's current
 * bounding rect (as read from getBoundingClientRect - only left/top matter
 * here), and whether motion should be simplified, returns the cat's next
 * position for one tick. No DOM required, fully unit-testable independent of
 * the setInterval loop wireCat drives it with.
 *
 * Holds at FOLLOW_DISTANCE_PX behind the dog rather than closing the last bit
 * of the gap - that's what keeps the cat from ever catching/overlapping it.
 * Under reduced motion, still follows, but snaps straight to the trailing
 * spot each tick instead of easing toward it step by step - "simplify," not
 * "freeze in place." */
export function nextCatPosition(cat: Point, dogRect: Point, reducedMotion: boolean): Point {
  const dx = dogRect.left - cat.left;
  const dy = dogRect.top - cat.top;
  const dist = Math.hypot(dx, dy);

  if (dist <= FOLLOW_DISTANCE_PX) return cat;

  const targetDist = dist - FOLLOW_DISTANCE_PX;
  const step = reducedMotion ? targetDist : Math.min(STEP_PX, targetDist);
  const ratio = step / dist;

  return { left: cat.left + dx * ratio, top: cat.top + dy * ratio };
}

const TICK_MS = 50;

/** Wires the cat into `el` (expected: a `position:fixed` .hk-cat element
 * already in the DOM - index.html) so it continuously chases `dogEl` (the
 * dog's own `.hk-dog` element - dog-avatar.ts). Renders the sprite, clears
 * any CSS-authored `bottom`/`right` so the JS-driven `left`/`top` fully
 * control position from the first tick (same "bottom = auto" move mascot.ts
 * makes before it starts driving position itself), then starts the chase
 * loop. Returns a stop function that clears the interval - mirrors
 * clock.ts's startLiveClock shape. */
export function wireCat(el: HTMLElement, dogEl: HTMLElement, intervalMs: number = TICK_MS): () => void {
  el.innerHTML = "";
  // Bounce lives on its own wrapper, same reasoning as the dog's
  // .hk-dog-hop (dog-avatar.ts): `el` already carries a CSS *transition* for
  // its JS-driven left/top/transform (position + facing flip) - layering a
  // separate infinite bounce keyframe animation onto that same element's
  // transform would fight the flip's scaleX. A nested element keeps the two
  // fully independent.
  const hop = document.createElement("div");
  hop.className = "hk-cat-hop";
  hop.innerHTML = renderCatSvg();
  el.appendChild(hop);

  el.style.bottom = "auto";
  el.style.right = "auto";

  const startRect = el.getBoundingClientRect();
  let pos: Point = { left: startRect.left, top: startRect.top };
  el.style.left = `${pos.left}px`;
  el.style.top = `${pos.top}px`;

  // Facing direction, same convention as the dog's own flip (dog-avatar.ts /
  // hk-dog-cross): scaleX(1) faces right, scaleX(-1) faces left. Starts
  // facing whichever way the dog already is. Re-evaluated every tick from
  // the dog's *current* side, so the cat visibly turns around exactly when
  // it can no longer keep following in its current direction - i.e. whenever
  // the dog has gotten behind it instead of ahead.
  let facingLeft = dogEl.getBoundingClientRect().left < pos.left;
  el.style.transform = facingLeft ? "scaleX(-1)" : "scaleX(1)";

  // Draggable: picking the cat up pauses the chase tick below (it reads/
  // writes the same `pos` the drag handlers do), so releasing resumes the
  // chase from wherever it was dropped - no separate "resume" step needed.
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  el.addEventListener("pointerdown", (e) => {
    dragging = true;
    el.classList.add("hk-cat-dragging");
    startX = e.clientX;
    startY = e.clientY;
    startLeft = pos.left;
    startTop = pos.top;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    pos = { left: startLeft + (e.clientX - startX), top: startTop + (e.clientY - startY) };
    el.style.left = `${pos.left}px`;
    el.style.top = `${pos.top}px`;
  });

  const endDrag = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("hk-cat-dragging");
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      // capture was never actually granted (e.g. synthetic event in tests)
    }
  };
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);

  const tick = (): void => {
    if (dragging) return;
    const dogRect = dogEl.getBoundingClientRect();
    if (dogRect.left !== pos.left) {
      const nowFacingLeft = dogRect.left < pos.left;
      if (nowFacingLeft !== facingLeft) {
        facingLeft = nowFacingLeft;
        el.style.transform = facingLeft ? "scaleX(-1)" : "scaleX(1)";
      }
    }
    pos = nextCatPosition(pos, { left: dogRect.left, top: dogRect.top }, prefersReducedMotion());
    el.style.left = `${pos.left}px`;
    el.style.top = `${pos.top}px`;
  };
  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}
