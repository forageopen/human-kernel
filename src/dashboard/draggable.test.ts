/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { loadRect, saveRect, applyStoredRect, makeDraggable, loadVisible, saveVisible, createWidget } from "./draggable.js";

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

describe("loadVisible / saveVisible", () => {
  beforeEach(() => localStorage.clear());

  it("falls back to the given default when nothing has been saved", () => {
    expect(loadVisible("card-a", true)).toBe(true);
    expect(loadVisible("card-a", false)).toBe(false);
  });

  it("round-trips a saved value regardless of the default passed in", () => {
    saveVisible("card-a", false);
    expect(loadVisible("card-a", true)).toBe(false);
    saveVisible("card-a", true);
    expect(loadVisible("card-a", false)).toBe(true);
  });
});

describe("createWidget", () => {
  beforeEach(() => localStorage.clear());

  it("builds a card with a label, a drag grip, and a close control", () => {
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-a", "Card A", { defaultRect: { left: 0, top: 0, width: 200, height: 150 } });

    expect(w.root.querySelector(".hk-label")?.textContent).toBe("Card A");
    expect(w.root.querySelector(".hk-widget-grip")).not.toBeNull();
    const closeBtn = w.root.querySelector<HTMLElement>(".hk-widget-close");
    expect(closeBtn).not.toBeNull();
    expect(closeBtn?.tabIndex).toBe(0);
    expect(closeBtn?.getAttribute("role")).toBe("button");
  });

  it("is visible by default, and the close control hides it without removing it from the DOM", () => {
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-b", "Card B", { defaultRect: { left: 0, top: 0, width: 200, height: 150 } });

    expect(w.isVisible()).toBe(true);
    w.root.querySelector<HTMLElement>(".hk-widget-close")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(w.isVisible()).toBe(false);
    expect(w.root.isConnected).toBe(true);
    expect(loadVisible("card-b", true)).toBe(false);
  });

  it("respects defaultVisible: false for a widget nobody has enabled yet", () => {
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-c", "Card C", {
      defaultRect: { left: 0, top: 0, width: 200, height: 150 },
      defaultVisible: false,
    });
    expect(w.isVisible()).toBe(false);
  });

  it("setVisible(true) re-shows a previously closed widget and persists it", () => {
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-d", "Card D", { defaultRect: { left: 0, top: 0, width: 200, height: 150 } });
    w.setVisible(false);
    w.setVisible(true);
    expect(w.isVisible()).toBe(true);
    expect(loadVisible("card-d", false)).toBe(true);
  });

  it("a pointerdown on the close button does not bubble into the drag handle", () => {
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-e", "Card E", { defaultRect: { left: 0, top: 0, width: 200, height: 150 } });
    const handle = w.root.querySelector<HTMLElement>(".hk-widget-handle")!;
    let bubbledToHandle = false;
    handle.addEventListener("pointerdown", () => {
      bubbledToHandle = true;
    });
    w.root.querySelector<HTMLElement>(".hk-widget-close")?.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(bubbledToHandle).toBe(false);
  });
});
