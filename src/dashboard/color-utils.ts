// Shared "N evenly-spaced hues" palette generator - extracted from the
// identical algorithm duplicated in fireworks.ts's paletteForCount and
// notepad.ts's buildHighlightPalette. Each caller supplies its own
// hue-offset/saturation/lightness constants; only the spacing math itself
// is shared.

export interface EvenlySpacedHuesOptions {
  /** Starting hue (0-359) the first color is offset from - defaults to 0. */
  hueOffset?: number;
  saturation: number;
  lightness: number;
}

/** `count` evenly-spaced hues around the color wheel, as ready-to-use
 * `hsl()` strings. Pure and deterministic - same saturation/lightness every
 * time, only the hue spacing changes with `count`. */
export function evenlySpacedHues(count: number, opts: EvenlySpacedHuesOptions): string[] {
  const { hueOffset = 0, saturation, lightness } = opts;
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (hueOffset + Math.round((360 / count) * i)) % 360;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  return colors;
}
