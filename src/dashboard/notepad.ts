// Scrollable notepad card with a text highlighter (2026-08-02, direct
// request: "a blank typeable card for notetaking (scrollable) like as mini
// notepad as a card with highlighter (color)"). contenteditable rather than
// a plain <textarea> specifically because a highlighter needs to color PART
// of the text, not the whole field - a textarea can't do that at all.
//
// document.execCommand is deprecated but still functions correctly in
// Chromium, which this whole app is already scoped to (ADR-0003); replacing
// it with a hand-built Selection/Range text-wrapper would be considerably
// more code for the same real-browser result here, so this stays
// deliberately simple - wrapped in try/catch since execCommand can throw or
// no-op depending on environment/selection state.
//
// Multi-instance (2026-08-02, direct request: "give option to add more
// notes card (limit to 5)"): every load/save function now takes an `id` so
// up to 5 independent notepads can each persist their own content and
// highlight color without colliding. Instance "1" is the original single
// notepad this card shipped with - it migrates forward from the old
// unsuffixed storage keys the first time it loads, so nobody's already-typed
// note silently vanishes just because multi-instance support landed later.
// After that first read, everything - reads and writes - goes through the
// per-instance keys only; the legacy keys are never written to again.
//
// Highlight contrast fix (same day, direct feedback: "when the text were
// highlighted, can the text color to dark so it's contrast"): every swatch
// color is a light pastel, and the notepad's own text color is the
// light/near-white tone meant for a dark card background - stacking one on
// the other made highlighted text unreadable. Every hiliteColor call is now
// immediately followed by a foreColor call setting the same selection's text
// to a fixed dark charcoal, so a highlight always has a highlight-colored
// background AND dark, readable text, regardless of which swatch was used or
// which app theme (dark/light/feminine) is active.
//
// Formatting toolbar + 24-color highlighter + de-select (2026-08-03, direct
// request, reference: a screenshot of the Windows Sticky Notes editing
// toolbar - "adjust all sticky notes to have bold font, italic, underline,
// strikethrough, then add an option to de-select color, then add highlighter
// color to 24 (scrollable if cant fit)"). Three additions, same
// deliberately-simple execCommand approach as the existing highlighter:
//
//   1. Bold/Italic/Underline/Strikethrough buttons (FORMAT_COMMANDS below) -
//      each glyph is rendered in its own real style (bold text literally
//      reads "B" in bold, etc.), same icon language as the Sticky Notes
//      reference, no icon font needed. These are momentary actions on the
//      current selection (or the native "next typed character" toggle state
//      a browser already gives a collapsed selection) - not a persisted
//      preference like highlight color, since the resulting <b>/<i>/<u>/<s>
//      markup is already captured by the existing content round-trip.
//      Deliberately NOT scoped: reflecting "is the cursor currently inside
//      bold text" back onto the buttons (as Sticky Notes' own pressed-button
//      state does) would need a selectionchange listener plus
//      queryCommandState, another execCommand-family API with the same
//      jsdom gap as execCommand itself - real functionality either way, left
//      out here as a separate, smaller follow-up rather than silently
//      claimed as done.
//   2. A "no highlight" swatch (NO_HIGHLIGHT_COLOR, an empty-string
//      sentinel) - the previous design let you SWITCH colors but never
//      turn highlighting off again. It's just one more entry in the same
//      `swatches` array the color swatches already use, so the existing
//      click-wiring loop below handles it with no special-cased branch
//      structure, only a branch on which execCommand values to send.
//   3. HIGHLIGHT_COLORS grows from 4 hand-picked hex values to 24
//      systematically-generated pastel hues (buildHighlightPalette below) -
//      same reasoning as fireworks.ts's paletteForCount: one shared
//      saturation/lightness so the whole set reads as one coherent
//      "highlighter" family, not an uneven hand-picked list, and the count
//      is trivially adjustable if it ever needs to change again. The swatch
//      row scrolls horizontally instead of wrapping (styles.css) - same
//      overflow-x pattern already used for the heatmap's week columns.

const LEGACY_CONTENT_KEY = "hk-notepad-content";
const LEGACY_COLOR_KEY = "hk-notepad-color";
const HIGHLIGHT_TEXT_COLOR = "#1c1c1a"; // Deep Charcoal - dark on every swatch, both app themes

/** Sentinel stored/returned for "no highlight color selected" - distinct
 * from every real color string, and distinct from "nothing saved yet"
 * (localStorage.getItem returns null for that; this is an explicit ""). */
export const NO_HIGHLIGHT_COLOR = "";

const HIGHLIGHT_COLOR_COUNT = 24;
const HIGHLIGHT_HUE_START = 45; // yellow-ish - matches the original default swatch's hue
const HIGHLIGHT_SATURATION = 62;
const HIGHLIGHT_LIGHTNESS = 78;

/** HIGHLIGHT_COLOR_COUNT evenly-spaced pastel hues, as ready-to-use `hsl()`
 * strings. Pure and deterministic. */
function buildHighlightPalette(count: number): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (HIGHLIGHT_HUE_START + Math.round((360 / count) * i)) % 360;
    colors.push(`hsl(${hue}, ${HIGHLIGHT_SATURATION}%, ${HIGHLIGHT_LIGHTNESS}%)`);
  }
  return colors;
}

export const HIGHLIGHT_COLORS: readonly string[] = buildHighlightPalette(HIGHLIGHT_COLOR_COUNT);

/** The four text-formatting actions (Sticky Notes reference screenshot
 * order: B, I, U, S). `command` is the exact document.execCommand name -
 * `strikeThrough` is capitalized mid-word on purpose, matching the spec. */
const FORMAT_COMMANDS: ReadonlyArray<{ command: string; label: string; glyph: string; className: string }> = [
  { command: "bold", label: "Bold", glyph: "B", className: "hk-format-bold" },
  { command: "italic", label: "Italic", glyph: "I", className: "hk-format-italic" },
  { command: "underline", label: "Underline", glyph: "U", className: "hk-format-underline" },
  { command: "strikeThrough", label: "Strikethrough", glyph: "S", className: "hk-format-strike" },
];

function contentKey(id: string): string {
  return `hk-notepad-content-${id}`;
}
function colorKey(id: string): string {
  return `hk-notepad-color-${id}`;
}

export function loadNotepadContent(id: string): string {
  try {
    const perInstance = localStorage.getItem(contentKey(id));
    if (perInstance !== null) return perInstance;
    if (id === "1") return localStorage.getItem(LEGACY_CONTENT_KEY) ?? "";
    return "";
  } catch {
    return "";
  }
}

export function saveNotepadContent(id: string, html: string): void {
  try {
    localStorage.setItem(contentKey(id), html);
  } catch {
    // no persistence available this session
  }
}

export function loadHighlightColor(id: string): string {
  try {
    const perInstance = localStorage.getItem(colorKey(id));
    if (perInstance !== null) return perInstance;
    if (id === "1") return localStorage.getItem(LEGACY_COLOR_KEY) ?? HIGHLIGHT_COLORS[0]!;
    return HIGHLIGHT_COLORS[0]!;
  } catch {
    return HIGHLIGHT_COLORS[0]!;
  }
}

export function saveHighlightColor(id: string, color: string): void {
  try {
    localStorage.setItem(colorKey(id), color);
  } catch {
    // no persistence available this session
  }
}

/** Builds the notepad's DOM - a format-actions row, a scrollable highlight-
 * swatch row, and the contenteditable area itself. Kept as a pure builder
 * (no execCommand calls here) so its shape is testable without jsdom needing
 * to support contenteditable execCommand (it doesn't); wireNotepad below
 * adds the actual interactive behavior. */
export function renderNotepad(id: string): {
  root: HTMLElement;
  area: HTMLElement;
  swatches: HTMLElement[];
  formatButtons: HTMLElement[];
} {
  const root = document.createElement("div");

  // Row 1: Bold/Italic/Underline/Strikethrough + Clear, pushed to the far
  // right via margin-left:auto (styles.css) - kept off the scrollable
  // swatch row below so it's never scrolled out of reach.
  const formatBar = document.createElement("div");
  formatBar.className = "hk-notepad-formatbar";

  const formatButtons: HTMLElement[] = [];
  for (const spec of FORMAT_COMMANDS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `hk-notepad-format ${spec.className}`;
    btn.dataset.command = spec.command;
    btn.textContent = spec.glyph;
    btn.title = spec.label;
    btn.setAttribute("aria-label", spec.label);
    formatBar.appendChild(btn);
    formatButtons.push(btn);
  }

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "hk-notepad-clear";
  clearBtn.textContent = "Clear";
  formatBar.appendChild(clearBtn);

  root.appendChild(formatBar);

  // Row 2: highlight swatches - a "no color" de-select option first, then
  // the 24-color palette, horizontally scrollable (direct request:
  // "scrollable if cant fit") rather than wrapping to multiple rows.
  const swatchBar = document.createElement("div");
  swatchBar.className = "hk-notepad-toolbar";

  const activeColor = loadHighlightColor(id);
  const swatches: HTMLElement[] = [];

  const noneSwatch = document.createElement("button");
  noneSwatch.type = "button";
  noneSwatch.className = "hk-highlight-swatch none" + (activeColor === NO_HIGHLIGHT_COLOR ? " active" : "");
  noneSwatch.dataset.color = NO_HIGHLIGHT_COLOR;
  noneSwatch.textContent = "×";
  noneSwatch.title = "No highlight color";
  noneSwatch.setAttribute("aria-label", "No highlight color");
  swatchBar.appendChild(noneSwatch);
  swatches.push(noneSwatch);

  for (const color of HIGHLIGHT_COLORS) {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "hk-highlight-swatch" + (color === activeColor ? " active" : "");
    swatch.style.background = color;
    swatch.dataset.color = color;
    swatch.setAttribute("aria-label", `Highlight color ${color}`);
    swatchBar.appendChild(swatch);
    swatches.push(swatch);
  }

  root.appendChild(swatchBar);

  const area = document.createElement("div");
  area.className = "hk-notepad-area";
  area.contentEditable = "true";
  area.dataset.placeholder = "Type a note...";
  area.innerHTML = loadNotepadContent(id);
  root.appendChild(area);

  return { root, area, swatches, formatButtons };
}

/** Wires the interactive behavior: clicking a swatch sets the active
 * highlight color (and applies it, plus a dark text color for contrast, to
 * any current text selection) - or, for the "no color" swatch, clears
 * highlighting back off; clicking a format button runs its execCommand on
 * the current selection; typing saves to localStorage; Clear wipes the
 * note. No confirmation dialog on Clear - this is a low-stakes personal
 * scratchpad, not a destructive account action, so that would just be
 * friction. */
export function wireNotepad(
  id: string,
  root: HTMLElement,
  area: HTMLElement,
  swatches: HTMLElement[],
  formatButtons: HTMLElement[]
): void {
  const persist = (): void => saveNotepadContent(id, area.innerHTML);

  for (const swatch of swatches) {
    swatch.addEventListener("click", () => {
      const color = swatch.dataset.color ?? NO_HIGHLIGHT_COLOR;
      saveHighlightColor(id, color);
      for (const s of swatches) s.classList.toggle("active", s === swatch);
      area.focus();
      try {
        if (color === NO_HIGHLIGHT_COLOR) {
          // De-select: transparent removes the highlight background;
          // "inherit" hands text color back to the area's normal,
          // theme-aware color instead of leaving it forced dark.
          document.execCommand("hiliteColor", false, "transparent");
          document.execCommand("foreColor", false, "inherit");
        } else {
          document.execCommand("hiliteColor", false, color);
          document.execCommand("foreColor", false, HIGHLIGHT_TEXT_COLOR);
        }
      } catch {
        // execCommand unsupported/no-op in this environment - the choice
        // still becomes active for future selections.
      }
      persist();
    });
  }

  for (const btn of formatButtons) {
    btn.addEventListener("click", () => {
      const command = btn.dataset.command;
      if (!command) return;
      area.focus();
      try {
        document.execCommand(command);
      } catch {
        // execCommand unsupported/no-op in this environment
      }
      persist();
    });
  }

  root.querySelector<HTMLElement>(".hk-notepad-clear")?.addEventListener("click", () => {
    area.innerHTML = "";
    persist();
    area.focus();
  });

  area.addEventListener("input", persist);
}
