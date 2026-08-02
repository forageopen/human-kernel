/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadNotepadContent,
  saveNotepadContent,
  loadHighlightColor,
  saveHighlightColor,
  renderNotepad,
  wireNotepad,
} from "./notepad.js";

describe("notepad persistence", () => {
  beforeEach(() => localStorage.clear());

  it("returns empty content and the default color when nothing is stored", () => {
    expect(loadNotepadContent()).toBe("");
    expect(loadHighlightColor()).toBe("#f5e6a3");
  });

  it("round-trips saved content and color", () => {
    saveNotepadContent("<div>hello</div>");
    saveHighlightColor("#a3c9e6");
    expect(loadNotepadContent()).toBe("<div>hello</div>");
    expect(loadHighlightColor()).toBe("#a3c9e6");
  });
});

describe("renderNotepad", () => {
  beforeEach(() => localStorage.clear());

  it("renders 4 highlight swatches, a clear button, and a contenteditable area", () => {
    const { root, area, swatches } = renderNotepad();
    expect(swatches.length).toBe(4);
    expect(root.querySelector(".hk-notepad-clear")).not.toBeNull();
    expect(area.contentEditable).toBe("true");
  });

  it("restores previously saved content into the area", () => {
    saveNotepadContent("<div>saved note</div>");
    const { area } = renderNotepad();
    expect(area.innerHTML).toBe("<div>saved note</div>");
  });

  it("marks the previously saved highlight color's swatch as active", () => {
    saveHighlightColor("#a3c9e6");
    const { swatches } = renderNotepad();
    const active = swatches.find((s) => s.classList.contains("active"));
    expect(active?.dataset.color).toBe("#a3c9e6");
  });
});

describe("wireNotepad", () => {
  beforeEach(() => localStorage.clear());

  it("saves content to localStorage as the user types", () => {
    const { root, area, swatches } = renderNotepad();
    wireNotepad(root, area, swatches);
    area.innerHTML = "<div>new text</div>";
    area.dispatchEvent(new Event("input", { bubbles: true }));
    expect(loadNotepadContent()).toBe("<div>new text</div>");
  });

  it("clear button wipes the note and persists the empty state", () => {
    saveNotepadContent("<div>old</div>");
    const { root, area, swatches } = renderNotepad();
    wireNotepad(root, area, swatches);
    root.querySelector<HTMLElement>(".hk-notepad-clear")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(area.innerHTML).toBe("");
    expect(loadNotepadContent()).toBe("");
  });

  it("clicking a swatch marks it active and persists the color choice", () => {
    const { root, area, swatches } = renderNotepad();
    wireNotepad(root, area, swatches);
    swatches[1]?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(swatches[1]?.classList.contains("active")).toBe(true);
    expect(swatches[0]?.classList.contains("active")).toBe(false);
    expect(loadHighlightColor()).toBe(swatches[1]?.dataset.color);
  });
});
