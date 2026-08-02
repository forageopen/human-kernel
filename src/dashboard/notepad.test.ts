/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
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
    expect(loadNotepadContent("1")).toBe("");
    expect(loadHighlightColor("1")).toBe("#f5e6a3");
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
});

describe("renderNotepad", () => {
  beforeEach(() => localStorage.clear());

  it("renders 4 highlight swatches, a clear button, and a contenteditable area", () => {
    const { root, area, swatches } = renderNotepad("1");
    expect(swatches.length).toBe(4);
    expect(root.querySelector(".hk-notepad-clear")).not.toBeNull();
    expect(area.contentEditable).toBe("true");
  });

  it("restores previously saved content into the area, for that instance id specifically", () => {
    saveNotepadContent("2", "<div>saved note</div>");
    const { area } = renderNotepad("2");
    expect(area.innerHTML).toBe("<div>saved note</div>");
  });

  it("marks the previously saved highlight color's swatch as active", () => {
    saveHighlightColor("1", "#a3c9e6");
    const { swatches } = renderNotepad("1");
    const active = swatches.find((s) => s.classList.contains("active"));
    expect(active?.dataset.color).toBe("#a3c9e6");
  });
});

describe("wireNotepad", () => {
  beforeEach(() => localStorage.clear());

  it("saves content to localStorage as the user types", () => {
    const { root, area, swatches } = renderNotepad("1");
    wireNotepad("1", root, area, swatches);
    area.innerHTML = "<div>new text</div>";
    area.dispatchEvent(new Event("input", { bubbles: true }));
    expect(loadNotepadContent("1")).toBe("<div>new text</div>");
  });

  it("clear button wipes the note and persists the empty state", () => {
    saveNotepadContent("1", "<div>old</div>");
    const { root, area, swatches } = renderNotepad("1");
    wireNotepad("1", root, area, swatches);
    root.querySelector<HTMLElement>(".hk-notepad-clear")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(area.innerHTML).toBe("");
    expect(loadNotepadContent("1")).toBe("");
  });

  it("clicking a swatch marks it active and persists the color choice", () => {
    const { root, area, swatches } = renderNotepad("1");
    wireNotepad("1", root, area, swatches);
    swatches[1]?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(swatches[1]?.classList.contains("active")).toBe(true);
    expect(swatches[0]?.classList.contains("active")).toBe(false);
    expect(loadHighlightColor("1")).toBe(swatches[1]?.dataset.color);
  });

  it("two different notepad instances on the same page don't clobber each other's saved state", () => {
    const first = renderNotepad("1");
    const second = renderNotepad("2");
    wireNotepad("1", first.root, first.area, first.swatches);
    wireNotepad("2", second.root, second.area, second.swatches);

    first.area.innerHTML = "<div>note one</div>";
    first.area.dispatchEvent(new Event("input", { bubbles: true }));
    second.area.innerHTML = "<div>note two</div>";
    second.area.dispatchEvent(new Event("input", { bubbles: true }));

    expect(loadNotepadContent("1")).toBe("<div>note one</div>");
    expect(loadNotepadContent("2")).toBe("<div>note two</div>");
  });

  it("applying a highlight also sets dark text color on the same selection, for contrast", () => {
    // jsdom doesn't implement execCommand at all (a documented gap, not a
    // version quirk) - vi.spyOn needs the property to already exist on the
    // object to wrap it, so stub it first. Chromium (this app's actual
    // target, per ADR-0003) implements it natively; this only affects the
    // test environment.
    if (!("execCommand" in document)) {
      (document as unknown as { execCommand: () => boolean }).execCommand = () => false;
    }
    const execSpy = vi.spyOn(document, "execCommand").mockReturnValue(true);
    const { root, area, swatches } = renderNotepad("1");
    wireNotepad("1", root, area, swatches);

    swatches[0]?.dispatchEvent(new Event("click", { bubbles: true }));

    const calls = execSpy.mock.calls.map((c) => c[0]);
    expect(calls).toContain("hiliteColor");
    expect(calls).toContain("foreColor");
    // foreColor must be called with a dark color, not the light swatch itself
    const foreColorCall = execSpy.mock.calls.find((c) => c[0] === "foreColor");
    expect(foreColorCall?.[2]).toBe("#1c1c1a");

    execSpy.mockRestore();
  });
});
