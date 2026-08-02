/** @vitest-environment jsdom */
// Activity card as a traditional month calendar (2026-08-02, direct
// feedback: "fix activity card. seems too long to scroll. do the calendar
// type instead" - replacing the earlier GitHub-contribution-style
// week-column strip from a few hours before).
import { describe, it, expect, vi } from "vitest";
import { renderCalendarHeatmap } from "./charts.js";
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

describe("renderCalendarHeatmap - which month it opens on", () => {
  it("defaults to the month containing the most recent real evidence, not always 'today'", () => {
    const evidence = [
      ev({ id: "1", timestamp: "2025-06-22T10:00:00.000Z" }),
      ev({ id: "2", timestamp: "2026-07-04T10:00:00.000Z" }),
    ];
    const el = renderCalendarHeatmap(evidence, vi.fn());
    expect(el.querySelector(".hk-calendar-month-label")?.textContent).toContain("July 2026");
  });

  it("defaults to the current month when there is no evidence at all", () => {
    const el = renderCalendarHeatmap([], vi.fn());
    const now = new Date();
    const expected = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    expect(el.querySelector(".hk-calendar-month-label")?.textContent).toBe(expected);
  });

  it("an explicit initialMonth overrides the most-recent-evidence default", () => {
    const evidence = [ev({ id: "1", timestamp: "2026-07-04T10:00:00.000Z" })];
    const el = renderCalendarHeatmap(evidence, vi.fn(), new Date(2025, 0, 15));
    expect(el.querySelector(".hk-calendar-month-label")?.textContent).toBe("January 2025");
  });
});

describe("renderCalendarHeatmap - grid structure", () => {
  it("renders 7 day-of-week headers and pads the grid so day 1 lands on its real weekday", () => {
    // January 2026: the 1st is a Thursday.
    const el = renderCalendarHeatmap([], vi.fn(), new Date(2026, 0, 1));
    expect(el.querySelectorAll(".hk-calendar-dow").length).toBe(7);

    const cells = Array.from(el.querySelectorAll(".hk-calendar-grid > *"));
    const emptyLeadingCells = cells.findIndex((c) => !c.classList.contains("empty"));
    expect(emptyLeadingCells).toBe(new Date(2026, 0, 1).getDay());
    expect(cells[emptyLeadingCells]?.querySelector(".hk-calendar-daynum")?.textContent).toBe("1");
  });

  it("renders exactly one cell per real day in the month, each showing its day number", () => {
    // February 2026 (not a leap year) has 28 days.
    const el = renderCalendarHeatmap([], vi.fn(), new Date(2026, 1, 1));
    const realCells = el.querySelectorAll(".hk-calendar-grid .hk-calendar-daynum");
    expect(realCells.length).toBe(28);
    expect(realCells[27]?.textContent).toBe("28");
  });

  it("renders a Less -> More legend with 5 level swatches", () => {
    const el = renderCalendarHeatmap([], vi.fn());
    const legend = el.querySelector(".hk-heatmap-legend");
    expect(legend?.textContent).toContain("Less");
    expect(legend?.textContent).toContain("More");
    expect(legend?.querySelectorAll(".hk-heatmap-cell").length).toBe(5);
  });
});

describe("renderCalendarHeatmap - intensity, never fabricated", () => {
  it("a day with real evidence gets a level above 0; a day with none is level-0", () => {
    const evidence = [ev({ id: "1", timestamp: "2026-01-15T00:00:00.000Z" })];
    const el = renderCalendarHeatmap(evidence, vi.fn(), new Date(2026, 0, 1));

    const day15 = el.querySelector<HTMLElement>('[data-date="2026-01-15"]');
    expect(day15?.className).not.toContain("level-0");

    const day16 = el.querySelector<HTMLElement>('[data-date="2026-01-16"]');
    expect(day16?.className).toContain("level-0");
  });

  it("exact date and count are on the title attribute, not a visible digit beyond the day number", () => {
    const evidence = [ev({ id: "1", timestamp: "2026-01-15T00:00:00.000Z" }), ev({ id: "2", timestamp: "2026-01-15T04:00:00.000Z" })];
    const el = renderCalendarHeatmap(evidence, vi.fn(), new Date(2026, 0, 1));
    const day15 = el.querySelector<HTMLElement>('[data-date="2026-01-15"]');
    expect(day15?.title).toContain("January 15, 2026");
    expect(day15?.title).toContain("2 entries");
  });
});

describe("renderCalendarHeatmap - click wiring", () => {
  it("clicking a day with evidence calls onDayClick with that date key", () => {
    const evidence = [ev({ id: "1", timestamp: "2026-01-15T00:00:00.000Z" })];
    const onDayClick = vi.fn();
    const el = renderCalendarHeatmap(evidence, onDayClick, new Date(2026, 0, 1));

    el.querySelector<HTMLElement>('[data-date="2026-01-15"]')?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onDayClick).toHaveBeenCalledWith("2026-01-15");
  });

  it("a day with zero evidence is not wired to open anything", () => {
    const onDayClick = vi.fn();
    const el = renderCalendarHeatmap([], onDayClick, new Date(2026, 0, 1));
    el.querySelector<HTMLElement>('[data-date="2026-01-16"]')?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onDayClick).not.toHaveBeenCalled();
  });

  it("navigating to a different month re-wires clicks on the NEWLY rendered cells too", () => {
    // This is the exact bug an earlier version had: click-wiring done once,
    // externally, right after the initial render, meant cells created by a
    // later Prev/Next click had no listener at all.
    const evidence = [ev({ id: "1", timestamp: "2026-02-10T00:00:00.000Z" })];
    const onDayClick = vi.fn();
    const el = renderCalendarHeatmap(evidence, onDayClick, new Date(2026, 0, 1));

    el.querySelector<HTMLElement>(".hk-calendar-nav[aria-label='Next month']")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(el.querySelector(".hk-calendar-month-label")?.textContent).toBe("February 2026");

    el.querySelector<HTMLElement>('[data-date="2026-02-10"]')?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(onDayClick).toHaveBeenCalledWith("2026-02-10");
  });
});

describe("renderCalendarHeatmap - month navigation", () => {
  it("Previous steps back a month, including across a year boundary", () => {
    const el = renderCalendarHeatmap([], vi.fn(), new Date(2026, 0, 1));
    el.querySelector<HTMLElement>(".hk-calendar-nav[aria-label='Previous month']")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(el.querySelector(".hk-calendar-month-label")?.textContent).toBe("December 2025");
  });

  it("Next steps forward a month, including across a year boundary", () => {
    const el = renderCalendarHeatmap([], vi.fn(), new Date(2025, 11, 1));
    el.querySelector<HTMLElement>(".hk-calendar-nav[aria-label='Next month']")?.dispatchEvent(new Event("click", { bubbles: true }));
    expect(el.querySelector(".hk-calendar-month-label")?.textContent).toBe("January 2026");
  });
});
