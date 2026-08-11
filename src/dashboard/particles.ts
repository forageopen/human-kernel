// Ambient background motion (2026-08-02, direct request: the dashboard
// "not visually appealing... need some background live animation that's not
// heavy - like moving atoms around the screens, like asteroids (very small)
// & glowing slowly but moving fast (smooth)").
//
// Pure CSS keyframe animation per particle - transform + opacity only, both
// GPU-composited - no canvas, no per-frame JS loop, no animation library.
// This function's only job is to create N small elements and hand each one
// a randomized drift vector/size/timing via CSS custom properties; the
// actual motion is entirely done by the two @keyframes in styles.css
// (hk-particle-drift, hk-particle-glow). Same split as clock.ts (pure
// formatter + thin setInterval wrapper) and charts.ts (pure heatmap logic +
// thin draw wiring): the randomness here is pure and jsdom-testable, the
// motion itself is not (CSS animations don't run in jsdom, nor do they need
// to be unit-tested - only that the right elements/properties exist).
//
// Speed control (2026-08-02, direct request: a scene-taskbar slider for
// "the one that moves randomly"): each particle's drift/glow durations are
// now stored as bare numbers (--hk-p-drift-base / --hk-p-glow-base, no unit)
// rather than full "Ns" durations. styles.css's animation-duration divides
// that base by a single shared --hk-speed custom property
// (`calc(var(--hk-p-drift-base) * 1s / var(--hk-speed))`), so scene-panel.ts's
// slider can speed up or slow down every particle at once just by writing
// one variable on <html> - this file never needs to know speed exists at all.

import { initAmbientField } from "./ambient-field.js";

const DEFAULT_COUNT = 22;

interface ParticleSpec {
  leftVw: number; // start position, vw
  topVh: number; // start position, vh
  dxVw: number; // drift distance, signed, vw
  dyVh: number; // drift distance, signed, vh
  sizePx: number; // core dot diameter - "very small"
  driftSeconds: number; // position traversal - the "moving fast" half
  glowSeconds: number; // opacity pulse - the "glowing slowly" half, a
  // deliberately different cadence from driftSeconds so the two rhythms
  // never lock into the same beat.
  delaySeconds: number; // negative delay so particles start already
  // mid-cycle - otherwise all 22 would begin in lockstep at page load.
}

function randomSpec(): ParticleSpec {
  const angle = Math.random() * Math.PI * 2;
  const distance = 20 + Math.random() * 45; // vw/vh-ish travel radius
  return {
    leftVw: Math.random() * 100,
    topVh: Math.random() * 100,
    dxVw: Math.cos(angle) * distance,
    dyVh: Math.sin(angle) * distance,
    sizePx: 1 + Math.random() * 2, // 1-3px
    driftSeconds: 4 + Math.random() * 6, // 4-10s - quick, not a slow crawl
    glowSeconds: 3 + Math.random() * 3, // 3-6s - visibly slower than the drift
    delaySeconds: -(Math.random() * 12),
  };
}

function applySpec(el: HTMLElement, spec: ParticleSpec): void {
  el.style.setProperty("--hk-p-left", `${spec.leftVw}vw`);
  el.style.setProperty("--hk-p-top", `${spec.topVh}vh`);
  el.style.setProperty("--hk-p-dx", `${spec.dxVw}vw`);
  el.style.setProperty("--hk-p-dy", `${spec.dyVh}vh`);
  el.style.setProperty("--hk-p-size", `${spec.sizePx}px`);
  el.style.setProperty("--hk-p-drift-base", `${spec.driftSeconds}`);
  el.style.setProperty("--hk-p-glow-base", `${spec.glowSeconds}`);
  el.style.setProperty("--hk-p-delay", `${spec.delaySeconds}s`);
}

/** Fills `container` with `count` particle elements (default 22 - "very
 * small" and few enough to stay "not heavy"). Idempotent: clears whatever
 * was there first, so calling it again re-randomizes rather than piling up.
 * No timers, no RAF loop - Math.random() runs once per element, then the
 * CSS animation referenced by .hk-particle takes over entirely. */
export function initParticles(container: HTMLElement, count: number = DEFAULT_COUNT): void {
  initAmbientField(container, count, "hk-particle", randomSpec, applySpec);
}
