// Small shared DOM-environment helpers used by more than one widget.

/** Whether the visitor has requested reduced motion - wrapped in a try/catch
 * since `matchMedia` isn't guaranteed to exist in every test/DOM
 * environment. Used by any widget that plays a decorative animation
 * (mascot.ts's fall-to-rest, fireworks.ts's bursts) so it can skip/soften
 * motion for visitors who asked for less of it. */
export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}
