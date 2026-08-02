// Floating purple pixel mascot (2026-08-02, direct request: "avatars similar
// like a claude code. do 8-bit style... treat it like a cousin of the
// claude code avatar"). Same pixel-grid SVG technique as the profile avatar
// (avatar.ts) - a small fixed grid of <rect> cells - reused here for a
// second, independent character: a simple purple blob with two eyes, not
// tied to any profile data, free-roaming over the whole page rather than
// living in the profile header.
//
// Three behaviors, all direct requests:
// - "when you mouse hover it it, it squint its eyes" - swaps to a
//   squint-eyed render on mouseenter, back to normal on mouseleave.
// - "moveable around browser... click & hold, you can drag" - pointer-driven
//   drag, unconstrained by any card canvas since this roams the whole
//   viewport (position:fixed), unlike the widget system in draggable.ts.
// - "when you release it it fly down like a leaf" - on release, instead of
//   just stopping where the pointer let go, it plays a swaying descent down
//   to a resting spot near the bottom of the viewport, then settles there.
//   Skipped under prefers-reduced-motion - it just moves straight to the
//   resting spot with no animation.
//
// Resting position (after a fall, or the very first default) persists in
// localStorage, so a visitor's mascot is exactly where they left it on
// their next visit - it never replays the fall animation on page load,
// only on an actual release after a drag.

const GRID = 12;
const PX = 8;
const BODY = "#8b7ec8"; // soft purple - a deliberate one-off outside the
// locked Forage palette (FDMAI-BRAND-001 has no purple), per Adam's own
// explicit "purple color" instruction for this one decorative character -
// not used anywhere else, and never for text or brand-identity surfaces.
const BODY_SHADE = "#5f4f96"; // darker purple for a touch of shading/depth
const EYE_DARK = "#2a2a28"; // Charcoal Mist - same "not pure black" rule as avatar.ts

type Pixel = readonly [row: number, col: number, color: string];

function bodyPixels(): Pixel[] {
  const px: Pixel[] = [];
  // A rounded blob: a solid core with the four corners of the bounding box
  // shaved off so it reads as round rather than a hard square.
  for (let r = 2; r <= 9; r++) {
    for (let c = 2; c <= 9; c++) {
      const cornerCut =
        (r === 2 && (c === 2 || c === 3 || c === 8 || c === 9)) || (r === 9 && (c === 2 || c === 3 || c === 8 || c === 9));
      if (!cornerCut) px.push([r, c, BODY]);
    }
  }
  // A little shaded underside for depth.
  for (let c = 3; c <= 8; c++) px.push([9, c, BODY_SHADE]);
  return px;
}

function eyePixels(state: "normal" | "squint"): Pixel[] {
  if (state === "squint") {
    return [
      [5, 3, EYE_DARK],
      [5, 4, EYE_DARK],
      [5, 7, EYE_DARK],
      [5, 8, EYE_DARK],
    ];
  }
  return [
    [4, 4, EYE_DARK],
    [5, 4, EYE_DARK],
    [4, 7, EYE_DARK],
    [5, 7, EYE_DARK],
  ];
}

function smilePixels(): Pixel[] {
  return [
    [7, 5, EYE_DARK],
    [7, 6, EYE_DARK],
  ];
}

/** Pure function: eye state -> SVG markup string. No DOM required, same
 * reasoning as avatar.ts's renderAvatarSvg - fully unit-testable, and later
 * layers win on pixel overlap via the Map keyed by "row,col". */
export function renderMascotSvg(eyeState: "normal" | "squint" = "normal"): string {
  const pixels: Pixel[] = [...bodyPixels(), ...eyePixels(eyeState), ...smilePixels()];

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

  return `<svg viewBox="0 0 ${GRID * PX} ${GRID * PX}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A small purple mascot">${rects}</svg>`;
}

const POSITION_KEY = "hk-mascot-position";

interface MascotPosition {
  left: number;
  top: number;
}

export function loadMascotPosition(): MascotPosition | null {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MascotPosition;
  } catch {
    return null;
  }
}

export function saveMascotPosition(pos: MascotPosition): void {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(pos));
  } catch {
    // no persistence available this session - the mascot still works, it
    // just resets to the default corner on the next reload.
  }
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Wires the mascot into `el` (expected: a `position:fixed` .hk-mascot
 * element already in the DOM - index.html). Renders the normal-eyed sprite,
 * restores any saved resting position, and wires hover/drag/release. */
export function wireMascot(el: HTMLElement): void {
  const render = (state: "normal" | "squint"): void => {
    el.querySelector("svg")?.remove();
    el.insertAdjacentHTML("afterbegin", renderMascotSvg(state));
  };
  render("normal");

  const saved = loadMascotPosition();
  if (saved) {
    el.style.left = `${saved.left}px`;
    el.style.top = `${saved.top}px`;
    el.style.bottom = "auto";
  }

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  el.addEventListener("mouseenter", () => {
    if (!dragging) render("squint");
  });
  el.addEventListener("mouseleave", () => {
    if (!dragging) render("normal");
  });

  el.addEventListener("pointerdown", (e) => {
    dragging = true;
    el.classList.remove("hk-mascot-falling");
    el.classList.add("hk-mascot-dragging");
    const rect = el.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    startLeft = rect.left;
    startTop = rect.top;
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
    el.classList.remove("hk-mascot-dragging");
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      // capture was never actually granted (e.g. synthetic event in tests)
    }
    render("normal");
    fallToRest(el);
  };
  el.addEventListener("pointerup", endDrag);
  el.addEventListener("pointercancel", endDrag);
}

/** "Fly down like a leaf" - a swaying descent from wherever it was released
 * down to a resting spot near the bottom of the viewport, then persists
 * that resting spot. Skips the animation under prefers-reduced-motion and
 * just moves straight there. */
function fallToRest(el: HTMLElement): void {
  const rect = el.getBoundingClientRect();
  const restingTop = Math.max(0, window.innerHeight - rect.height - 24);
  const fallDistance = restingTop - rect.top;

  const settle = (): void => {
    el.style.left = `${rect.left}px`;
    el.style.top = `${restingTop}px`;
    saveMascotPosition({ left: rect.left, top: restingTop });
  };

  if (fallDistance <= 0 || prefersReducedMotion()) {
    settle();
    return;
  }

  el.style.setProperty("--hk-mascot-fall-distance", `${fallDistance}px`);
  el.classList.add("hk-mascot-falling");

  const onEnd = (): void => {
    el.classList.remove("hk-mascot-falling");
    el.style.transform = "";
    settle();
    el.removeEventListener("animationend", onEnd);
  };
  el.addEventListener("animationend", onEnd);
}
