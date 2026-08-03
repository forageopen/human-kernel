/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  renderSupplementCard,
  wireSupplementCard,
  resyncSupplementCardCheckbox,
  renderAcuteSupplementCard,
  wireAcuteSupplementCard,
  resyncAcuteSupplementCard,
} from "./supplement-card.js";
import {
  loadSupplementTime,
  loadTakenOn,
  saveTakenOn,
  currentKlDateKey,
  loadEffectDurationMinutes,
  saveStartedAt,
  type Supplement,
} from "./supplements.js";

const CREATINE: Supplement = {
  id: "creatine",
  name: "Creatine Monohydrate",
  info: "Saturates with consistent use - a continuous daily baseline, not a per-dose window.",
  effectProfile: "baseline",
};

describe("renderSupplementCard", () => {
  it("builds an info line, a time input, a checkbox, and the no-suggested-schedule note - nothing else", () => {
    const { root, timeInput, checkbox } = renderSupplementCard(CREATINE);
    expect(timeInput.type).toBe("time");
    expect(checkbox.type).toBe("checkbox");
    expect(root.querySelector(".hk-supplement-info")?.textContent).toBe(CREATINE.info);
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
    const elements = renderSupplementCard(CREATINE);
    wireSupplementCard(CREATINE, elements);
    expect(elements.timeInput.value).toBe("");
  });

  it("restores a previously-saved time", () => {
    const elements1 = renderSupplementCard(CREATINE);
    wireSupplementCard(CREATINE, elements1);
    elements1.timeInput.value = "07:30";
    elements1.timeInput.dispatchEvent(new Event("change", { bubbles: true }));

    const elements2 = renderSupplementCard(CREATINE);
    wireSupplementCard(CREATINE, elements2);
    expect(elements2.timeInput.value).toBe("07:30");
  });

  it("persists a time change via loadSupplementTime", () => {
    const elements = renderSupplementCard(CREATINE);
    wireSupplementCard(CREATINE, elements);
    elements.timeInput.value = "21:15";
    elements.timeInput.dispatchEvent(new Event("change", { bubbles: true }));
    expect(loadSupplementTime("creatine")).toBe("21:15");
  });

  it("starts unchecked when nothing has been taken today", () => {
    const elements = renderSupplementCard(CREATINE);
    wireSupplementCard(CREATINE, elements);
    expect(elements.checkbox.checked).toBe(false);
  });

  it("restores today's already-checked state", () => {
    saveTakenOn("creatine", currentKlDateKey(new Date()), true);
    const elements = renderSupplementCard(CREATINE);
    wireSupplementCard(CREATINE, elements);
    expect(elements.checkbox.checked).toBe(true);
  });

  it("checking the box persists it for today's real KL date key", () => {
    const elements = renderSupplementCard(CREATINE);
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

const L_THEANINE: Supplement = {
  id: "l-theanine",
  name: "L-Theanine",
  info: "Acute, single-dose effect - commonly described as winding down within a few hours.",
  effectProfile: "acute",
  recommendedDurationMinutes: 150,
};

describe("renderAcuteSupplementCard", () => {
  it("builds an info line, a numeric duration input, a countdown display, and Start/Cancel buttons - no time input or checkbox", () => {
    const { root, durationInput, countdownEl, startButton, cancelButton } = renderAcuteSupplementCard(L_THEANINE);
    expect(root.querySelector(".hk-supplement-info")?.textContent).toBe(L_THEANINE.info);
    expect(durationInput.type).toBe("number");
    expect(countdownEl.textContent).toBe("");
    expect(startButton.textContent).toBe("Start");
    expect(cancelButton.textContent).toBe("Cancel");
    expect(root.querySelector('input[type="time"]')).toBeNull();
    expect(root.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it("states the recommended duration in the note", () => {
    const { root } = renderAcuteSupplementCard(L_THEANINE);
    expect(root.querySelector(".hk-supplement-note")?.textContent).toContain("150 min");
  });
});

describe("wireAcuteSupplementCard / resyncAcuteSupplementCard", () => {
  beforeEach(() => localStorage.clear());

  it("starts not-running: duration pre-filled with the recommended default, Start visible, Cancel hidden", () => {
    const elements = renderAcuteSupplementCard(L_THEANINE);
    wireAcuteSupplementCard(L_THEANINE, elements);
    expect(elements.durationInput.value).toBe("150");
    expect(elements.startButton.hidden).toBe(false);
    expect(elements.cancelButton.hidden).toBe(true);
    expect(elements.countdownEl.textContent).toBe("");
  });

  it("editing the duration persists it via loadEffectDurationMinutes", () => {
    const elements = renderAcuteSupplementCard(L_THEANINE);
    wireAcuteSupplementCard(L_THEANINE, elements);
    elements.durationInput.value = "90";
    elements.durationInput.dispatchEvent(new Event("change", { bubbles: true }));
    expect(loadEffectDurationMinutes(L_THEANINE)).toBe(90);
  });

  it("pressing Start begins a countdown, swaps Start/Cancel, disables the duration input, and logs it taken today", () => {
    const elements = renderAcuteSupplementCard(L_THEANINE);
    wireAcuteSupplementCard(L_THEANINE, elements);
    elements.startButton.dispatchEvent(new Event("click", { bubbles: true }));

    expect(elements.startButton.hidden).toBe(true);
    expect(elements.cancelButton.hidden).toBe(false);
    expect(elements.durationInput.disabled).toBe(true);
    expect(elements.countdownEl.textContent).toContain("remaining");
    expect(loadTakenOn("l-theanine", currentKlDateKey(new Date()))).toBe(true);
  });

  it("pressing Cancel while running clears the countdown back to not-started", () => {
    const elements = renderAcuteSupplementCard(L_THEANINE);
    wireAcuteSupplementCard(L_THEANINE, elements);
    elements.startButton.dispatchEvent(new Event("click", { bubbles: true }));
    elements.cancelButton.dispatchEvent(new Event("click", { bubbles: true }));

    expect(elements.startButton.hidden).toBe(false);
    expect(elements.cancelButton.hidden).toBe(true);
    expect(elements.durationInput.disabled).toBe(false);
    expect(elements.countdownEl.textContent).toBe("");
  });

  it("shows the finished state once the duration has fully elapsed", () => {
    const elements = renderAcuteSupplementCard(L_THEANINE);
    wireAcuteSupplementCard(L_THEANINE, elements);
    saveStartedAt("l-theanine", Date.now() - 999 * 60_000); // started way in the past
    resyncAcuteSupplementCard(L_THEANINE, elements);

    expect(elements.countdownEl.textContent).toBe("Effect window ended");
    expect(elements.startButton.hidden).toBe(false); // ready to start the next dose
    expect(elements.cancelButton.hidden).toBe(true);
    expect(elements.durationInput.disabled).toBe(false);
  });

  it("restores a running countdown correctly on a fresh render (e.g. after navigating back to the tab)", () => {
    saveStartedAt("l-theanine", Date.now() - 10 * 60_000); // started 10 minutes ago
    const elements = renderAcuteSupplementCard(L_THEANINE);
    wireAcuteSupplementCard(L_THEANINE, elements);

    expect(elements.startButton.hidden).toBe(true);
    expect(elements.cancelButton.hidden).toBe(false);
    expect(elements.countdownEl.textContent).toBe("2h 20m remaining"); // 150 - 10 = 140min
  });
});
