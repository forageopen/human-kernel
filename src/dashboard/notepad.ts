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

const STORAGE_KEY_CONTENT = "hk-notepad-content";
const STORAGE_KEY_COLOR = "hk-notepad-color";
const DEFAULT_COLORS = ["#f5e6a3", "#a8d5a3", "#a3c9e6", "#e6a3c4"];

export function loadNotepadContent(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_CONTENT) ?? "";
  } catch {
    return "";
  }
}

export function saveNotepadContent(html: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONTENT, html);
  } catch {
    // no persistence available this session
  }
}

export function loadHighlightColor(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_COLOR) ?? DEFAULT_COLORS[0]!;
  } catch {
    return DEFAULT_COLORS[0]!;
  }
}

export function saveHighlightColor(color: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_COLOR, color);
  } catch {
    // no persistence available this session
  }
}

/** Builds the notepad's DOM - a swatch toolbar + the contenteditable area
 * itself. Kept as a pure builder (no execCommand calls here) so its shape is
 * testable without jsdom needing to support contenteditable execCommand (it
 * doesn't); wireNotepad below adds the actual interactive behavior. */
export function renderNotepad(): { root: HTMLElement; area: HTMLElement; swatches: HTMLElement[] } {
  const root = document.createElement("div");

  const toolbar = document.createElement("div");
  toolbar.className = "hk-notepad-toolbar";

  const activeColor = loadHighlightColor();
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
  area.innerHTML = loadNotepadContent();
  root.appendChild(area);

  return { root, area, swatches };
}

/** Wires the interactive behavior: clicking a swatch sets the active
 * highlight color (and applies it to any current text selection); typing
 * saves to localStorage; Clear wipes the note. No confirmation dialog on
 * Clear - this is a low-stakes personal scratchpad, not a destructive
 * account action, so that would just be friction. */
export function wireNotepad(root: HTMLElement, area: HTMLElement, swatches: HTMLElement[]): void {
  const persist = (): void => saveNotepadContent(area.innerHTML);

  for (const swatch of swatches) {
    swatch.addEventListener("click", () => {
      const color = swatch.dataset.color ?? DEFAULT_COLORS[0]!;
      saveHighlightColor(color);
      for (const s of swatches) s.classList.toggle("active", s === swatch);
      area.focus();
      try {
        document.execCommand("hiliteColor", false, color);
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
