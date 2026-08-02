/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { initParticles } from "./particles.js";

describe("initParticles", () => {
  it("creates exactly the requested number of particle elements", () => {
    const container = document.createElement("div");
    initParticles(container, 10);
    expect(container.querySelectorAll(".hk-particle").length).toBe(10);
  });

  it("defaults to a non-zero particle count when none is given", () => {
    const container = document.createElement("div");
    initParticles(container);
    expect(container.children.length).toBeGreaterThan(0);
  });

  it("gives each particle its own randomized position/drift/timing custom properties, not a single shared value", () => {
    const container = document.createElement("div");
    initParticles(container, 8);
    const particles = Array.from(container.querySelectorAll<HTMLElement>(".hk-particle"));

    for (const p of particles) {
      expect(p.style.getPropertyValue("--hk-p-left")).toMatch(/^-?\d+(\.\d+)?vw$/);
      expect(p.style.getPropertyValue("--hk-p-top")).toMatch(/^-?\d+(\.\d+)?vh$/);
      expect(p.style.getPropertyValue("--hk-p-dx")).toMatch(/^-?\d+(\.\d+)?vw$/);
      expect(p.style.getPropertyValue("--hk-p-dy")).toMatch(/^-?\d+(\.\d+)?vh$/);
      expect(p.style.getPropertyValue("--hk-p-size")).toMatch(/^\d+(\.\d+)?px$/);
      // Bare numbers, no unit - styles.css divides these by a shared
      // --hk-speed variable via calc(), which only works if there's no unit
      // baked in already (a slider can't usefully scale "6s", only "6").
      expect(p.style.getPropertyValue("--hk-p-drift-base")).toMatch(/^\d+(\.\d+)?$/);
      expect(p.style.getPropertyValue("--hk-p-glow-base")).toMatch(/^\d+(\.\d+)?$/);
    }

    // Not all identical - confirms randomization is actually happening rather
    // than every particle silently getting the same hardcoded spec.
    const leftValues = new Set(particles.map((p) => p.style.getPropertyValue("--hk-p-left")));
    expect(leftValues.size).toBeGreaterThan(1);
  });

  it("is idempotent - calling it again clears the previous batch instead of piling up", () => {
    const container = document.createElement("div");
    initParticles(container, 5);
    initParticles(container, 3);
    expect(container.querySelectorAll(".hk-particle").length).toBe(3);
  });
});
