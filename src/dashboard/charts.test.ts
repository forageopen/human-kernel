/** @vitest-environment jsdom */
// Chart.js itself is never asserted on here - jsdom has no real canvas, and
// the CDN script isn't loaded in tests (see charts.ts's own header comment).
// These tests cover the parts that don't need Chart.js: monthWithMostEvidence's
// date-bucketing logic, and renderEvidenceHeatmap's plain-DOM output. They also
// confirm the draw*() functions no-op cleanly (don't throw) when Chart is
// undefined, which is the real, default state of every CI/test run.
import { describe, it, expect } from "vitest";
import {
  monthWithMostEvidence,
  renderEvidenceHeatmap,
  drawDomainCountChart,
  drawConfidenceHistogram,
  drawStatusDonut,
  drawRelationshipTypeChart,
  drawSourceFileChart,
  drawDomainConfidenceRadar,
} from "./charts.js";
import type { Evidence, Parameter, Relationship } from "../types.js";

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

describe("monthWithMostEvidence", () => {
  it("returns today when there is no evidence at all", () => {
    const result = monthWithMostEvidence([]);
    const now = new Date();
    expect(result.getFullYear()).toBe(now.getFullYear());
    expect(result.getMonth()).toBe(now.getMonth());
  });

  it("picks the calendar month with the most entries, not the most recent one", () => {
    const evidence = [
      ev({ id: "1", timestamp: "2025-06-22T10:00:00.000Z" }),
      ev({ id: "2", timestamp: "2025-06-22T11:00:00.000Z" }),
      ev({ id: "3", timestamp: "2025-06-22T12:00:00.000Z" }),
      ev({ id: "4", timestamp: "2026-07-04T09:00:00.000Z" }), // more recent, but only 1 entry
    ];
    const result = monthWithMostEvidence(evidence);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(5); // June = index 5
  });
});

describe("renderEvidenceHeatmap", () => {
  it("renders one cell per day in the given month, plus the correct leading filler cells", () => {
    const monthDate = new Date(2026, 5, 1); // June 2026 - has 30 days
    const wrap = renderEvidenceHeatmap([], monthDate);
    const dayCells = wrap.querySelectorAll(".hk-heatmap-cell:not(.empty)");
    expect(dayCells.length).toBe(30);

    const firstWeekday = new Date(2026, 5, 1).getDay();
    const fillerCells = wrap.querySelectorAll(".hk-heatmap-cell.empty");
    expect(fillerCells.length).toBe(firstWeekday);
  });

  it("scales intensity level relative to that month's own busiest day, not a fixed count", () => {
    const monthDate = new Date(2025, 5, 1); // June 2025
    const evidence = [
      ev({ id: "1", timestamp: "2025-06-22T01:00:00.000Z" }),
      ev({ id: "2", timestamp: "2025-06-22T02:00:00.000Z" }),
      ev({ id: "3", timestamp: "2025-06-22T03:00:00.000Z" }),
      ev({ id: "4", timestamp: "2025-06-22T04:00:00.000Z" }),
      ev({ id: "5", timestamp: "2025-06-10T01:00:00.000Z" }),
    ];
    const wrap = renderEvidenceHeatmap(evidence, monthDate);
    const cells = Array.from(wrap.querySelectorAll<HTMLElement>(".hk-heatmap-cell"));

    const day22 = cells.find((c) => c.textContent === "22");
    const day10 = cells.find((c) => c.textContent === "10");
    const day1 = cells.find((c) => c.textContent === "1");

    expect(day22?.className).toContain("level-4"); // the month's busiest day
    expect(day10?.className).toContain("level-1"); // 1 of 4 -> lowest non-zero level
    expect(day1?.className).toContain("level-0"); // no evidence that day
  });

  it("never fabricates a count - a day with zero real Evidence is level-0, not guessed", () => {
    const wrap = renderEvidenceHeatmap([], new Date(2026, 0, 1));
    const cells = wrap.querySelectorAll(".hk-heatmap-cell:not(.empty)");
    expect(Array.from(cells).every((c) => c.className.includes("level-0"))).toBe(true);
  });
});

describe("draw*() chart functions (Chart.js absent, as in every real test run)", () => {
  it("no-op without throwing when the Chart.js CDN global isn't loaded", () => {
    const canvas = document.createElement("canvas");
    const parameters: Parameter[] = [
      { id: "p1", name: "test", domain: "Human", evidenceIds: ["e1"], confidence: 0.6, status: "draft" },
    ];
    const relationships: Relationship[] = [];
    const evidence: Evidence[] = [ev({ id: "e1" })];

    expect(() => drawDomainCountChart(canvas, parameters)).not.toThrow();
    expect(() => drawConfidenceHistogram(canvas, parameters)).not.toThrow();
    expect(() => drawStatusDonut(canvas, parameters)).not.toThrow();
    expect(() => drawRelationshipTypeChart(canvas, relationships)).not.toThrow();
    expect(() => drawSourceFileChart(canvas, evidence)).not.toThrow();
    expect(() => drawDomainConfidenceRadar(canvas, parameters)).not.toThrow();
  });
});
