/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderMascotSvg, loadMascotPosition, saveMascotPosition, wireMascot } from "./mascot.js";

// jsdom doesn't implement PointerEvent at all (a documented gap, not a
// version quirk - see jsdom's own list of unsupported parts). Polyfill just
// enough of it - MouseEvent's clientX/clientY plus a pointerId - for the
// drag+release simulation below to run under vitest's jsdom environment.
// Chromium (this app's actual target, per ADR-0003) implements PointerEvent
// natively; this shim only exists for the test run itself.
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

describe("renderMascotSvg", () => {
  it("returns a valid, non-empty SVG string", () => {
    const svg = renderMascotSvg("normal");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<rect");
  });

  it("never uses pure black or pure white (brand rule, same as the profile avatar)", () => {
    const svg = renderMascotSvg("normal");
    expect(svg).not.toContain("#000000");
    expect(svg).not.toContain("#ffffff");
    expect(svg).not.toContain("#fff");
    expect(svg).not.toContain("#000");
  });

  it("the squint render differs from the normal render - hover actually changes something", () => {
    expect(renderMascotSvg("squint")).not.toBe(renderMascotSvg("normal"));
  });

  it("uses a purple body color, per the direct 'purple color' request", () => {
    const svg = renderMascotSvg("normal");
    expect(svg).toMatch(/#8b7ec8|#5f4f96/i);
  });
});

describe("loadMascotPosition / saveMascotPosition", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when nothing has been saved yet", () => {
    expect(loadMascotPosition()).toBeNull();
  });

  it("round-trips a saved position", () => {
    saveMascotPosition({ left: 40, top: 500 });
    expect(loadMascotPosition()).toEqual({ left: 40, top: 500 });
  });
});

describe("wireMascot", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("renders the normal-eyed sprite immediately", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    wireMascot(el);
    expect(el.querySelector("svg")).not.toBeNull();
  });

  it("restores a previously saved resting position instead of the CSS default", () => {
    saveMascotPosition({ left: 77, top: 88 });
    const el = document.createElement("div");
    document.body.appendChild(el);
    wireMascot(el);
    expect(el.style.left).toBe("77px");
    expect(el.style.top).toBe("88px");
  });

  it("mouseenter swaps to the squint render, mouseleave swaps back", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    wireMascot(el);
    const normalSvg = el.innerHTML;

    el.dispatchEvent(new MouseEvent("mouseenter"));
    expect(el.innerHTML).not.toBe(normalSvg);

    el.dispatchEvent(new MouseEvent("mouseleave"));
    expect(el.innerHTML).toBe(normalSvg);
  });

  it("dragging then releasing settles near the bottom of the viewport and persists the resting spot", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      left: 200,
      top: 50,
      width: 64,
      height: 64,
      right: 264,
      bottom: 114,
      x: 200,
      y: 50,
      toJSON: () => ({}),
    });
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    // jsdom doesn't implement setPointerCapture/releasePointerCapture - stub
    // them so the drag logic (which calls both) doesn't throw in this
    // environment, same accommodation draggable.test.ts already needed.
    (el as unknown as { setPointerCapture: () => void }).setPointerCapture = () => {};
    (el as unknown as { releasePointerCapture: () => void }).releasePointerCapture = () => {};

    wireMascot(el);

    el.dispatchEvent(new PointerEvent("pointerdown", { clientX: 232, clientY: 82, pointerId: 1 }));
    el.dispatchEvent(new PointerEvent("pointerup", { clientX: 232, clientY: 82, pointerId: 1 }));

    // The fall animation is in flight (class added) - settling itself
    // happens on animationend, which jsdom won't fire on its own.
    expect(el.classList.contains("hk-mascot-falling")).toBe(true);
    el.dispatchEvent(new Event("animationend"));

    expect(el.classList.contains("hk-mascot-falling")).toBe(false);
    const saved = loadMascotPosition();
    expect(saved?.top).toBe(800 - 64 - 24);
    expect(el.style.top).toBe(`${800 - 64 - 24}px`);
  });
});
