/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { renderCreeperSvg, wireCreeper } from "./creeper.js";
import { loadRect } from "./draggable.js";

// jsdom doesn't implement PointerEvent at all (see mascot.test.ts's identical
// note) - polyfill just enough of it for the drag simulation below.
if (typeof globalThis.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    public pointerId: number;
    constructor(type: string, params: MouseEventInit & { pointerId?: number } = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  }
  (globalThis as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventPolyfill;
}

describe("renderCreeperSvg", () => {
  it("returns a valid, non-empty SVG string", () => {
    const svg = renderCreeperSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<rect");
  });

  it("never uses pure black or pure white (brand rule, same as every other character)", () => {
    const svg = renderCreeperSvg();
    expect(svg).not.toContain("#000000");
    expect(svg).not.toContain("#ffffff");
    expect(svg).not.toContain("#fff");
    expect(svg).not.toContain("#000");
  });

  it("uses a green face color, the creeper's defining trait", () => {
    const svg = renderCreeperSvg();
    expect(svg).toMatch(/#5b8f4f|#3f6a37/i);
  });

  it("is deterministic - no randomness, same output every call", () => {
    expect(renderCreeperSvg()).toBe(renderCreeperSvg());
  });
});

describe("wireCreeper", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("renders the sprite into the element immediately", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    wireCreeper(el);
    expect(el.querySelector("svg")).not.toBeNull();
  });

  it("is idempotent - calling it again replaces rather than duplicates", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    wireCreeper(el);
    wireCreeper(el);
    expect(el.querySelectorAll("svg").length).toBe(1);
  });

  it("is draggable via makeDraggable and persists a rect under its own namespaced key on release", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    // jsdom doesn't implement setPointerCapture/releasePointerCapture - stub
    // them so makeDraggable's calls don't throw, same accommodation
    // draggable.test.ts/mascot.test.ts already need.
    (el as unknown as { setPointerCapture: () => void }).setPointerCapture = () => {};
    (el as unknown as { releasePointerCapture: () => void }).releasePointerCapture = () => {};

    wireCreeper(el);
    expect(loadRect("creeper-head")).toBeNull(); // nothing persisted before any drag

    el.dispatchEvent(new PointerEvent("pointerdown", { clientX: 10, clientY: 10, pointerId: 1 }));
    el.dispatchEvent(new PointerEvent("pointermove", { clientX: 40, clientY: 30, pointerId: 1 }));
    el.dispatchEvent(new PointerEvent("pointerup", { clientX: 40, clientY: 30, pointerId: 1 }));

    // makeDraggable persists via offsetLeft/offsetTop, which jsdom (no real
    // layout engine) always reports as 0 regardless of inline style - so this
    // only asserts that a release actually persists a rect, same shallow
    // depth draggable.test.ts itself tests makeDraggable at. The exact
    // pixel math is already covered by draggable.test.ts/mascot.test.ts.
    expect(loadRect("creeper-head")).not.toBeNull();

    // Distinct namespace from the other two persisted characters.
    expect(localStorage.getItem("hk-mascot-position")).toBeNull();
    expect(localStorage.getItem("hk-avatar-spec")).toBeNull();
  });
});
