// Second ambient background layer (2026-08-02, direct request: "one more
// background animation of this moving stars have two groups, chasing each
// other like [space]ships shooting lasers"). Same non-negotiables as the
// slow ambient particle field (particles.ts): pure CSS keyframe motion
// (transform + opacity only, GPU-composited), no canvas, no per-frame JS,
// no animation library - this function only creates elements and hands each
// one a randomized path via CSS custom properties.
//
// Two groups, two directions, two brand-safe colors - Ember Gold traveling
// one diagonal, Sage traveling the opposite one, so their paths cross like
// a chase rather than everything drifting the same way. Crimson was
// deliberately NOT used for either group - the brand guideline reserves it
// for warnings/critical states only, never decorative use, and this is
// purely decorative.
//
// Shares the same --hk-speed control as particles.ts (see that file's
// header) via the same calc()-on-a-bare-number pattern, so the scene
// taskbar's one slider speeds up or slows down both background layers
// together.

const DEFAULT_COUNT_PER_GROUP = 5;

interface StarSpec {
  leftVw: number;
  topVh: number;
  angleDeg: number;
  distanceVw: number;
  lengthPx: number;
  durationBase: number; // seconds, unitless - see particles.ts on why
  delaySeconds: number;
  group: "a" | "b";
}

function randomStar(group: "a" | "b"): StarSpec {
  // Group A travels roughly left-to-right-and-down; Group B roughly the
  // reverse - opposite diagonals, so paths visibly cross rather than two
  // groups just drifting in parallel.
  const baseAngle = group === "a" ? -20 + Math.random() * 40 : 160 + Math.random() * 40;
  return {
    leftVw: Math.random() * 100,
    topVh: Math.random() * 100,
    angleDeg: baseAngle,
    distanceVw: 60 + Math.random() * 50,
    lengthPx: 18 + Math.random() * 22,
    durationBase: 1.6 + Math.random() * 1.6, // fast - "shooting," not drifting
    delaySeconds: -(Math.random() * 4),
    group,
  };
}

function applySpec(el: HTMLElement, spec: StarSpec): void {
  el.classList.add(`hk-starchase-${spec.group}`);
  el.style.setProperty("--hk-s-left", `${spec.leftVw}vw`);
  el.style.setProperty("--hk-s-top", `${spec.topVh}vh`);
  el.style.setProperty("--hk-s-angle", `${spec.angleDeg}deg`);
  el.style.setProperty("--hk-s-distance", `${spec.distanceVw}vw`);
  el.style.setProperty("--hk-s-length", `${spec.lengthPx}px`);
  el.style.setProperty("--hk-s-duration-base", `${spec.durationBase}`);
  el.style.setProperty("--hk-s-delay", `${spec.delaySeconds}s`);
}

/** Fills `container` with `countPerGroup` streaks per group (2 groups
 * total). Idempotent, same as initParticles - clears and re-randomizes
 * rather than piling up on repeated calls. */
export function initStarChase(container: HTMLElement, countPerGroup: number = DEFAULT_COUNT_PER_GROUP): void {
  container.innerHTML = "";
  for (const group of ["a", "b"] as const) {
    for (let i = 0; i < countPerGroup; i++) {
      const el = document.createElement("span");
      el.className = "hk-starchase-streak";
      applySpec(el, randomStar(group));
      container.appendChild(el);
    }
  }
}
