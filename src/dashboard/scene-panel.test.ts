/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadSpeed,
  saveSpeed,
  applySpeed,
  loadFireworkColorCount,
  saveFireworkColorCount,
  loadCardOrder,
  saveCardOrder,
  applyStoredOrder,
  renderScenePanel,
  wireScenePanel,
  type SceneCardEntry,
} from "./scene-panel.js";

// jsdom doesn't implement PointerEvent at all (a documented gap - see
// mascot.test.ts/draggable's own drag tests for the same shim). Polyfill
// just enough of it - MouseEvent's clientX/clientY - for the row-reorder
// drag simulation below. Chromium (this app's actual target, per ADR-0003)
// implements PointerEvent natively; this shim only exists for the test run.
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

function makeEntry(id: string, label: string, initiallyVisible = true): SceneCardEntry & { _visible: boolean } {
  const entry = {
    id,
    label,
    _visible: initiallyVisible,
    isVisible(): boolean {
      return entry._visible;
    },
    setVisible(v: boolean): void {
      entry._visible = v;
    },
  };
  return entry;
}

describe("loadSpeed / saveSpeed", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to 1 when nothing is stored", () => {
    expect(loadSpeed()).toBe(1);
  });

  it("round-trips a saved speed", () => {
    saveSpeed(2.5);
    expect(loadSpeed()).toBe(2.5);
  });

  it("falls back to the default for garbage or non-positive stored values", () => {
    localStorage.setItem("hk-scene-speed", "not-a-number");
    expect(loadSpeed()).toBe(1);
    localStorage.setItem("hk-scene-speed", "-3");
    expect(loadSpeed()).toBe(1);
  });
});

describe("applySpeed", () => {
  it("writes --hk-speed onto the document root", () => {
    applySpeed(1.75);
    expect(document.documentElement.style.getPropertyValue("--hk-speed")).toBe("1.75");
  });
});

describe("loadFireworkColorCount / saveFireworkColorCount", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to 8 when nothing is stored", () => {
    expect(loadFireworkColorCount()).toBe(8);
  });

  it("round-trips a saved count", () => {
    saveFireworkColorCount(16);
    expect(loadFireworkColorCount()).toBe(16);
  });

  it("falls back to the default for out-of-range or garbage stored values", () => {
    localStorage.setItem("hk-scene-firework-colors", "0");
    expect(loadFireworkColorCount()).toBe(8);
    localStorage.setItem("hk-scene-firework-colors", "30");
    expect(loadFireworkColorCount()).toBe(8);
    localStorage.setItem("hk-scene-firework-colors", "not-a-number");
    expect(loadFireworkColorCount()).toBe(8);
  });
});

describe("loadCardOrder / saveCardOrder", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when nothing has been saved", () => {
    expect(loadCardOrder()).toBeNull();
  });

  it("round-trips a saved order", () => {
    saveCardOrder(["b", "a", "c"]);
    expect(loadCardOrder()).toEqual(["b", "a", "c"]);
  });

  it("returns null for garbage stored JSON or a non-string-array shape", () => {
    localStorage.setItem("hk-scene-card-order", "not json");
    expect(loadCardOrder()).toBeNull();
    localStorage.setItem("hk-scene-card-order", JSON.stringify([1, 2, 3]));
    expect(loadCardOrder()).toBeNull();
  });
});

describe("applyStoredOrder", () => {
  beforeEach(() => localStorage.clear());

  it("returns entries unchanged when nothing has been saved", () => {
    const entries = [makeEntry("a", "A"), makeEntry("b", "B")];
    expect(applyStoredOrder(entries)).toEqual(entries);
  });

  it("reorders entries to match a saved order", () => {
    const a = makeEntry("a", "A");
    const b = makeEntry("b", "B");
    const c = makeEntry("c", "C");
    saveCardOrder(["c", "a", "b"]);
    expect(applyStoredOrder([a, b, c]).map((e) => e.id)).toEqual(["c", "a", "b"]);
  });

  it("appends entries with no saved position after everything that has one, in their original relative order", () => {
    const a = makeEntry("a", "A");
    const b = makeEntry("b", "B");
    const c = makeEntry("c", "C"); // never saved - e.g. a card added since
    saveCardOrder(["b", "a"]);
    expect(applyStoredOrder([a, b, c]).map((e) => e.id)).toEqual(["b", "a", "c"]);
  });

  it("silently ignores saved IDs that no longer match any current entry", () => {
    const a = makeEntry("a", "A");
    const b = makeEntry("b", "B");
    saveCardOrder(["ghost", "b", "a"]);
    expect(applyStoredOrder([a, b]).map((e) => e.id)).toEqual(["b", "a"]);
  });
});

describe("renderScenePanel", () => {
  it("builds one toggle row per card entry, plus both sliders and an edge tab", () => {
    const entries = [makeEntry("heatmap", "Activity"), makeEntry("prayer", "Prayer Times")];
    const { root, tab, toggleInputs, speedSlider, fireworkSlider } = renderScenePanel(entries);

    expect(root.classList.contains("hk-scene-panel")).toBe(true);
    expect(tab.tagName).toBe("BUTTON");
    expect(toggleInputs.size).toBe(2);
    expect(root.querySelectorAll(".hk-scene-card-row").length).toBe(2);
    expect(speedSlider.type).toBe("range");
    expect(fireworkSlider.type).toBe("range");
    expect(fireworkSlider.min).toBe("1");
    expect(fireworkSlider.max).toBe("24");
    expect(root.textContent).toContain("Activity");
    expect(root.textContent).toContain("Prayer Times");
  });

  it("includes an empty footer slot inside the panel, for the quote widget to be appended into", () => {
    const { root, footer } = renderScenePanel([]);
    expect(root.contains(footer)).toBe(true);
    expect(footer.classList.contains("hk-scene-panel-footer")).toBe(true);
    expect(footer.children.length).toBe(0);
  });

  it("gives each row a drag grip and returns a rowElements map matching toggleInputs", () => {
    const entries = [makeEntry("heatmap", "Activity"), makeEntry("prayer", "Prayer Times")];
    const { list, rowElements } = renderScenePanel(entries);

    expect(rowElements.size).toBe(2);
    expect(list.contains(rowElements.get("heatmap")!)).toBe(true);
    expect(rowElements.get("heatmap")!.querySelector(".hk-scene-row-grip")).not.toBeNull();
    expect(rowElements.get("heatmap")!.dataset.widgetId).toBe("heatmap");
  });

  it("renders rows in a previously-saved order rather than the entries array's own order", () => {
    localStorage.clear();
    saveCardOrder(["prayer", "heatmap"]);
    const entries = [makeEntry("heatmap", "Activity"), makeEntry("prayer", "Prayer Times")];
    const { list } = renderScenePanel(entries);

    const idsInDomOrder = Array.from(list.querySelectorAll<HTMLElement>(".hk-scene-card-row")).map(
      (r) => r.dataset.widgetId
    );
    expect(idsInDomOrder).toEqual(["prayer", "heatmap"]);
    localStorage.clear();
  });
});

describe("wireScenePanel", () => {
  beforeEach(() => localStorage.clear());

  it("initializes each toggle to the card's real current visibility", () => {
    const entries = [makeEntry("a", "A", true), makeEntry("b", "B", false)];
    const { root, tab, toggleInputs, speedSlider } = renderScenePanel(entries);
    wireScenePanel(root, tab, toggleInputs, speedSlider, entries);

    expect(toggleInputs.get("a")?.checked).toBe(true);
    expect(toggleInputs.get("b")?.checked).toBe(false);
  });

  it("toggling a checkbox calls the entry's setVisible", () => {
    const entries = [makeEntry("a", "A", true)];
    const { root, tab, toggleInputs, speedSlider } = renderScenePanel(entries);
    wireScenePanel(root, tab, toggleInputs, speedSlider, entries);

    const input = toggleInputs.get("a")!;
    input.checked = false;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    expect(entries[0]!._visible).toBe(false);
  });

  it("clicking the tab toggles the .open class", () => {
    const entries = [makeEntry("a", "A")];
    const { root, tab, toggleInputs, speedSlider } = renderScenePanel(entries);
    wireScenePanel(root, tab, toggleInputs, speedSlider, entries);

    expect(root.classList.contains("open")).toBe(false);
    tab.dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.classList.contains("open")).toBe(true);
    tab.dispatchEvent(new Event("click", { bubbles: true }));
    expect(root.classList.contains("open")).toBe(false);
  });

  it("re-syncs toggles to the real state whenever the panel is (re-)entered, since a card's own close button can change visibility independently", () => {
    const entries = [makeEntry("a", "A", true)];
    const { root, tab, toggleInputs, speedSlider } = renderScenePanel(entries);
    wireScenePanel(root, tab, toggleInputs, speedSlider, entries);

    // Card gets closed via its own close button, bypassing the panel entirely.
    entries[0]!.setVisible(false);
    expect(toggleInputs.get("a")?.checked).toBe(true); // stale until re-sync

    root.dispatchEvent(new MouseEvent("mouseenter"));
    expect(toggleInputs.get("a")?.checked).toBe(false);
  });

  it("restores a persisted speed onto the slider and re-applies it as --hk-speed", () => {
    saveSpeed(2);
    const entries: SceneCardEntry[] = [];
    const { root, tab, toggleInputs, speedSlider } = renderScenePanel(entries);
    wireScenePanel(root, tab, toggleInputs, speedSlider, entries);

    expect(speedSlider.value).toBe("2");
    expect(document.documentElement.style.getPropertyValue("--hk-speed")).toBe("2");
  });

  it("moving the slider applies and persists the new speed", () => {
    const entries: SceneCardEntry[] = [];
    const { root, tab, toggleInputs, speedSlider } = renderScenePanel(entries);
    wireScenePanel(root, tab, toggleInputs, speedSlider, entries);

    speedSlider.value = "0.5";
    speedSlider.dispatchEvent(new Event("input", { bubbles: true }));

    expect(document.documentElement.style.getPropertyValue("--hk-speed")).toBe("0.5");
    expect(loadSpeed()).toBe(0.5);
  });

  it("restores a persisted firework color count onto its slider and reports it once via the callback", () => {
    saveFireworkColorCount(16);
    const entries: SceneCardEntry[] = [];
    const { root, tab, toggleInputs, speedSlider, fireworkSlider } = renderScenePanel(entries);
    let reported: number | undefined;
    wireScenePanel(root, tab, toggleInputs, speedSlider, entries, fireworkSlider, (n) => {
      reported = n;
    });

    expect(fireworkSlider.value).toBe("16");
    expect(reported).toBe(16);
  });

  it("moving the firework slider persists the new count and reports it via the callback", () => {
    const entries: SceneCardEntry[] = [];
    const { root, tab, toggleInputs, speedSlider, fireworkSlider } = renderScenePanel(entries);
    const reports: number[] = [];
    wireScenePanel(root, tab, toggleInputs, speedSlider, entries, fireworkSlider, (n) => reports.push(n));

    fireworkSlider.value = "3";
    fireworkSlider.dispatchEvent(new Event("input", { bubbles: true }));

    expect(loadFireworkColorCount()).toBe(3);
    expect(reports).toContain(3);
  });

  it("works without a firework slider/callback at all - the parameters are optional", () => {
    const entries: SceneCardEntry[] = [];
    const { root, tab, toggleInputs, speedSlider } = renderScenePanel(entries);
    expect(() => wireScenePanel(root, tab, toggleInputs, speedSlider, entries)).not.toThrow();
  });

  it("works without the reorder param at all - it's optional too", () => {
    const entries = [makeEntry("a", "A")];
    const { root, tab, toggleInputs, speedSlider } = renderScenePanel(entries);
    expect(() => wireScenePanel(root, tab, toggleInputs, speedSlider, entries)).not.toThrow();
  });

  it("dragging a row's grip past a sibling's midpoint reorders the DOM and persists the new order", () => {
    localStorage.clear();
    document.body.innerHTML = "";
    const entries = [makeEntry("a", "A"), makeEntry("b", "B"), makeEntry("c", "C")];
    const { root, tab, toggleInputs, speedSlider, list, rowElements } = renderScenePanel(entries);
    document.body.appendChild(root); // getBoundingClientRect needs real layout attachment in jsdom
    wireScenePanel(root, tab, toggleInputs, speedSlider, entries, undefined, undefined, { list, rowElements });

    const rowA = rowElements.get("a")!;
    const rowC = rowElements.get("c")!;
    // jsdom never actually lays elements out (every rect is 0x0 at 0,0), so
    // stub getBoundingClientRect to simulate A, B, C stacked top to bottom.
    const rects: Record<string, DOMRect> = {
      a: { top: 0, height: 30 } as DOMRect,
      b: { top: 30, height: 30 } as DOMRect,
      c: { top: 60, height: 30 } as DOMRect,
    };
    for (const [id, row] of rowElements) {
      row.getBoundingClientRect = () => rects[id]!;
    }

    const grip = rowA.querySelector<HTMLElement>(".hk-scene-row-grip")!;
    grip.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    // Drag row A down past row C's midpoint (60 + 15 = 75).
    document.dispatchEvent(new PointerEvent("pointermove", { clientY: 80 }));
    document.dispatchEvent(new PointerEvent("pointerup"));

    const finalOrder = Array.from(list.querySelectorAll<HTMLElement>(".hk-scene-card-row")).map(
      (r) => r.dataset.widgetId
    );
    expect(finalOrder).toEqual(["b", "c", "a"]);
    expect(loadCardOrder()).toEqual(["b", "c", "a"]);
    expect(rowC).not.toBeNull(); // sanity: row C is still the same element, just reordered around
    localStorage.clear();
  });

  it("clicking a row's grip does not toggle that row's checkbox (label-forwarding is suppressed)", () => {
    const entries = [makeEntry("a", "A", false)];
    const { root, tab, toggleInputs, speedSlider, list, rowElements } = renderScenePanel(entries);
    wireScenePanel(root, tab, toggleInputs, speedSlider, entries, undefined, undefined, { list, rowElements });

    const grip = rowElements.get("a")!.querySelector<HTMLElement>(".hk-scene-row-grip")!;
    const clickEvent = new Event("click", { bubbles: true, cancelable: true });
    grip.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(toggleInputs.get("a")!.checked).toBe(false); // unchanged - the click never reached the checkbox
  });
});
