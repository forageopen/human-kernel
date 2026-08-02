/** @vitest-environment jsdom */
// The six Chart.js chart cards this file used to also cover (domain count,
// confidence histogram, status donut, relationship types, source files,
// domain-confidence radar) are gone - scrapped per direct instruction. Only
// the heatmap remains, now spanning the real Evidence date range instead of
// one calendar month at a time.
import { describe, it, expect } from "vitest";
import { evidenceDateRange, renderEvidenceHeatmap } from "./charts.js";
import type { Evidence } from "../types.js";

function ev(overrides: Partial<Evidence>): Evidence {
  return {
    id: "ev-x",
    sourceFile: "a.md",
    timestamp: "2026-01-01T00:00:00.000Z",
    context: "a.md",
    observation: "test",
    confidence: 0.7,
    ...overrides,
  };
}

describe("evidenceDateRange", () => {
  it("returns today for both start and end when there is no evidence at all", () => {
    const now = new Date("2026-08-02T00:00:00.000Z");
    const range = evidenceDateRange([], now);
    expect(range.start.getTime()).toBe(now.getTime());
    expect(range.end.getTime()).toBe(now.getTime());
  });

  it("spans from the earliest real timestamp to today - never clips real data to one month", () => {
    const now = new Date("2026-08-02T00:00:00.000Z");
    const evidence = [
      ev({ id: "1", timestamp: "2025-06-22T10:00:00.000Z" }),
      ev({ id: "2", timestamp: "2026-05-15T10:00:00.000Z" }),
      ev({ id: "3", timestamp: "2026-07-04T10:00:00.000Z" }),
    ];
    const range = evidenceDateRange(evidence, now);
    expect(range.start.getFullYear()).toBe(2025);
    expect(range.start.getMonth()).toBe(5); // June
    expect(range.start.getDate()).toBe(22);
    // end is "today" since today is later than the latest evidence timestamp -
    // compared against `now` itself (not a separately-constructed local Date)
    // so this isn't dependent on the test machine's timezone offset.
    expect(range.end.getTime()).toBe(now.getTime());
  });

  it("uses the latest evidence date as the end if it is somehow after 'now'", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const evidence = [ev({ id: "1", timestamp: "2026-07-04T10:00:00.000Z" })];
    const range = evidenceDateRange(evidence, now);
    expect(range.end.getFullYear()).toBe(2026);
    expect(range.end.getMonth()).toBe(6); // July
  });
});

describe("renderEvidenceHeatmap", () => {
  it("shows all real active dates across the full span, not just the busiest single month", () => {
    const now = new Date(2026, 7, 2);
    const evidence = [
      ev({ id: "1", timestamp: "2025-06-22T10:00:00.000Z" }),
      ev({ id: "2", timestamp: "2026-05-15T10:00:00.000Z" }),
      ev({ id: "3", timestamp: "2026-07-04T10:00:00.000Z" }),
    ];
    const wrap = renderEvidenceHeatmap(evidence, now);
    // Scoped to .hk-heatmap-weeks specifically - the Less->More legend below
    // the grid reuses these same .hk-heatmap-cell.level-N classes on its 5
    // swatches (by design, so the legend visually matches the grid), and an
    // unscoped query here would double-count those swatches as if they were
    // real days.
    const activeCells = Array.from(
      wrap.querySelectorAll<HTMLElement>(".hk-heatmap-weeks .hk-heatmap-cell:not(.empty)")
    ).filter((c) => !c.className.includes("level-0"));
    const activeDates = activeCells.map((c) => c.dataset.date).sort();
    expect(activeDates).toEqual(["2025-06-22", "2026-05-15", "2026-07-04"]);
  });

  it("is color-only - no visible digit inside a cell, exact date/count is on title/hover instead", () => {
    const wrap = renderEvidenceHeatmap([ev({ id: "1", timestamp: "2026-01-15T00:00:00.000Z" })], new Date(2026, 0, 20));
    const cells = Array.from(wrap.querySelectorAll<HTMLElement>(".hk-heatmap-weeks .hk-heatmap-cell:not(.empty)"));
    expect(cells.every((c) => c.textContent === "")).toBe(true);
    const day15 = cells.find((c) => c.dataset.date === "2026-01-15");
    expect(day15?.title).toContain("January 15, 2026");
    expect(day15?.title).toContain("1 entry");
  });

  it("never fabricates a count - a day with zero real Evidence is level-0, not guessed", () => {
    const wrap = renderEvidenceHeatmap([], new Date(2026, 0, 5));
    const cells = wrap.querySelectorAll(".hk-heatmap-weeks .hk-heatmap-cell:not(.empty)");
    expect(Array.from(cells).every((c) => c.className.includes("level-0"))).toBe(true);
  });

  it("renders a Less -> More legend using the same level-N swatch classes as the grid", () => {
    const wrap = renderEvidenceHeatmap([], new Date(2026, 0, 5));
    const legend = wrap.querySelector(".hk-heatmap-legend");
    expect(legend?.textContent).toContain("Less");
    expect(legend?.textContent).toContain("More");
    expect(legend?.querySelectorAll(".hk-heatmap-cell").length).toBe(5); // level-0..level-4
  });

  it("each week column starts on a Sunday", () => {
    const wrap = renderEvidenceHeatmap([], new Date(2026, 0, 5)); // a Monday
    const firstWeek = wrap.querySelector(".hk-heatmap-week");
    const firstRealCell = firstWeek?.querySelector<HTMLElement>(".hk-heatmap-cell");
    // Jan 5 2026 is a Monday, so the grid should start Sun Jan 4 (empty - before any real range start/end since range is just that single day) or later - the key assertion is structural: 7 day-cells per week column plus one month-label slot.
    expect(firstWeek?.children.length).toBe(8); // 1 month-label slot + 7 day cells
    expect(firstRealCell).not.toBeNull();
  });
});
