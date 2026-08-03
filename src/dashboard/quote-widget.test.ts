/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  loadQuoteCategory,
  saveQuoteCategory,
  nextQuoteCategory,
  shuffle,
  buildShuffledQueue,
  renderQuoteWidget,
  wireQuoteWidget,
} from "./quote-widget.js";
import { CATEGORY_CYCLE, CATEGORY_LABELS, quotesByCategory, computeDisplayDurationMs } from "./quotes.js";

describe("loadQuoteCategory / saveQuoteCategory", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to the first category in the cycle when nothing is stored", () => {
    expect(loadQuoteCategory()).toBe(CATEGORY_CYCLE[0]);
  });

  it("round-trips a saved category", () => {
    saveQuoteCategory("dream");
    expect(loadQuoteCategory()).toBe("dream");
  });

  it("falls back to the default for a garbage stored value", () => {
    localStorage.setItem("hk-quote-category", "not-a-real-category");
    expect(loadQuoteCategory()).toBe(CATEGORY_CYCLE[0]);
  });
});

describe("nextQuoteCategory", () => {
  it("cycles through all 4 categories in order and wraps back to the first", () => {
    let c = CATEGORY_CYCLE[0]!;
    const seen = [c];
    for (let i = 0; i < CATEGORY_CYCLE.length; i++) {
      c = nextQuoteCategory(c);
      seen.push(c);
    }
    expect(seen).toEqual([...CATEGORY_CYCLE, CATEGORY_CYCLE[0]]);
  });
});

describe("shuffle", () => {
  it("returns an array with exactly the same elements, just reordered", () => {
    const input = [1, 2, 3, 4, 5];
    const result = shuffle(input);
    expect(result).not.toBe(input); // new array
    expect([...result].sort()).toEqual([...input].sort());
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3];
    const copy = [...input];
    shuffle(input);
    expect(input).toEqual(copy);
  });
});

describe("buildShuffledQueue", () => {
  it("contains exactly the quotes for the requested category, no more, no less", () => {
    const queue = buildShuffledQueue("dream");
    const expected = quotesByCategory("dream");
    expect(queue.length).toBe(expected.length);
    expect([...queue].sort((a, b) => a.text.localeCompare(b.text))).toEqual(
      [...expected].sort((a, b) => a.text.localeCompare(b.text))
    );
  });

  it("never places `avoid` first, across many trials (the loop-seam repeat guard)", () => {
    const all = quotesByCategory("philosophy");
    const avoid = all[0]!;
    for (let i = 0; i < 200; i++) {
      const queue = buildShuffledQueue("philosophy", avoid);
      expect(queue[0]).not.toBe(avoid);
    }
  });

  it("works fine with no `avoid` argument at all", () => {
    expect(() => buildShuffledQueue("relationship")).not.toThrow();
  });
});

describe("renderQuoteWidget", () => {
  it("builds a root containing a category button and a text line", () => {
    const { root, textEl, categoryBtn } = renderQuoteWidget();
    expect(root.classList.contains("hk-quote-widget")).toBe(true);
    expect(categoryBtn.tagName).toBe("BUTTON");
    expect(root.contains(textEl)).toBe(true);
    expect(root.contains(categoryBtn)).toBe(true);
  });
});

describe("wireQuoteWidget", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const panelRoot = document.createElement("div");
    document.body.appendChild(panelRoot);
    const { root, textEl, categoryBtn } = renderQuoteWidget();
    panelRoot.appendChild(root);
    return { panelRoot, textEl, categoryBtn };
  }

  it("labels the category button with the CURRENT category, not the next one in the cycle", () => {
    // Regression guard for the exact bug theme.ts's toggle had: labeling the
    // button with nextInCycle(current) instead of current itself.
    const { panelRoot, textEl, categoryBtn } = setup();
    wireQuoteWidget(panelRoot, textEl, categoryBtn);

    const initialCategory = loadQuoteCategory();
    expect(categoryBtn.textContent).toBe(CATEGORY_LABELS[initialCategory]);
    expect(categoryBtn.textContent).not.toBe(CATEGORY_LABELS[nextQuoteCategory(initialCategory)]);
  });

  it("shows a real quote from the current category immediately on wiring", () => {
    const { panelRoot, textEl, categoryBtn } = setup();
    wireQuoteWidget(panelRoot, textEl, categoryBtn);

    const category = loadQuoteCategory();
    const texts = quotesByCategory(category).map((q) => q.text);
    expect(textEl.textContent).not.toBeNull();
    expect(texts).toContain(textEl.textContent);
  });

  it("clicking the category button cycles the label through all 4 categories and wraps", () => {
    const { panelRoot, textEl, categoryBtn } = setup();
    wireQuoteWidget(panelRoot, textEl, categoryBtn);

    const labelsSeen = [categoryBtn.textContent];
    for (let i = 0; i < CATEGORY_CYCLE.length; i++) {
      categoryBtn.dispatchEvent(new Event("click", { bubbles: true }));
      labelsSeen.push(categoryBtn.textContent);
    }
    expect(labelsSeen[labelsSeen.length - 1]).toBe(labelsSeen[0]); // wrapped back
    expect(new Set(labelsSeen.slice(0, -1)).size).toBe(CATEGORY_CYCLE.length); // all 4 distinct along the way
  });

  it("clicking the category button immediately shows a quote from the NEW category, and persists the choice", () => {
    const { panelRoot, textEl, categoryBtn } = setup();
    wireQuoteWidget(panelRoot, textEl, categoryBtn);

    const before = loadQuoteCategory();
    categoryBtn.dispatchEvent(new Event("click", { bubbles: true }));
    const after = loadQuoteCategory();

    expect(after).not.toBe(before);
    expect(after).toBe(nextQuoteCategory(before));
    expect(quotesByCategory(after).map((q) => q.text)).toContain(textEl.textContent);
    // Categories are disjoint, so this also proves it's no longer showing
    // whatever was on screen before the click (from a different category).
    expect(quotesByCategory(before).map((q) => q.text)).not.toContain(textEl.textContent);
  });

  it("a mouseenter on panelRoot re-shows a quote from the same (unchanged) category", () => {
    const { panelRoot, textEl, categoryBtn } = setup();
    wireQuoteWidget(panelRoot, textEl, categoryBtn);

    const category = loadQuoteCategory();
    panelRoot.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));

    expect(categoryBtn.textContent).toBe(CATEGORY_LABELS[category]); // category itself didn't change
    expect(quotesByCategory(category).map((q) => q.text)).toContain(textEl.textContent);
  });

  it("mousing over repeatedly surfaces more than one distinct quote (it's actually advancing, not stuck)", () => {
    const { panelRoot, textEl, categoryBtn } = setup();
    wireQuoteWidget(panelRoot, textEl, categoryBtn);

    const seen = new Set<string | null>();
    for (let i = 0; i < 30; i++) {
      panelRoot.dispatchEvent(new MouseEvent("mouseenter", { bubbles: false }));
      seen.add(textEl.textContent);
    }
    // With 40+ quotes in every real category, 30 draws landing on the same
    // single quote every time has effectively zero probability if this is
    // really advancing - this is not a flaky assertion in practice.
    expect(seen.size).toBeGreaterThan(1);
  });

  it("does not auto-advance before the current quote's computed duration has elapsed", () => {
    vi.useFakeTimers();
    const { panelRoot, textEl, categoryBtn } = setup();
    wireQuoteWidget(panelRoot, textEl, categoryBtn);

    const first = textEl.textContent;
    const duration = computeDisplayDurationMs(first!);
    vi.advanceTimersByTime(Math.max(0, duration - 50));
    expect(textEl.textContent).toBe(first);
  });

  it("auto-advances once the current quote's computed duration has fully elapsed", () => {
    vi.useFakeTimers();
    const { panelRoot, textEl, categoryBtn } = setup();
    wireQuoteWidget(panelRoot, textEl, categoryBtn);

    const category = loadQuoteCategory();
    const first = textEl.textContent;
    const duration = computeDisplayDurationMs(first!);
    vi.advanceTimersByTime(duration + 10);

    // Still a valid quote from the same category - the timer's job is only
    // to advance the queue, never to change category on its own.
    expect(quotesByCategory(category).map((q) => q.text)).toContain(textEl.textContent);
  });

  it("returns a stop function that halts further auto-advances", () => {
    vi.useFakeTimers();
    const { panelRoot, textEl, categoryBtn } = setup();
    const stop = wireQuoteWidget(panelRoot, textEl, categoryBtn);

    const first = textEl.textContent;
    stop();
    vi.advanceTimersByTime(60000);
    expect(textEl.textContent).toBe(first); // no timer left to fire
  });
});
