/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadSpeed,
  saveSpeed,
  applySpeed,
  loadFireworkColorCount,
  saveFireworkColorCount,
  renderScenePanel,
  wireScenePanel,
  type SceneCardEntry,
} from "./scene-panel.js";

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
});
