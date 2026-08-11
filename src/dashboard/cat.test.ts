/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderCatSvg, nextCatPosition, wireCat } from "./cat.js";

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

describe("renderCatSvg", () => {
  it("returns a valid, non-empty SVG string", () => {
    const svg = renderCatSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<rect");
  });

  it("never uses pure black or pure white (brand rule, same as every other character)", () => {
    const svg = renderCatSvg();
    expect(svg).not.toContain("#000000");
    expect(svg).not.toContain("#ffffff");
    expect(svg).not.toContain("#fff");
    expect(svg).not.toContain("#000");
  });

  it("is deterministic - no randomness, same output every call", () => {
    expect(renderCatSvg()).toBe(renderCatSvg());
  });
});

describe("nextCatPosition", () => {
  it("holds position once within the follow distance of the dog - never closes the last bit of the gap", () => {
    const cat = { left: 100, top: 100 };
    const dog = { left: 130, top: 100 }; // 30px away, well inside the 90px follow distance
    expect(nextCatPosition(cat, dog, false)).toEqual(cat);
  });

  it("moves toward the dog, capped by a per-tick step, when farther than the follow distance", () => {
    const cat = { left: 0, top: 0 };
    const dog = { left: 1000, top: 0 };
    const next = nextCatPosition(cat, dog, false);
    expect(next.left).toBeGreaterThan(0);
    expect(next.left).toBeLessThan(50); // eases, doesn't teleport most of the way there
    expect(next.top).toBe(0);
  });

  it("never overshoots into/past the dog even from very close outside the follow distance", () => {
    const cat = { left: 0, top: 0 };
    const dog = { left: 95, top: 0 }; // just outside the 90px follow distance
    const next = nextCatPosition(cat, dog, false);
    const distAfter = Math.hypot(dog.left - next.left, dog.top - next.top);
    expect(distAfter).toBeGreaterThanOrEqual(90 - 1e-6);
  });

  it("under reduced motion, snaps straight to the trailing spot instead of easing", () => {
    const cat = { left: 0, top: 0 };
    const dog = { left: 1000, top: 0 };
    const next = nextCatPosition(cat, dog, true);
    expect(next.left).toBeCloseTo(1000 - 90, 5);
    expect(next.top).toBe(0);
  });
});

describe("wireCat", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function mockRect(el: HTMLElement, left: number, top: number): void {
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      left, top, width: 56, height: 40, right: left + 56, bottom: top + 40, x: left, y: top, toJSON: () => ({}),
    });
  }

  it("renders the sprite into the element immediately", () => {
    const el = document.createElement("div");
    const dogEl = document.createElement("div");
    document.body.appendChild(el);
    document.body.appendChild(dogEl);
    mockRect(el, 0, 0);
    mockRect(dogEl, 500, 0);
    wireCat(el, dogEl);
    expect(el.querySelector("svg")).not.toBeNull();
  });

  it("moves toward the dog's current position over successive ticks, without reaching/overlapping it", () => {
    const el = document.createElement("div");
    const dogEl = document.createElement("div");
    document.body.appendChild(el);
    document.body.appendChild(dogEl);
    mockRect(el, 0, 0);
    mockRect(dogEl, 500, 0);

    wireCat(el, dogEl, 50);
    const startLeft = parseFloat(el.style.left);

    vi.advanceTimersByTime(50 * 20); // 20 ticks

    const afterLeft = parseFloat(el.style.left);
    expect(afterLeft).toBeGreaterThan(startLeft);
    expect(afterLeft).toBeLessThan(500 - 90 + 1e-6); // still holding the follow distance back
  });

  it("faces right (scaleX(1)) when the dog is ahead to the right", () => {
    const el = document.createElement("div");
    const dogEl = document.createElement("div");
    document.body.appendChild(el);
    document.body.appendChild(dogEl);
    mockRect(el, 0, 0);
    mockRect(dogEl, 500, 0);

    wireCat(el, dogEl, 50);
    expect(el.style.transform).toBe("scaleX(1)");
  });

  it("flips to face left (scaleX(-1)) once the dog ends up behind it", () => {
    const el = document.createElement("div");
    const dogEl = document.createElement("div");
    document.body.appendChild(el);
    document.body.appendChild(dogEl);
    mockRect(el, 500, 0);
    mockRect(dogEl, 0, 0);

    wireCat(el, dogEl, 50);
    expect(el.style.transform).toBe("scaleX(-1)");

    // Dog crosses back past the cat - the cat must turn around to follow.
    mockRect(dogEl, 1000, 0);
    vi.advanceTimersByTime(50);
    expect(el.style.transform).toBe("scaleX(1)");
  });

  it("dragging pauses the chase, and releasing resumes it from the drop point", () => {
    const el = document.createElement("div");
    const dogEl = document.createElement("div");
    document.body.appendChild(el);
    document.body.appendChild(dogEl);
    mockRect(el, 0, 0);
    mockRect(dogEl, 1000, 0); // far away - would keep closing the gap every tick if not paused
    // jsdom doesn't implement setPointerCapture/releasePointerCapture - stub
    // them, same accommodation mascot.test.ts/creeper.test.ts already need.
    (el as unknown as { setPointerCapture: () => void }).setPointerCapture = () => {};
    (el as unknown as { releasePointerCapture: () => void }).releasePointerCapture = () => {};

    wireCat(el, dogEl, 50);

    el.dispatchEvent(new PointerEvent("pointerdown", { clientX: 10, clientY: 10, pointerId: 1 }));
    el.dispatchEvent(new PointerEvent("pointermove", { clientX: 60, clientY: 40, pointerId: 1 }));
    expect(el.style.left).toBe("50px");
    expect(el.style.top).toBe("30px");

    // Ticks fire while dragging but must not move the cat - the drag owns
    // position until release.
    vi.advanceTimersByTime(50 * 5);
    expect(el.style.left).toBe("50px");
    expect(el.style.top).toBe("30px");

    el.dispatchEvent(new PointerEvent("pointerup", { clientX: 60, clientY: 40, pointerId: 1 }));
    expect(el.classList.contains("hk-cat-dragging")).toBe(false);

    // Chase resumes from the drop point, not from the pre-drag position.
    vi.advanceTimersByTime(50);
    const afterLeft = parseFloat(el.style.left);
    expect(afterLeft).toBeGreaterThan(50);
  });

  it("returns a stop function that halts further movement", () => {
    const el = document.createElement("div");
    const dogEl = document.createElement("div");
    document.body.appendChild(el);
    document.body.appendChild(dogEl);
    mockRect(el, 0, 0);
    mockRect(dogEl, 500, 0);

    const stop = wireCat(el, dogEl, 50);
    vi.advanceTimersByTime(50 * 5);
    const posAtStop = el.style.left;
    stop();
    vi.advanceTimersByTime(50 * 20);
    expect(el.style.left).toBe(posAtStop);
  });
});
