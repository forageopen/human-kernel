/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderSupplementCard, wireSupplementCard, resyncSupplementCardCheckbox } from "./supplement-card.js";
import { loadSupplementTime, loadTakenOn, saveTakenOn, currentKlDateKey, type Supplement } from "./supplements.js";

const CREATINE: Supplement = { id: "creatine", name: "Creatine Monohydrate" };

describe("renderSupplementCard", () => {
  it("builds a time input, a checkbox, and the no-suggested-schedule note - nothing else", () => {
    const { root, timeInput, checkbox } = renderSupplementCard();
    expect(timeInput.type).toBe("time");
    expect(checkbox.type).toBe("checkbox");
    expect(root.querySelector(".hk-supplement-note")?.textContent).toBe("You choose the time. No suggested schedule.");
    // Explicitly nothing else on the card - no slider, no drag handle of its
    // own, no status/graph elements (Phase 0 scope).
    expect(root.querySelector("input[type=range]")).toBeNull();
    expect(root.querySelectorAll("input").length).toBe(2);
  });
});

describe("wireSupplementCard", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  it("starts with a blank time - no suggested default", () => {
    const elements = renderSupplementCard();
    wireSupplementCard(CREATINE, elements);
    expect(elements.timeInput.value).toBe("");
  });

  it("restores a previously-saved time", () => {
    const elements1 = renderSupplementCard();
    wireSupplementCard(CREATINE, elements1);
    elements1.timeInput.value = "07:30";
    elements1.timeInput.dispatchEvent(new Event("change", { bubbles: true }));

    const elements2 = renderSupplementCard();
    wireSupplementCard(CREATINE, elements2);
    expect(elements2.timeInput.value).toBe("07:30");
  });

  it("persists a time change via loadSupplementTime", () => {
    const elements = renderSupplementCard();
    wireSupplementCard(CREATINE, elements);
    elements.timeInput.value = "21:15";
    elements.timeInput.dispatchEvent(new Event("change", { bubbles: true }));
    expect(loadSupplementTime("creatine")).toBe("21:15");
  });

  it("starts unchecked when nothing has been taken today", () => {
    const elements = renderSupplementCard();
    wireSupplementCard(CREATINE, elements);
    expect(elements.checkbox.checked).toBe(false);
  });

  it("restores today's already-checked state", () => {
    saveTakenOn("creatine", currentKlDateKey(new Date()), true);
    const elements = renderSupplementCard();
    wireSupplementCard(CREATINE, elements);
    expect(elements.checkbox.checked).toBe(true);
  });

  it("checking the box persists it for today's real KL date key", () => {
    const elements = renderSupplementCard();
    wireSupplementCard(CREATINE, elements);
    elements.checkbox.checked = true;
    elements.checkbox.dispatchEvent(new Event("change", { bubbles: true }));
    expect(loadTakenOn("creatine", currentKlDateKey(new Date()))).toBe(true);
  });
});

describe("resyncSupplementCardCheckbox", () => {
  beforeEach(() => localStorage.clear());

  it("resets a stale checked box to unchecked for a new day that has no saved data yet", () => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true; // simulate yesterday's stale on-screen state
    resyncSupplementCardCheckbox(CREATINE, checkbox, "2026-08-04");
    expect(checkbox.checked).toBe(false);
  });

  it("applies the real saved state for the given date key", () => {
    saveTakenOn("creatine", "2026-08-04", true);
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = false;
    resyncSupplementCardCheckbox(CREATINE, checkbox, "2026-08-04");
    expect(checkbox.checked).toBe(true);
  });
});
