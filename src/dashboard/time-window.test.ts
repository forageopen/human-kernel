/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { WINDOWS, currentWindow, renderTimeWindowCard, renderBestTimeForCard } from "./time-window.js";

describe("currentWindow", () => {
  it("picks Morning for 7am KL", () => {
    const now = new Date("2026-08-01T23:00:00.000Z"); // 7am Aug 2 in KL (UTC+8)
    expect(currentWindow(now).name).toBe("Morning");
  });

  it("picks Night for 10pm KL", () => {
    const now = new Date("2026-08-02T14:00:00.000Z"); // 10pm Aug 2 KL
    expect(currentWindow(now).name).toBe("Night");
  });

  it("every hour of the day maps to exactly one defined window - no gaps", () => {
    for (let klHour = 0; klHour < 24; klHour++) {
      const utcHour = (klHour - 8 + 24) % 24;
      const now = new Date(Date.UTC(2026, 7, 2, utcHour, 0, 0));
      const w = currentWindow(now);
      expect(w).toBeDefined();
      expect(WINDOWS).toContain(w);
    }
  });
});

describe("renderTimeWindowCard", () => {
  it("marks exactly one window as current and flags the content as illustrative", () => {
    const now = new Date("2026-08-01T23:00:00.000Z");
    const el = renderTimeWindowCard(now);
    expect(el.querySelectorAll(".hk-window-row.current").length).toBe(1);
    expect(el.textContent).toMatch(/illustrative/i);
  });

  it("renders one row per defined window", () => {
    const el = renderTimeWindowCard(new Date());
    expect(el.querySelectorAll(".hk-window-row").length).toBe(WINDOWS.length);
  });
});

describe("renderBestTimeForCard", () => {
  it("names the current window and flags the suggestion as illustrative", () => {
    const now = new Date("2026-08-01T23:00:00.000Z"); // Morning
    const el = renderBestTimeForCard(now);
    expect(el.textContent).toContain("Morning");
    expect(el.textContent).toMatch(/illustrative/i);
  });
});
