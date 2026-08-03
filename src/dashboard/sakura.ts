// Third ambient background layer: falling sakura (cherry blossom) petals
// (2026-08-02, direct request: "new background animation sakura flower with
// its own animation"). Same non-negotiables as the other two ambient layers
// (particles.ts, starchase.ts): pure CSS keyframe motion (transform +
// opacity only, GPU-composited), no canvas, no per-frame JS, no animation
// library - this function only creates elements and hands each one a
// randomized path via CSS custom properties.
//
// Its "own animation" (distinct from the slow ambient dots and the fast
// diagonal star-chase streaks): petals fall top-to-bottom, swaying
// side-to-side and slowly rotating as they go, like a real petal drifting
// down rather than travelling in a straight line - a 3-keyframe wobble
// (left, right, left again) layered under a steady downward drift and a
// full rotation.
//
// Shares --hk-speed with the other two ambient layers (same calc()-on-a-
// bare-number pattern), so the one scene-taskbar slider speeds up or slows
// down all three background layers together.

const DEFAULT_COUNT = 14;

interface PetalSpec {
  leftVw: number;
  swayVw: number; // how far it sways side to side while falling
  sizePx: number;
  rotateDeg: number; // total rotation over one fall
  fallDurationBase: number; // seconds, unitless - see particles.ts on why
  delaySeconds: number;
  hueShift: number; // small per-petal hue variance so the field isn't one flat pink
}

function randomPetal(): PetalSpec {
  return {
    leftVw: Math.random() * 100,
    swayVw: 4 + Math.random() * 8,
    sizePx: 7 + Math.random() * 6, // small - "not heavy," matches the other two layers
    rotateDeg: 180 + Math.random() * 360,
    fallDurationBase: 9 + Math.random() * 8, // slow, graceful drift - slower than particles' 4-10s
    delaySeconds: -(Math.random() * 16),
    hueShift: -8 + Math.random() * 16,
  };
}

function applySpec(el: HTMLElement, spec: PetalSpec): void {
  el.style.setProperty("--hk-sk-left", `${spec.leftVw}vw`);
  el.style.setProperty("--hk-sk-sway", `${spec.swayVw}vw`);
  el.style.setProperty("--hk-sk-size", `${spec.sizePx}px`);
  el.style.setProperty("--hk-sk-rotate", `${spec.rotateDeg}deg`);
  el.style.setProperty("--hk-sk-fall-base", `${spec.fallDurationBase}`);
  el.style.setProperty("--hk-sk-delay", `${spec.delaySeconds}s`);
  el.style.setProperty("--hk-sk-hue", `${spec.hueShift}deg`);
}

/** Fills `container` with `count` falling-petal elements (default 14 - kept
 * modest, same "not heavy" reasoning as particles.ts/starchase.ts, especially
 * now that up to three ambient layers can run at once). Idempotent - clears
 * and re-randomizes rather than piling up on repeated calls. */
export function initSakura(container: HTMLElement, count: number = DEFAULT_COUNT): void {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "hk-sakura-petal";
    applySpec(el, randomPetal());
    container.appendChild(el);
  }
}
