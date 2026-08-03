/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadNotepadContent,
  saveNotepadContent,
  loadHighlightColor,
  saveHighlightColor,
  renderNotepad,
  wireNotepad,
  HIGHLIGHT_COLORS,
  NO_HIGHLIGHT_COLOR,
} from "./notepad.js";

/** jsdom doesn't implement execCommand at all (a documented gap, not a
 * version quirk) - vi.spyOn needs the property to already exist on the
 * object to wrap it, so stub it first if missing. Chromium (this app's
 * actual target, per ADR-0003) implements it natively; this only affects
 * the test environment. */
function stubExecCommandIfMissing(): void {
  if (!("execCommand" in document)) {
    (document as unknown as { execCommand: () => boolean }).execCommand = () => false;
  }
}

describe("notepad persistence", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty content and the default color when nothing is stored", () => {
    expect(loadNotepadContent("1")).toBe("");
    expect(loadHighlightColor("1")).toBe(HIGHLIGHT_COLORS[0]);
  });

  it("round-trips saved content and color", () => {
    saveNotepadContent("1", "<div>hello</div>");
    saveHighlightColor("1", "#a3c9e6");
    expect(loadNotepadContent("1")).toBe("<div>hello</div>");
    expect(loadHighlightColor("1")).toBe("#a3c9e6");
  });

  it("keeps each instance id's content and color independent", () => {
    saveNotepadContent("1", "<div>first note</div>");
    saveNotepadContent("2", "<div>second note</div>");
    saveHighlightColor("1", "#a3c9e6");
    saveHighlightColor("2", "#e6a3c4");

    expect(loadNotepadContent("1")).toBe("<div>first note</div>");
    expect(loadNotepadContent("2")).toBe("<div>second note</div>");
    expect(loadHighlightColor("1")).toBe("#a3c9e6");
    expect(loadHighlightColor("2")).toBe("#e6a3c4");
  });

  it("instance '1' migrates forward from the old unsuffixed keys the first time it loads", () => {
    localStorage.setItem("hk-notepad-content", "<div>pre-multi-instance note</div>");
    localStorage.setItem("hk-notepad-color", "#a8d5a3");
    expect(loadNotepadContent("1")).toBe("<div>pre-multi-instance note</div>");
    expect(loadHighlightColor("1")).toBe("#a8d5a3");
  });

  it("a fresh instance id (2-5) does NOT fall back to the legacy keys - only '1' migrates", () => {
    localStorage.setItem("hk-notepad-content", "<div>belongs to instance 1 only</div>");
    expect(loadNotepadContent("3")).toBe("");
  });

  it("writes always go to the per-instance key, never the legacy key, once saved", () => {
    saveNotepadContent("1", "<div>new content</div>");
    expect(localStorage.getItem("hk-notepad-content")).toBeNull();
    expect(loadNotepadContent("1")).toBe("<div>new content</div>");
  });

  it("de-selecting stores the NO_HIGHLIGHT_COLOR sentinel, distinct from nothing-stored-yet", () => {
    saveHighlightColor("1", NO_HIGHLIGHT_COLOR);
    expect(loadHighlightColor("1")).toBe(NO_HIGHLIGHT_COLOR);
    expect(loadHighlightColor("1")).not.toBe(HIGHLIGHT_COLORS[0]);
  });
});

describe("HIGHLIGHT_COLORS", () => {
  it("has exactly 24 colors (direct request: 'add highlighter color to 24')", () => {
    expect(HIGHLIGHT_COLORS.length).toBe(24);
  });

  it("every color is a well-formed hsl() string", () => {
    for (const color of HIGHLIGHT_COLORS) {
      expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
    }
  });

  it("every color is unique - 24 distinct hues, no duplicates", () => {
    expect(new Set(HIGHLIGHT_COLORS).size).toBe(HIGHLIGHT_COLORS.length);
  });
});

describe("renderNotepad", () => {
  beforeEach(() => localStorage.clear());

  it("renders 1 de-select swatch + 24 highlight swatches, 4 format buttons, a clear button, and a contenteditable area", () => {
    const { root, area, swatches, formatButtons } = renderNotepad("1");
    expect(swatches.length).toBe(25);
    expect(swatches[0]?.classList.contains("none")).toBe(true);
    expect(swatches[0]?.dataset.color).toBe(NO_HIGHLIGHT_COLOR);
    expect(formatButtons.length).toBe(4);
    expect(formatButtons.map((b) => (b as HTMLElement).dataset.command)).toEqual([
      "bold",
      "italic",
      "underline",
      "strikeThrough",
    ]);
    expect(root.querySelector(".hk-notepad-clear")).not.toBeNull();
    expect(area.contentEditable).toBe("true");
  });

  it("restores previously saved content into the area, for that instance id specifically", () => {
    saveNotepadContent("2", "<div>saved note</div>");
    const { area } = renderNotepad("2");
    expect(area.innerHTML).toBe("<div>saved note</div>");
  });

  it("marks the previously saved highlight color's swatch as active", () => {
    saveHighlightColor("1", HIGHLIGHT_COLORS[2]!);
    const { swatches } = renderNotepad("1");
    const active = swatches.find((s) => s.classList.contains("active"));
    expect(active?.dataset.color).toBe(HIGHLIGHT_COLORS[2]);
  });

  it("marks the de-select swatch as active when the stored color is NO_HIGHLIGHT_COLOR", () => {
    saveHighlightColor("1", NO_HIGHLIGHT_COLOR);
    const { swatches } = renderNotepad("1");
    expect(swatches[0]?.classList.contains("active")).toBe(true);
    expect(swatches.slice(1).some((s) => s.classList.contains("active"))).toBe(false);
  });
});

describe("wireNotepad", () => {
  beforeEach(() => localStorage.clear());

  it("saves content to localStorage as the user types", () => {
    const { root, area, swatches, formatButtons } = renderNotepad("1");
    wireNotepad("1", root, area, swatches, formatButtons);
    area.innerHTML = "<div>new text</div>";
    area.dispatchEvent(new Event("input", { bubbles: true }));
    expect(loadNotepadContent("1")).toBe("<div>new text</div>");
  });

  it("clear button wipes the note and persists the empty state", () => {
    saveNotepadContent("1", "<div>old</div>");
    const { root, area, swatches, formatButtons } = renderNotepad("1");
    wireNotepad("1", root, area, swatches, formatButtons);
    root.querySelector<HTMLElement>(".hk-notepad-clear")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(area.innerHTML).toBe("");
    expect(loadNotepadContent("1")).toBe("");
  });

  it("clicking a color swatch marks it active and persists the color choice", () => {
    const { root, area, swatches, formatButtons } = renderNotepad("1");
    wireNotepad("1", root, area, swatches, formatButtons);
    // index 0 is the de-select swatch; index 1 is the first real color.
    swatches[1]?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(swatches[1]?.classList.contains("active")).toBe(true);
    expect(swatches[0]?.classList.contains("active")).toBe(false);
    expect(loadHighlightColor("1")).toBe(swatches[1]?.dataset.color);
  });

  it("two different notepad instances on the same page don't clobber each other's saved state", () => {
    const first = renderNotepad("1");
    const second = renderNotepad("2");
    wireNotepad("1", first.root, first.area, first.swatches, first.formatButtons);
    wireNotepad("2", second.root, second.area, second.swatches, second.formatButtons);

    first.area.innerHTML = "<div>note one</div>";
    first.area.dispatchEvent(new Event("input", { bubbles: true }));
    second.area.innerHTML = "<div>note two</div>";
    second.area.dispatchEvent(new Event("input", { bubbles: true }));

    expect(loadNotepadContent("1")).toBe("<div>note one</div>");
    expect(loadNotepadContent("2")).toBe("<div>note two</div>");
  });

  it("applying a color highlight also sets dark text color on the same selection, for contrast", () => {
    stubExecCommandIfMissing();
    const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);
    const { root, area, swatches, formatButtons } = renderNotepad("1");
    wireNotepad("1", root, area, swatches, formatButtons);

    // index 0 is the de-select swatch - use the first real color instead.
    swatches[1]?.dispatchEvent(new Event("click", { bubbles: true }));

    const calls = execSpy.mock.calls.map((c) => c[0]);
    expect(calls).toContain("hiliteColor");
    expect(calls).toContain("foreColor");
    // foreColor must be called with a dark color, not the light swatch itself
    const foreColorCall = execSpy.mock.calls.find((c) => c[0] === "foreColor");
    expect(foreColorCall?.[2]).toBe("#1c1c1a");
    const hiliteColorCall = execSpy.mock.calls.find((c) => c[0] === "hiliteColor");
    expect(hiliteColorCall?.[2]).toBe(swatches[1]?.dataset.color);

    execSpy.mockRestore();
  });

  it("clicking the de-select swatch clears the highlight (transparent) and hands text color back to inherit", () => {
    stubExecCommandIfMissing();
    const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);
    const { root, area, swatches, formatButtons } = renderNotepad("1");
    wireNotepad("1", root, area, swatches, formatButtons);

    swatches[0]?.dispatchEvent(new Event("click", { bubbles: true }));

    const hiliteColorCall = execSpy.mock.calls.find((c) => c[0] === "hiliteColor");
    const foreColorCall = execSpy.mock.calls.find((c) => c[0] === "foreColor");
    expect(hiliteColorCall?.[2]).toBe("transparent");
    expect(foreColorCall?.[2]).toBe("inherit");
    expect(swatches[0]?.classList.contains("active")).toBe(true);
    expect(loadHighlightColor("1")).toBe(NO_HIGHLIGHT_COLOR);

    execSpy.mockRestore();
  });

  it("each format button runs its own execCommand on click and persists the result", () => {
    stubExecCommandIfMissing();
    const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);
    const { root, area, swatches, formatButtons } = renderNotepad("1");
    wireNotepad("1", root, area, swatches, formatButtons);

    const expectedCommands = ["bold", "italic", "underline", "strikeThrough"];
    formatButtons.forEach((btn, i) => {
      btn.dispatchEvent(new Event("click", { bubbles: true }));
      expect(execSpy).toHaveBeenLastCalledWith(expectedCommands[i]);
    });

    execSpy.mockRestore();
  });
});
