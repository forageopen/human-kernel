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
// highlighted, can the text color to dark so it's contrast"): all 4 swatch
// colors are light pastels, and the notepad's own text color is the
// light/near-white tone meant for a dark card background - stacking one on
// the other made highlighted text unreadable. Every hiliteColor call is now
// immediately followed by a foreColor call setting the same selection's text
// to a fixed dark charcoal, so a highlight always has a highlight-colored
// background AND dark, readable text, regardless of which of the 4 swatches
// was used or which app theme (dark/light) is active.

const LEGACY_CONTENT_KEY = "hk-notepad-content";
const LEGACY_COLOR_KEY = "hk-notepad-color";
const DEFAULT_COLORS = ["#f5e6a3", "#a8d5a3", "#a3c9e6", "#e6a3c4"];
const HIGHLIGHT_TEXT_COLOR = "#1c1c1a"; // Deep Charcoal - dark on every swatch, both app themes

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
    if (id === "1") return localStorage.getItem(LEGACY_COLOR_KEY) ?? DEFAULT_COLORS[0]!;
    return DEFAULT_COLORS[0]!;
  } catch {
    return DEFAULT_COLORS[0]!;
  }
}

export function saveHighlightColor(id: string, color: string): void {
  try {
    localStorage.setItem(colorKey(id), color);
  } catch {
    // no persistence available this session
  }
}

/** Builds the notepad's DOM - a swatch toolbar + the contenteditable area
 * itself. Kept as a pure builder (no execCommand calls here) so its shape is
 * testable without jsdom needing to support contenteditable execCommand (it
 * doesn't); wireNotepad below adds the actual interactive behavior. */
export function renderNotepad(id: string): { root: HTMLElement; area: HTMLElement; swatches: HTMLElement[] } {
  const root = document.createElement("div");

  const toolbar = document.createElement("div");
  toolbar.className = "hk-notepad-toolbar";

  const activeColor = loadHighlightColor(id);
  const swatches: HTMLElement[] = [];
  for (const color of DEFAULT_COLORS) {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "hk-highlight-swatch" + (color === activeColor ? " active" : "");
    swatch.style.background = color;
    swatch.dataset.color = color;
    swatch.setAttribute("aria-label", `Highlight color ${color}`);
    toolbar.appendChild(swatch);
    swatches.push(swatch);
  }

  const clearBtn = document.createElement("button");
  clearBtn.type = "button";
  clearBtn.className = "hk-notepad-clear";
  clearBtn.textContent = "Clear";
  toolbar.appendChild(clearBtn);

  root.appendChild(toolbar);

  const area = document.createElement("div");
  area.className = "hk-notepad-area";
  area.contentEditable = "true";
  area.dataset.placeholder = "Type a note...";
  area.innerHTML = loadNotepadContent(id);
  root.appendChild(area);

  return { root, area, swatches };
}

/** Wires the interactive behavior: clicking a swatch sets the active
 * highlight color (and applies it, plus a dark text color for contrast, to
 * any current text selection); typing saves to localStorage; Clear wipes
 * the note. No confirmation dialog on Clear - this is a low-stakes personal
 * scratchpad, not a destructive account action, so that would just be
 * friction. */
export function wireNotepad(id: string, root: HTMLElement, area: HTMLElement, swatches: HTMLElement[]): void {
  const persist = (): void => saveNotepadContent(id, area.innerHTML);

  for (const swatch of swatches) {
    swatch.addEventListener("click", () => {
      const color = swatch.dataset.color ?? DEFAULT_COLORS[0]!;
      saveHighlightColor(id, color);
      for (const s of swatches) s.classList.toggle("active", s === swatch);
      area.focus();
      try {
        document.execCommand("hiliteColor", false, color);
        document.execCommand("foreColor", false, HIGHLIGHT_TEXT_COLOR);
      } catch {
        // execCommand unsupported/no-op in this environment - the color
        // still becomes the active choice for future selections.
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
