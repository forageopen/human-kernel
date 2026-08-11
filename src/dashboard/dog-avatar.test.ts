/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderDogSvg, wireDogAvatar } from "./dog-avatar.js";
import { getJSON } from "./storage.js";

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

describe("renderDogSvg", () => {
  it("returns a valid, non-empty SVG string", () => {
    const svg = renderDogSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<rect");
  });

  it("never uses pure black or pure white (brand rule, same as the profile avatar and mascot)", () => {
    const svg = renderDogSvg();
    expect(svg).not.toContain("#000000");
    expect(svg).not.toContain("#ffffff");
    expect(svg).not.toContain("#fff");
    expect(svg).not.toContain("#000");
  });

  it("is deterministic - no randomness, same output every call", () => {
    expect(renderDogSvg()).toBe(renderDogSvg());
  });
});

describe("wireDogAvatar", () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = "";
  });

  it("renders the sprite inside a .hk-dog-hop wrapper", () => {
    const el = document.createElement("div");
    wireDogAvatar(el);
    const hop = el.querySelector(".hk-dog-hop");
    expect(hop).not.toBeNull();
    expect(hop?.querySelector("svg")).not.toBeNull();
  });

  it("is idempotent - calling it again replaces rather than duplicates", () => {
    const el = document.createElement("div");
    wireDogAvatar(el);
    wireDogAvatar(el);
    expect(el.querySelectorAll(".hk-dog-hop").length).toBe(1);
  });

  it("restores a previously saved lane instead of the CSS default", () => {
    localStorage.setItem("hk-dog-lane-top", JSON.stringify(123));
    const el = document.createElement("div");
    wireDogAvatar(el);
    expect(el.style.top).toBe("123px");
    expect(el.style.bottom).toBe("auto");
  });

  it("dragging kills the crossing animation and dropping resets left to 0 while persisting the new lane", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      left: 0, top: 18, width: 56, height: 40, right: 56, bottom: 58, x: 0, y: 18, toJSON: () => ({}),
    });
    // jsdom doesn't implement setPointerCapture/releasePointerCapture - stub
    // them, same accommodation mascot.test.ts/creeper.test.ts already need.
    (el as unknown as { setPointerCapture: () => void }).setPointerCapture = () => {};
    (el as unknown as { releasePointerCapture: () => void }).releasePointerCapture = () => {};

    wireDogAvatar(el);

    el.dispatchEvent(new PointerEvent("pointerdown", { clientX: 100, clientY: 100, pointerId: 1 }));
    expect(el.classList.contains("hk-dog-dragging")).toBe(true);

    el.dispatchEvent(new PointerEvent("pointermove", { clientX: 100, clientY: 250, pointerId: 1 }));
    expect(el.style.top).toBe("168px"); // 18 (start) + 150 (dy)

    el.dispatchEvent(new PointerEvent("pointerup", { clientX: 100, clientY: 250, pointerId: 1 }));
    expect(el.classList.contains("hk-dog-dragging")).toBe(false);
    expect(el.style.left).toBe("0px"); // horizontal resets - the crossing animation owns it again
    expect(el.style.top).toBe("168px"); // vertical lane carries over
    expect(getJSON<number | null>("hk-dog-lane-top", null)).toBe(168);
  });
});
