// Quote widget (2026-08-03, direct request: "i wanna add this quote that
// timed around 7-11 seconds depending on its length... like everytime the
// user mousehover the taskbar, and it auto hide, mousehover again, then a
// new quote appear... i want it to shuffle & loop. maybe create a toggle
// button mode for quote islamic/philosophy/relationship/dream"). Lives
// inside the scene taskbar's footer (see scene-panel.ts) rather than owning
// its own hover-open mechanism - it reuses the taskbar's existing open
// state instead of inventing a second one.
//
// Three behaviors, all satisfied at once rather than picked between:
//  1. Shuffle & loop: quotesByCategory is shuffled into a play queue;
//     draining the queue reshuffles a fresh one rather than repeating in
//     the same order twice.
//  2. Timed auto-advance: each quote schedules its own next-quote timer for
//     computeDisplayDurationMs(text) - 7-11s depending on length.
//  3. "Mousehover again, a new quote appears": wireQuoteWidget attaches its
//     own mouseenter listener directly to the scene panel's root (alongside
//     scene-panel.ts's own mouseenter listener that re-syncs toggles - DOM
//     elements support any number of listeners on the same event, so this
//     doesn't fight with that one) and immediately advances on open, on top
//     of whatever the timer is doing in the background.
//
// Category button labeling follows the exact rule theme.ts had to learn the
// hard way: always show the CURRENT category, never the next one. Showing
// "next" was a real, reported bug for the 3-mode theme toggle once a third,
// visually distinct option existed - a 4-mode category cycle has the same
// failure mode if this isn't respected from the start.

import {
  QUOTES,
  CATEGORY_CYCLE,
  CATEGORY_LABELS,
  quotesByCategory,
  computeDisplayDurationMs,
  type Quote,
  type QuoteCategory,
} from "./quotes.js";

const CATEGORY_KEY = "hk-quote-category";

export function loadQuoteCategory(): QuoteCategory {
  try {
    const raw = localStorage.getItem(CATEGORY_KEY);
    return (CATEGORY_CYCLE as readonly string[]).includes(raw ?? "") ? (raw as QuoteCategory) : CATEGORY_CYCLE[0]!;
  } catch {
    return CATEGORY_CYCLE[0]!;
  }
}

export function saveQuoteCategory(category: QuoteCategory): void {
  try {
    localStorage.setItem(CATEGORY_KEY, category);
  } catch {
    // no persistence available this session
  }
}

export function nextQuoteCategory(category: QuoteCategory): QuoteCategory {
  const idx = CATEGORY_CYCLE.indexOf(category);
  return CATEGORY_CYCLE[(idx + 1) % CATEGORY_CYCLE.length]!;
}

/** Fisher-Yates. Pure - returns a new array, never mutates `items`. */
export function shuffle<T>(items: readonly T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

/** Builds a fresh shuffled play-queue for `category`. If `avoid` (the last
 * quote shown before this reshuffle) would land first in the new shuffle,
 * it's swapped out of the front slot - otherwise "shuffle & loop" could
 * occasionally show the exact same quote twice in a row right at the seam
 * between one pass and the next. */
export function buildShuffledQueue(category: QuoteCategory, avoid?: Quote): Quote[] {
  const queue = shuffle(quotesByCategory(category));
  if (avoid && queue.length > 1 && queue[0] === avoid) {
    const tmp = queue[0]!;
    queue[0] = queue[1]!;
    queue[1] = tmp;
  }
  return queue;
}

export interface QuoteWidgetElements {
  root: HTMLElement;
  textEl: HTMLElement;
  categoryBtn: HTMLElement;
}

/** Builds the quote strip's markup - a category-cycle button plus a text
 * line. Appended into the scene panel's footer by scene-panel.ts, not
 * created as a standalone floating element. */
export function renderQuoteWidget(): QuoteWidgetElements {
  const root = document.createElement("div");
  root.className = "hk-quote-widget";

  const categoryBtn = document.createElement("button");
  categoryBtn.type = "button";
  categoryBtn.className = "hk-quote-category-btn";

  const textEl = document.createElement("div");
  textEl.className = "hk-quote-text";

  root.appendChild(categoryBtn);
  root.appendChild(textEl);
  return { root, textEl, categoryBtn };
}

/** Wires the shuffle/loop queue, the category-cycle button, and the timed
 * auto-advance. `panelRoot` is the scene panel's outer root (scene-panel.ts)
 * - a mouseenter listener is added there directly so opening the taskbar
 * always shows a fresh quote, on top of the ordinary timed auto-advance.
 * Returns a stop function (same shape as clock.ts's startLiveClock) that
 * halts the timer; not currently called anywhere, kept for symmetry and any
 * future teardown need. */
export function wireQuoteWidget(panelRoot: HTMLElement, textEl: HTMLElement, categoryBtn: HTMLElement): () => void {
  let category = loadQuoteCategory();
  let queue: Quote[] = [];
  let lastShown: Quote | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const renderCategoryLabel = (): void => {
    categoryBtn.textContent = CATEGORY_LABELS[category];
    categoryBtn.setAttribute("aria-label", `Quote category: ${CATEGORY_LABELS[category]} - click to change`);
  };

  const showNext = (): void => {
    if (timer !== undefined) clearTimeout(timer);
    if (queue.length === 0) queue = buildShuffledQueue(category, lastShown);
    const quote = queue.shift();
    if (!quote) return; // defensive - every real category is non-empty (quotes.test.ts)
    lastShown = quote;
    textEl.textContent = quote.text;
    textEl.classList.toggle("hk-quote-poetic", Boolean(quote.poetic));
    timer = setTimeout(showNext, computeDisplayDurationMs(quote.text));
  };

  categoryBtn.addEventListener("click", () => {
    category = nextQuoteCategory(category);
    saveQuoteCategory(category);
    renderCategoryLabel();
    queue = []; // force a fresh shuffle for the newly-selected category
    showNext();
  });

  panelRoot.addEventListener("mouseenter", showNext);

  renderCategoryLabel();
  showNext();

  return () => {
    if (timer !== undefined) clearTimeout(timer);
  };
}

/** Exposed for tests/diagnostics only - confirms the bank is wired through. */
export const TOTAL_QUOTE_COUNT = QUOTES.length;
