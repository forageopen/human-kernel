/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import {
  loadCurrent,
  saveCurrent,
  renderCognitiveCurrentsCard,
  wireCognitiveCurrentsCard,
  loadActivityLog,
  renderUnplannedActivityCard,
  wireUnplannedActivityCard,
} from "./cognitive-currents.js";

describe("loadCurrent / saveCurrent", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to mind-work when nothing is stored", () => {
    expect(loadCurrent()).toBe("mind");
  });

  it("round-trips a saved current", () => {
    saveCurrent("hand");
    expect(loadCurrent()).toBe("hand");
    saveCurrent("mind");
    expect(loadCurrent()).toBe("mind");
  });
});

describe("Cognitive Currents card", () => {
  beforeEach(() => localStorage.clear());

  it("renders both currents with their real descriptions, and the cue explanation", () => {
    const { root } = renderCognitiveCurrentsCard();
    expect(root.textContent).toContain("Mind-work");
    expect(root.textContent).toContain("Hand-work");
    expect(root.textContent).toMatch(/screen-based, analytical/i);
    expect(root.textContent).toMatch(/muscle-memory, procedural/i);
    expect(root.textContent).toMatch(/the cue/i);
  });

  it("marks the persisted current as active on wiring, and clicking the other one switches it", () => {
    saveCurrent("mind");
    const { mindBtn, handBtn } = renderCognitiveCurrentsCard();
    wireCognitiveCurrentsCard(mindBtn, handBtn);
    expect(mindBtn.classList.contains("active")).toBe(true);
    expect(handBtn.classList.contains("active")).toBe(false);

    handBtn.dispatchEvent(new Event("click", { bubbles: true }));
    expect(handBtn.classList.contains("active")).toBe(true);
    expect(mindBtn.classList.contains("active")).toBe(false);
    expect(loadCurrent()).toBe("hand");
  });
});

describe("Unplanned Activity Check card", () => {
  beforeEach(() => localStorage.clear());

  it("renders the 3 real questions from the source document", () => {
    const { root } = renderUnplannedActivityCard();
    expect(root.querySelectorAll(".hk-activity-check-row").length).toBe(3);
    expect(root.textContent).toMatch(/cognitive mode of the hour/i);
    expect(root.textContent).toMatch(/own momentum/i);
    expect(root.textContent).toMatch(/without you noticing the effort/i);
  });

  it("shows no verdict until at least one box is checked, a partial verdict for 1-2, and a positive verdict for all 3", () => {
    const { checkboxes, noteInput, logBtn, verdict, list } = renderUnplannedActivityCard();
    wireUnplannedActivityCard(checkboxes, noteInput, logBtn, verdict, list);
    expect(verdict.textContent).toBe("");

    checkboxes[0]!.checked = true;
    checkboxes[0]!.dispatchEvent(new Event("change", { bubbles: true }));
    expect(verdict.textContent).toMatch(/not all three/i);

    checkboxes[1]!.checked = true;
    checkboxes[1]!.dispatchEvent(new Event("change", { bubbles: true }));
    checkboxes[2]!.checked = true;
    checkboxes[2]!.dispatchEvent(new Event("change", { bubbles: true }));
    expect(verdict.textContent).toMatch(/belongs in that window/i);
  });

  it("logging an entry persists it, clears the form, and shows it in the list - most recent first", () => {
    const { root, checkboxes, noteInput, logBtn, verdict, list } = renderUnplannedActivityCard();
    wireUnplannedActivityCard(checkboxes, noteInput, logBtn, verdict, list);

    noteInput.value = "3am conversation";
    for (const cb of checkboxes) {
      cb.checked = true;
      cb.dispatchEvent(new Event("change", { bubbles: true }));
    }
    logBtn.dispatchEvent(new Event("click", { bubbles: true }));

    expect(noteInput.value).toBe("");
    expect(checkboxes.every((cb) => !cb.checked)).toBe(true);
    expect(loadActivityLog().length).toBe(1);
    expect(loadActivityLog()[0]?.matchesCue).toBe(true);
    expect(root.textContent).toContain("3am conversation");

    noteInput.value = "unremarkable errand";
    logBtn.dispatchEvent(new Event("click", { bubbles: true }));
    const entries = loadActivityLog();
    expect(entries.length).toBe(2);
    expect(entries[1]?.matchesCue).toBe(false);

    const rows = list.querySelectorAll(".hk-activity-entry");
    expect(rows[0]?.textContent).toContain("unremarkable errand"); // most recent first
  });

  it("does nothing when Log is clicked with an empty note", () => {
    const { checkboxes, noteInput, logBtn, verdict, list } = renderUnplannedActivityCard();
    wireUnplannedActivityCard(checkboxes, noteInput, logBtn, verdict, list);
    logBtn.dispatchEvent(new Event("click", { bubbles: true }));
    expect(loadActivityLog().length).toBe(0);
  });
});
