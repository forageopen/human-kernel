// Shared plumbing behind every ambient background layer (particles.ts,
// starchase.ts, sakura.ts). All three are pure CSS keyframe animations -
// transform + opacity only, GPU-composited, no canvas, no per-frame JS loop,
// no animation library - whose only JS job is to create N elements and hand
// each one a randomized path via CSS custom properties. This file is just
// that shared "clear container, create `count` elements, randomize each,
// apply it" loop; each widget keeps its own spec shape, randomizer, and
// applySpec (className/custom-properties differ per layer).

/** Clears `container` then fills it with `count` freshly-randomized
 * elements of `className` - idempotent, same as every ambient layer's own
 * init function used to implement individually (clears whatever was there
 * first, so calling it again re-randomizes rather than piling up). `index`
 * is passed to `randomSpec` so callers that vary behavior by position
 * (e.g. starchase.ts's two direction groups) can do so without a nested
 * loop. */
export function initAmbientField<Spec>(
  container: HTMLElement,
  count: number,
  className: string,
  randomSpec: (index: number) => Spec,
  applySpec: (el: HTMLElement, spec: Spec) => void,
): void {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = className;
    applySpec(el, randomSpec(i));
    container.appendChild(el);
  }
}
