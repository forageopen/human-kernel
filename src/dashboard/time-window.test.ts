/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { WINDOWS, currentWindow, renderTimeWindowCard, renderBestTimeForCard } from "./time-window.js";

describe("currentWindow", () => {
  it("picks Morning for 7am KL", () => {
    const now = new Date("2026-08-01T23:00:00.000Z"); // 7am Aug 2 in KL (UTC+8)
    expect(currentWindow(now).name).toBe("Morning");
  });

  it("picks Evening for 10pm KL", () => {
    const now = new Date("2026-08-02T14:00:00.000Z"); // 10pm Aug 2 KL
    expect(currentWindow(now).name).toBe("Evening");
  });

  it("picks Early Afternoon for 3pm KL - the source doc's own noon-3/4-6 boundary gap resolves here, not left uncovered", () => {
    const now = new Date("2026-08-02T07:00:00.000Z"); // 3pm Aug 2 KL
    expect(currentWindow(now).name).toBe("Early Afternoon");
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
  it("marks exactly one window as current and shows its real best-for text, not a placeholder", () => {
    const now = new Date("2026-08-01T23:00:00.000Z"); // Morning
    const el = renderTimeWindowCard(now);
    expect(el.querySelectorAll(".hk-window-row.current").length).toBe(1);
    expect(el.textContent).not.toMatch(/illustrative/i);
    expect(el.querySelector(".hk-placeholder-flag")).toBeNull();
    expect(el.textContent).toContain(WINDOWS.find((w) => w.name === "Morning")?.bestFor);
  });

  it("renders one row per defined window", () => {
    const el = renderTimeWindowCard(new Date());
    expect(el.querySelectorAll(".hk-window-row").length).toBe(WINDOWS.length);
  });
});

describe("renderBestTimeForCard", () => {
  it("names the current window and shows its real best-for/poor-for text, not a placeholder", () => {
    const now = new Date("2026-08-01T23:00:00.000Z"); // Morning
    const el = renderBestTimeForCard(now);
    const morning = WINDOWS.find((w) => w.name === "Morning")!;
    expect(el.textContent).toContain("Morning");
    expect(el.textContent).toContain(morning.bestFor);
    expect(el.textContent).toContain(morning.poorFor);
    expect(el.textContent).not.toMatch(/illustrative/i);
  });

  it("cites the Adaptive Daily OS as the source, since this is now real content from it", () => {
    const el = renderBestTimeForCard(new Date("2026-08-01T23:00:00.000Z"));
    expect(el.textContent).toMatch(/adaptive daily os/i);
  });
});
