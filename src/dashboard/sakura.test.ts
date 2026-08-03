/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { initSakura } from "./sakura.js";

describe("initSakura", () => {
  it("fills the container with the default number of petal elements", () => {
    const el = document.createElement("div");
    initSakura(el);
    expect(el.querySelectorAll(".hk-sakura-petal").length).toBe(14);
  });

  it("respects a custom count", () => {
    const el = document.createElement("div");
    initSakura(el, 5);
    expect(el.querySelectorAll(".hk-sakura-petal").length).toBe(5);
  });

  it("gives every petal a full set of randomized CSS custom properties, correctly formatted", () => {
    const el = document.createElement("div");
    initSakura(el, 6);
    const petals = Array.from(el.querySelectorAll<HTMLElement>(".hk-sakura-petal"));
    for (const petal of petals) {
      expect(petal.style.getPropertyValue("--hk-sk-left")).toMatch(/^-?\d+(\.\d+)?vw$/);
      expect(petal.style.getPropertyValue("--hk-sk-sway")).toMatch(/^\d+(\.\d+)?vw$/);
      expect(petal.style.getPropertyValue("--hk-sk-size")).toMatch(/^\d+(\.\d+)?px$/);
      expect(petal.style.getPropertyValue("--hk-sk-rotate")).toMatch(/^\d+(\.\d+)?deg$/);
      // Bare-number base duration, same convention as particles.ts/starchase.ts,
      // so styles.css can divide it by the shared --hk-speed variable.
      expect(petal.style.getPropertyValue("--hk-sk-fall-base")).toMatch(/^\d+(\.\d+)?$/);
      expect(petal.style.getPropertyValue("--hk-sk-delay")).toMatch(/^-?\d+(\.\d+)?s$/);
      expect(petal.style.getPropertyValue("--hk-sk-hue")).toMatch(/^-?\d+(\.\d+)?deg$/);
    }
  });

  it("randomizes rather than repeating the same values for every petal", () => {
    const el = document.createElement("div");
    initSakura(el, 10);
    const lefts = Array.from(el.querySelectorAll<HTMLElement>(".hk-sakura-petal")).map((p) =>
      p.style.getPropertyValue("--hk-sk-left")
    );
    expect(new Set(lefts).size).toBeGreaterThan(1);
  });

  it("is idempotent - calling it again clears and re-randomizes rather than piling up", () => {
    const el = document.createElement("div");
    initSakura(el, 8);
    initSakura(el, 8);
    expect(el.querySelectorAll(".hk-sakura-petal").length).toBe(8);
  });
});
