// Third roaming character: a small Minecraft-creeper-style pixel head, free-
// roaming over the whole page like the purple mascot (mascot.ts) and dog
// (dog-avatar.ts). Deliberately closer to the profile avatar's (avatar.ts)
// level of complexity than the mascot's - draggable, but no hover-squint and
// no fall-like-a-leaf release animation. Same pixel-grid SVG technique as
// every other character (pixel-svg.ts).
//
// Dragging reuses draggable.ts's makeDraggable rather than mascot.ts's own
// hand-rolled fixed-position drag - `el` is both the dragged element and its
// own handle, and `document.body` stands in for the "canvas" makeDraggable
// normally constrains a widget card to, since this roams the full viewport
// the same as the mascot. That also gives it a persistence key
// ("hk-widget-rect-creeper-head", via draggable.ts's own storage.ts-backed
// key scheme) that's namespaced independently of the mascot's
// "hk-mascot-position" and the avatar's "hk-avatar-spec".

import { renderPixelSvg, type Pixel } from "./pixel-svg.js";
import { makeDraggable } from "./draggable.js";

const GRID = 8;
const PX = 10;

const GREEN = "#5b8f4f"; // creeper-green, a brand-neutral one-off decorative color
const GREEN_SHADE = "#3f6a37"; // darker green, underside shading
const DARK = "#2a2a28"; // Charcoal Mist - the brand-safe stand-in for "black", same as every other character

function facePixels(): Pixel[] {
  const px: Pixel[] = [];
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) px.push([r, c, GREEN]);
  }
  for (let c = 0; c < GRID; c++) px.push([GRID - 1, c, GREEN_SHADE]);
  return px;
}

function eyePixels(): Pixel[] {
  return [
    [1, 1, DARK], [1, 2, DARK], [2, 1, DARK], [2, 2, DARK],
    [1, 5, DARK], [1, 6, DARK], [2, 5, DARK], [2, 6, DARK],
  ];
}

// The iconic creeper frown - a nose bridge narrowing into a wide open mouth
// that pinches back in toward the chin, all original pixel placement.
function mouthPixels(): Pixel[] {
  return [
    [3, 3, DARK], [3, 4, DARK],
    [4, 2, DARK], [4, 5, DARK],
    [5, 2, DARK], [5, 3, DARK], [5, 4, DARK], [5, 5, DARK],
    [6, 3, DARK], [6, 4, DARK],
  ];
}

/** Pure function: no DOM required, fully unit-testable, same reasoning as
 * avatar.ts's renderAvatarSvg / mascot.ts's renderMascotSvg / dog-avatar.ts's
 * renderDogSvg. Deterministic - no randomness, just one fixed face. */
export function renderCreeperSvg(): string {
  const pixels: Pixel[] = [...facePixels(), ...eyePixels(), ...mouthPixels()];

  return renderPixelSvg(pixels, GRID, GRID, PX, "A small creeper-head character - drag it around");
}

const WIDGET_ID = "creeper-head";

/** Wires the creeper into `el` (expected: a `position:fixed` .hk-creeper
 * element already in the DOM - index.html). Renders the sprite and hands
 * dragging entirely to makeDraggable (draggable.ts) - no squint/fall
 * behavior, unlike the mascot. Idempotent - safe to call more than once,
 * clears any previous content first. */
export function wireCreeper(el: HTMLElement): void {
  el.innerHTML = "";
  el.insertAdjacentHTML("afterbegin", renderCreeperSvg());
  makeDraggable(el, el, document.body, WIDGET_ID);
}
