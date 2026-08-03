/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadRect,
  saveRect,
  applyStoredRect,
  makeDraggable,
  loadVisible,
  saveVisible,
  loadTitle,
  saveTitle,
  createWidget,
} from "./draggable.js";

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

describe("loadTitle / saveTitle", () => {
  beforeEach(() => localStorage.clear());

  it("falls back to the given default when nothing has been saved", () => {
    expect(loadTitle("note-1", "Notes")).toBe("Notes");
  });

  it("round-trips a saved title", () => {
    saveTitle("note-1", "Grocery list");
    expect(loadTitle("note-1", "Notes")).toBe("Grocery list");
  });

  it("falls back to the default for a blank saved title, never returning empty", () => {
    saveTitle("note-1", "   ");
    expect(loadTitle("note-1", "Notes")).toBe("Notes");
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

  it("getTitle() matches title, and neither changes, when editableTitle is not enabled", () => {
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-f", "Fixed Title", { defaultRect: { left: 0, top: 0, width: 200, height: 150 } });
    expect(w.title).toBe("Fixed Title");
    expect(w.getTitle()).toBe("Fixed Title");
    expect(w.root.querySelector(".hk-label")?.getAttribute("contenteditable")).not.toBe("true");
  });

  it("editableTitle: restores a previously-saved custom title instead of the passed-in default", () => {
    saveTitle("card-g", "My renamed card");
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-g", "Notes", {
      defaultRect: { left: 0, top: 0, width: 200, height: 150 },
      editableTitle: true,
    });
    expect(w.title).toBe("My renamed card");
    expect(w.getTitle()).toBe("My renamed card");
  });

  it("editableTitle: clicking the label, editing it, and blurring commits and persists the new title", () => {
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-h", "Notes", {
      defaultRect: { left: 0, top: 0, width: 200, height: 150 },
      editableTitle: true,
    });
    const label = w.root.querySelector<HTMLElement>(".hk-label")!;

    label.dispatchEvent(new Event("click", { bubbles: true }));
    expect(label.contentEditable).toBe("true");

    label.textContent = "Grocery list";
    label.dispatchEvent(new Event("blur"));

    expect(label.contentEditable).toBe("false");
    expect(label.textContent).toBe("Grocery list");
    expect(w.getTitle()).toBe("Grocery list");
    expect(loadTitle("card-h", "Notes")).toBe("Grocery list");
  });

  it("editableTitle: Enter commits, Escape cancels back to the last committed title", () => {
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-i", "Notes", {
      defaultRect: { left: 0, top: 0, width: 200, height: 150 },
      editableTitle: true,
    });
    const label = w.root.querySelector<HTMLElement>(".hk-label")!;

    label.dispatchEvent(new Event("click", { bubbles: true }));
    label.textContent = "First rename";
    label.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(w.getTitle()).toBe("First rename");

    label.dispatchEvent(new Event("click", { bubbles: true }));
    label.textContent = "Abandoned edit";
    label.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(w.getTitle()).toBe("First rename");
    expect(label.textContent).toBe("First rename");
  });

  it("editableTitle: clearing the title entirely falls back to the original default rather than saving blank", () => {
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-j", "Notes 3", {
      defaultRect: { left: 0, top: 0, width: 200, height: 150 },
      editableTitle: true,
    });
    const label = w.root.querySelector<HTMLElement>(".hk-label")!;

    label.dispatchEvent(new Event("click", { bubbles: true }));
    label.textContent = "   ";
    label.dispatchEvent(new Event("blur"));

    expect(w.getTitle()).toBe("Notes 3");
    expect(label.textContent).toBe("Notes 3");
  });

  it("editableTitle: a pointerdown on the label does not bubble into the drag handle", () => {
    const canvas = document.createElement("div");
    document.body.appendChild(canvas);
    const w = createWidget(canvas, "card-k", "Notes", {
      defaultRect: { left: 0, top: 0, width: 200, height: 150 },
      editableTitle: true,
    });
    const handle = w.root.querySelector<HTMLElement>(".hk-widget-handle")!;
    const label = w.root.querySelector<HTMLElement>(".hk-label")!;
    let bubbledToHandle = false;
    handle.addEventListener("pointerdown", () => {
      bubbledToHandle = true;
    });
    label.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(bubbledToHandle).toBe(false);
  });
});
