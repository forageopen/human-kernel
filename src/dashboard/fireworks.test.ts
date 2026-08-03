/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from "vitest";
import { paletteForCount, clampColorCount, spawnBurst, initFireworks } from "./fireworks.js";

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = ((query: string) =>
    ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList) as typeof window.matchMedia;
}

describe("clampColorCount", () => {
  it("clamps below 1 up to 1", () => {
    expect(clampColorCount(0)).toBe(1);
    expect(clampColorCount(-5)).toBe(1);
  });

  it("clamps above 24 down to 24", () => {
    expect(clampColorCount(30)).toBe(24);
  });

  it("rounds fractional input and passes valid input through", () => {
    expect(clampColorCount(8.6)).toBe(9);
    expect(clampColorCount(12)).toBe(12);
  });

  it("falls back to the minimum for non-finite input", () => {
    expect(clampColorCount(NaN)).toBe(1);
  });
});

describe("paletteForCount", () => {
  it("returns exactly 1 color for count 1", () => {
    expect(paletteForCount(1).length).toBe(1);
  });

  it("returns exactly 24 distinct colors for count 24", () => {
    const colors = paletteForCount(24);
    expect(colors.length).toBe(24);
    expect(new Set(colors).size).toBe(24);
  });

  it("spaces hues evenly (count 4 -> 0, 90, 180, 270 degrees)", () => {
    expect(paletteForCount(4)).toEqual(["hsl(0, 78%, 62%)", "hsl(90, 78%, 62%)", "hsl(180, 78%, 62%)", "hsl(270, 78%, 62%)"]);
  });

  it("clamps out-of-range counts the same way clampColorCount does", () => {
    expect(paletteForCount(0).length).toBe(1);
    expect(paletteForCount(99).length).toBe(24);
  });
});

describe("spawnBurst", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a burst with the right number of sparks, each carrying position/color custom properties", () => {
    const container = document.createElement("div");
    const burst = spawnBurst(container, 8);

    expect(container.contains(burst)).toBe(true);
    expect(burst.style.getPropertyValue("--hk-fw-left")).toMatch(/^\d+(\.\d+)?vw$/);
    expect(burst.style.getPropertyValue("--hk-fw-top")).toMatch(/^\d+(\.\d+)?vh$/);

    const sparks = burst.querySelectorAll<HTMLElement>(".hk-firework-spark");
    expect(sparks.length).toBe(14);
    for (const spark of Array.from(sparks)) {
      expect(spark.style.getPropertyValue("--hk-fw-angle")).toMatch(/^-?\d+(\.\d+)?deg$/);
      expect(spark.style.getPropertyValue("--hk-fw-distance")).toMatch(/^\d+(\.\d+)?px$/);
      expect(spark.style.getPropertyValue("--hk-fw-color")).toMatch(/^hsl\(/);
    }
  });

  it("all sparks in one burst share the same color", () => {
    const container = document.createElement("div");
    const burst = spawnBurst(container, 24);
    const colors = Array.from(burst.querySelectorAll<HTMLElement>(".hk-firework-spark")).map((s) =>
      s.style.getPropertyValue("--hk-fw-color")
    );
    expect(new Set(colors).size).toBe(1);
  });

  it("removes itself from the container once its animation would have finished", () => {
    vi.useFakeTimers();
    const container = document.createElement("div");
    const burst = spawnBurst(container, 8);
    expect(container.contains(burst)).toBe(true);

    vi.advanceTimersByTime(1199);
    expect(container.contains(burst)).toBe(true);
    vi.advanceTimersByTime(1);
    expect(container.contains(burst)).toBe(false);
  });
});

describe("initFireworks", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("spawns nothing under prefers-reduced-motion, even well past the first-burst delay", () => {
    mockReducedMotion(true);
    vi.useFakeTimers();
    const container = document.createElement("div");
    initFireworks(container, 8);

    vi.advanceTimersByTime(20000);
    expect(container.querySelectorAll(".hk-firework-burst").length).toBe(0);
  });

  it("spawns a first burst shortly after starting when motion is allowed", () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const container = document.createElement("div");
    initFireworks(container, 8);

    vi.advanceTimersByTime(600);
    expect(container.querySelectorAll(".hk-firework-burst").length).toBe(1);
  });

  it("keeps spawning further bursts over time", () => {
    // Each burst self-removes after 1.2s, so a single end-state check can't
    // tell "one burst" from "many, sequentially" apart - count appends
    // instead of relying on how many happen to be alive at one instant.
    mockReducedMotion(false);
    vi.useFakeTimers();
    const container = document.createElement("div");
    let burstAppends = 0;
    const originalAppendChild = container.appendChild.bind(container);
    container.appendChild = ((node: Node) => {
      if (node instanceof HTMLElement && node.classList.contains("hk-firework-burst")) burstAppends++;
      return originalAppendChild(node);
    }) as typeof container.appendChild;

    initFireworks(container, 8);
    vi.advanceTimersByTime(20000); // well past several max-interval (5s) cycles

    expect(burstAppends).toBeGreaterThan(1);
  });

  it("stop() halts further scheduling", () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const container = document.createElement("div");
    const controller = initFireworks(container, 8);
    controller.stop();

    vi.advanceTimersByTime(600);
    expect(container.querySelectorAll(".hk-firework-burst").length).toBe(0);
  });

  it("setColorCount changes the palette used by future bursts", () => {
    mockReducedMotion(false);
    vi.useFakeTimers();
    const container = document.createElement("div");
    const controller = initFireworks(container, 24);
    controller.setColorCount(1);

    vi.advanceTimersByTime(600);
    const burst = container.querySelector<HTMLElement>(".hk-firework-burst");
    const spark = burst?.querySelector<HTMLElement>(".hk-firework-spark");
    expect(spark?.style.getPropertyValue("--hk-fw-color")).toBe(paletteForCount(1)[0]);
  });
});
