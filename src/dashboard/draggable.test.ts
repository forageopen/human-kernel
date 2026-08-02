/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { loadRect, saveRect, applyStoredRect, makeDraggable } from "./draggable.js";

describe("loadRect / saveRect", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when nothing has been saved for this id", () => {
    expect(loadRect("widget-a")).toBeNull();
  });

  it("round-trips a saved rect", () => {
    saveRect("widget-a", { left: 10, top: 20, width: 300, height: 200 });
    expect(loadRect("widget-a")).toEqual({ left: 10, top: 20, width: 300, height: 200 });
  });

  it("stores rects independently per id", () => {
    saveRect("widget-a", { left: 1, top: 1, width: 1, height: 1 });
    saveRect("widget-b", { left: 2, top: 2, width: 2, height: 2 });
    expect(loadRect("widget-a")?.left).toBe(1);
    expect(loadRect("widget-b")?.left).toBe(2);
  });
});

describe("applyStoredRect", () => {
  beforeEach(() => localStorage.clear());

  it("returns false and leaves the element untouched when nothing is stored", () => {
    const el = document.createElement("div");
    expect(applyStoredRect(el, "widget-a")).toBe(false);
    expect(el.style.left).toBe("");
  });

  it("applies a stored rect as inline styles and returns true", () => {
    saveRect("widget-a", { left: 40, top: 50, width: 320, height: 240 });
    const el = document.createElement("div");
    expect(applyStoredRect(el, "widget-a")).toBe(true);
    expect(el.style.left).toBe("40px");
    expect(el.style.top).toBe("50px");
    expect(el.style.width).toBe("320px");
    expect(el.style.height).toBe("240px");
  });
});

describe("makeDraggable", () => {
  beforeEach(() => localStorage.clear());

  it("wires up without throwing, even without real layout (jsdom)", () => {
    const canvas = document.createElement("div");
    const el = document.createElement("div");
    const handle = document.createElement("div");
    el.appendChild(handle);
    canvas.appendChild(el);
    document.body.appendChild(canvas);

    expect(() => makeDraggable(el, handle, canvas, "widget-a")).not.toThrow();
  });

  it("applies any previously-stored rect immediately on wiring", () => {
    saveRect("widget-a", { left: 15, top: 25, width: 200, height: 150 });
    const canvas = document.createElement("div");
    const el = document.createElement("div");
    const handle = document.createElement("div");
    el.appendChild(handle);
    canvas.appendChild(el);

    makeDraggable(el, handle, canvas, "widget-a");
    expect(el.style.left).toBe("15px");
  });
});
