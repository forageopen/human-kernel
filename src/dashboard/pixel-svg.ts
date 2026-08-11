// Shared pixel-grid SVG renderer, extracted from the identical
// Map-merge + bounds-check + string-join + <svg> wrapper that used to be
// hand-rolled separately in avatar.ts, mascot.ts, and dog-avatar.ts. Each of
// those keeps its own pixel-layout data/functions (body/eyes/hat/etc) and
// just hands the finished [row, col, color] list to this one renderer.

export type Pixel = readonly [row: number, col: number, color: string];

/** Merges `pixels` (later entries win on (row, col) overlap, via a Map keyed
 * by "row,col"), drops anything outside the `gridW`x`gridH` grid, and joins
 * the rest into a single `<svg>` string - `px` is the size in SVG units each
 * grid cell renders as, so the viewBox is `gridW*px` by `gridH*px`. Pure/no
 * DOM required, so it's fully unit-testable. */
export function renderPixelSvg(pixels: Pixel[], gridW: number, gridH: number, px: number, ariaLabel: string): string {
  const merged = new Map<string, string>();
  for (const [r, c, color] of pixels) {
    if (r < 0 || r >= gridH || c < 0 || c >= gridW) continue;
    merged.set(`${r},${c}`, color);
  }

  const rects = Array.from(merged.entries())
    .map(([key, color]) => {
      const parts = key.split(",");
      const r = Number(parts[0]);
      const c = Number(parts[1]);
      return `<rect x="${c * px}" y="${r * px}" width="${px}" height="${px}" fill="${color}"/>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${gridW * px} ${gridH * px}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${ariaLabel}">${rects}</svg>`;
}
