import { describe, it, expect } from "vitest";
import { QUOTES, MAX_QUOTE_LENGTH, CATEGORY_CYCLE, CATEGORY_LABELS, quotesByCategory, computeDisplayDurationMs } from "./quotes.js";

describe("QUOTES", () => {
  it("is non-empty for every category in the cycle", () => {
    for (const category of CATEGORY_CYCLE) {
      expect(quotesByCategory(category).length).toBeGreaterThan(0);
    }
  });

  it("has a label for every category in the cycle", () => {
    for (const category of CATEGORY_CYCLE) {
      expect(CATEGORY_LABELS[category]).toBeTruthy();
    }
  });

  it("never exceeds MAX_QUOTE_LENGTH - direct request: don't include quotes longer than the targeted display area", () => {
    const offenders = QUOTES.filter((q) => q.text.length > MAX_QUOTE_LENGTH);
    expect(offenders.map((q) => `${q.text.length} chars: ${q.text.slice(0, 60)}...`)).toEqual([]);
  });

  it("has no exact-duplicate text across the whole bank", () => {
    const seen = new Set<string>();
    const dupes: string[] = [];
    for (const q of QUOTES) {
      if (seen.has(q.text)) dupes.push(q.text);
      seen.add(q.text);
    }
    expect(dupes).toEqual([]);
  });

  it("has no blank or whitespace-only quote text", () => {
    const blanks = QUOTES.filter((q) => q.text.trim() === "");
    expect(blanks.length).toBe(0);
  });

  it("assigns only categories that are in CATEGORY_CYCLE", () => {
    const invalid = QUOTES.filter((q) => !CATEGORY_CYCLE.includes(q.category));
    expect(invalid).toEqual([]);
  });

  it("has a reasonably sized bank overall (curated, not the raw ~130-entry source dump)", () => {
    expect(QUOTES.length).toBeGreaterThan(50);
  });
});

describe("quotesByCategory", () => {
  it("returns only quotes matching the requested category", () => {
    for (const category of CATEGORY_CYCLE) {
      const results = quotesByCategory(category);
      expect(results.every((q) => q.category === category)).toBe(true);
    }
  });

  it("returns a fresh array each call (callers can't mutate the shared bank)", () => {
    const a = quotesByCategory("islamic");
    const b = quotesByCategory("islamic");
    expect(a).not.toBe(b);
    expect(a).toEqual(b);
  });
});

describe("computeDisplayDurationMs", () => {
  it("returns 7000ms for short quotes", () => {
    expect(computeDisplayDurationMs("Not dead yet.")).toBe(7000);
  });

  it("returns 11000ms for a quote at exactly MAX_QUOTE_LENGTH", () => {
    const text = "x".repeat(MAX_QUOTE_LENGTH);
    expect(computeDisplayDurationMs(text)).toBe(11000);
  });

  it("clamps at 11000ms even if somehow given text longer than MAX_QUOTE_LENGTH", () => {
    const text = "x".repeat(MAX_QUOTE_LENGTH + 100);
    expect(computeDisplayDurationMs(text)).toBe(11000);
  });

  it("stays within [7000, 11000] and increases monotonically with length", () => {
    const lengths = [10, 40, 80, 120, 160, 200, 240, 280];
    let last = 0;
    for (const len of lengths) {
      const d = computeDisplayDurationMs("x".repeat(len));
      expect(d).toBeGreaterThanOrEqual(7000);
      expect(d).toBeLessThanOrEqual(11000);
      expect(d).toBeGreaterThanOrEqual(last);
      last = d;
    }
  });

  it("every real quote in the bank produces a valid duration", () => {
    for (const q of QUOTES) {
      const d = computeDisplayDurationMs(q.text);
      expect(d).toBeGreaterThanOrEqual(7000);
      expect(d).toBeLessThanOrEqual(11000);
    }
  });
});
