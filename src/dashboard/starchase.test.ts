/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { initStarChase } from "./starchase.js";

describe("initStarChase", () => {
  it("creates 2x the given per-group count, split evenly across both groups", () => {
    const container = document.createElement("div");
    initStarChase(container, 4);
    expect(container.querySelectorAll(".hk-starchase-streak").length).toBe(8);
    expect(container.querySelectorAll(".hk-starchase-a").length).toBe(4);
    expect(container.querySelectorAll(".hk-starchase-b").length).toBe(4);
  });

  it("defaults to a non-zero count when none is given", () => {
    const container = document.createElement("div");
    initStarChase(container);
    expect(container.children.length).toBeGreaterThan(0);
  });

  it("sends group A and group B in opposite-ish directions, not the same way", () => {
    const container = document.createElement("div");
    initStarChase(container, 6);
    const angleOf = (el: Element): number => parseFloat((el as HTMLElement).style.getPropertyValue("--hk-s-angle"));

    const groupAAngles = Array.from(container.querySelectorAll(".hk-starchase-a")).map(angleOf);
    const groupBAngles = Array.from(container.querySelectorAll(".hk-starchase-b")).map(angleOf);

    for (const a of groupAAngles) expect(a).toBeGreaterThanOrEqual(-20);
    for (const a of groupAAngles) expect(a).toBeLessThanOrEqual(20);
    for (const b of groupBAngles) expect(b).toBeGreaterThanOrEqual(160);
    for (const b of groupBAngles) expect(b).toBeLessThanOrEqual(200);
  });

  it("gives each streak randomized position/length/duration custom properties", () => {
    const container = document.createElement("div");
    initStarChase(container, 5);
    const streaks = Array.from(container.querySelectorAll<HTMLElement>(".hk-starchase-streak"));

    for (const s of streaks) {
      expect(s.style.getPropertyValue("--hk-s-left")).toMatch(/^-?\d+(\.\d+)?vw$/);
      expect(s.style.getPropertyValue("--hk-s-top")).toMatch(/^-?\d+(\.\d+)?vh$/);
      expect(s.style.getPropertyValue("--hk-s-length")).toMatch(/^\d+(\.\d+)?px$/);
      // Bare number, no unit - see particles.ts on why (--hk-speed division).
      expect(s.style.getPropertyValue("--hk-s-duration-base")).toMatch(/^\d+(\.\d+)?$/);
    }

    const leftValues = new Set(streaks.map((s) => s.style.getPropertyValue("--hk-s-left")));
    expect(leftValues.size).toBeGreaterThan(1);
  });

  it("is idempotent - calling it again clears the previous batch instead of piling up", () => {
    const container = document.createElement("div");
    initStarChase(container, 3);
    initStarChase(container, 2);
    expect(container.querySelectorAll(".hk-starchase-streak").length).toBe(4);
  });
});
