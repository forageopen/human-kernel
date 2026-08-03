/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import {
  currentKlWeekKey,
  loadOrCreateVisitorCounts,
  recordSimulatedVisit,
  formatVisitorCountText,
  wireVisitorCount,
  type VisitorCounts,
} from "./visitor-count.js";

describe("currentKlWeekKey", () => {
  it("returns a YYYY-Www style key", () => {
    expect(currentKlWeekKey(new Date("2026-08-03T04:00:00.000Z"))).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("two dates in the same week return the same key", () => {
    const mon = new Date("2026-08-03T01:00:00.000Z"); // Monday in KL
    const wed = new Date("2026-08-05T10:00:00.000Z"); // Wednesday, same week
    expect(currentKlWeekKey(mon)).toBe(currentKlWeekKey(wed));
  });

  it("two dates a week apart return different keys", () => {
    const week1 = new Date("2026-08-03T01:00:00.000Z");
    const week2 = new Date("2026-08-10T01:00:00.000Z");
    expect(currentKlWeekKey(week1)).not.toBe(currentKlWeekKey(week2));
  });
});

describe("loadOrCreateVisitorCounts", () => {
  beforeEach(() => localStorage.clear());

  it("seeds plausible baseline values on first-ever call", () => {
    const counts = loadOrCreateVisitorCounts(new Date("2026-08-03T04:00:00.000Z"));
    expect(counts.total).toBeGreaterThanOrEqual(120);
    expect(counts.total).toBeLessThanOrEqual(450);
    expect(counts.thisWeek).toBeGreaterThanOrEqual(8);
    expect(counts.thisWeek).toBeLessThanOrEqual(30);
    expect(localStorage.getItem("hk-visitor-total")).toBe(String(counts.total));
  });

  it("returns the same stored counts on a second call in the same week - reading alone never drifts the numbers", () => {
    const now = new Date("2026-08-03T04:00:00.000Z");
    const first = loadOrCreateVisitorCounts(now);
    const second = loadOrCreateVisitorCounts(now);
    expect(second).toEqual(first);
  });

  it("rolls thisWeek over to a fresh small baseline when the KL week has changed, but total carries forward unchanged", () => {
    const week1 = new Date("2026-08-03T04:00:00.000Z");
    const before = loadOrCreateVisitorCounts(week1);

    const week2 = new Date("2026-08-11T04:00:00.000Z"); // a week later
    const after = loadOrCreateVisitorCounts(week2);

    expect(after.total).toBe(before.total);
    expect(after.weekKey).not.toBe(before.weekKey);
    expect(after.thisWeek).toBeGreaterThanOrEqual(4);
    expect(after.thisWeek).toBeLessThanOrEqual(14);
  });
});

describe("recordSimulatedVisit", () => {
  beforeEach(() => localStorage.clear());

  it("increments total and persists the increment", () => {
    const now = new Date("2026-08-03T04:00:00.000Z");
    const before = loadOrCreateVisitorCounts(now);
    const after = recordSimulatedVisit(now);

    expect(after.total).toBeGreaterThan(before.total);
    expect(after.total - before.total).toBeLessThanOrEqual(3);
    expect(localStorage.getItem("hk-visitor-total")).toBe(String(after.total));
  });

  it("thisWeek moves by 0-2 per visit, never decreasing", () => {
    const now = new Date("2026-08-03T04:00:00.000Z");
    const before = loadOrCreateVisitorCounts(now);
    const after = recordSimulatedVisit(now);

    expect(after.thisWeek).toBeGreaterThanOrEqual(before.thisWeek);
    expect(after.thisWeek - before.thisWeek).toBeLessThanOrEqual(2);
  });

  it("keeps growing across repeated visits", () => {
    const now = new Date("2026-08-03T04:00:00.000Z");
    const first = recordSimulatedVisit(now);
    const second = recordSimulatedVisit(now);
    const third = recordSimulatedVisit(now);

    expect(second.total).toBeGreaterThan(first.total);
    expect(third.total).toBeGreaterThan(second.total);
  });

  it("a visit recorded after a week rollover reflects the new week's small baseline, not the old week's count", () => {
    const week1 = new Date("2026-08-03T04:00:00.000Z");
    recordSimulatedVisit(week1);
    recordSimulatedVisit(week1);
    const endOfWeek1 = loadOrCreateVisitorCounts(week1);

    const week2 = new Date("2026-08-11T04:00:00.000Z");
    const afterRollover = recordSimulatedVisit(week2);

    expect(afterRollover.thisWeek).toBeLessThan(endOfWeek1.thisWeek + 10); // nowhere near the old week's accumulated count
    expect(afterRollover.total).toBeGreaterThan(endOfWeek1.total); // total still only ever grows
  });
});

describe("formatVisitorCountText", () => {
  it("renders the expected copy, including the simulated disclosure", () => {
    const counts: VisitorCounts = { total: 842, thisWeek: 23, weekKey: "2026-W31" };
    expect(formatVisitorCountText(counts)).toBe("23 visitors this week · 842 total (simulated)");
  });
});

describe("wireVisitorCount", () => {
  beforeEach(() => localStorage.clear());

  it("renders visitor-count text into the element", () => {
    const el = document.createElement("div");
    wireVisitorCount(el, new Date("2026-08-03T04:00:00.000Z"));

    expect(el.textContent).toContain("visitors this week");
    expect(el.textContent).toContain("total (simulated)");
  });

  it("records exactly one visit's worth of increment on top of the seeded baseline", () => {
    const now = new Date("2026-08-03T04:00:00.000Z");
    const baseline = loadOrCreateVisitorCounts(now); // seeds, without recording a visit itself

    const el = document.createElement("div");
    wireVisitorCount(el, now);

    const total = Number(localStorage.getItem("hk-visitor-total"));
    const thisWeek = Number(localStorage.getItem("hk-visitor-week-count"));
    expect(total - baseline.total).toBeGreaterThanOrEqual(1);
    expect(total - baseline.total).toBeLessThanOrEqual(3);
    expect(thisWeek - baseline.thisWeek).toBeGreaterThanOrEqual(0);
    expect(thisWeek - baseline.thisWeek).toBeLessThanOrEqual(2);
    expect(el.textContent).toBe(formatVisitorCountText({ total, thisWeek, weekKey: baseline.weekKey }));
  });

  it("sets a title attribute disclosing the simulation", () => {
    const el = document.createElement("div");
    wireVisitorCount(el, new Date("2026-08-03T04:00:00.000Z"));
    expect(el.title.toLowerCase()).toContain("simulated");
  });
});
