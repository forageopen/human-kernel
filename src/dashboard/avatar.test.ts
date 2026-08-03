/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  randomAvatarSpec,
  renderAvatarSvg,
  loadOrCreateAvatarSpec,
  saveAvatarSpec,
  wireAvatar,
  type AvatarSpec,
} from "./avatar.js";

describe("randomAvatarSpec", () => {
  it("produces varied hats across many calls, not one hardcoded avatar", () => {
    const specs = Array.from({ length: 30 }, () => randomAvatarSpec());
    const hats = new Set(specs.map((s) => s.hat));
    expect(hats.size).toBeGreaterThan(1);
  });
});

describe("renderAvatarSvg", () => {
  it("produces a valid SVG string containing pixel rects", () => {
    const svg = renderAvatarSvg({ skin: "#c8a96e", hat: "none", moustache: false, glasses: false, lipstick: false, bowtie: false });
    expect(svg).toMatch(/^<svg /);
    expect(svg).toContain("<rect");
  });

  it("never emits pure black or pure white fills (brand rule)", () => {
    const spec: AvatarSpec = { skin: "#c8a96e", hat: "cowboy", moustache: true, glasses: true, lipstick: true, bowtie: true };
    const svg = renderAvatarSvg(spec).toLowerCase();
    expect(svg).not.toContain("#000000");
    expect(svg).not.toContain("#ffffff");
  });

  it("adds more rects as more accessories are enabled", () => {
    const countRects = (svg: string): number => (svg.match(/<rect/g) ?? []).length;
    const bare = renderAvatarSvg({ skin: "#c8a96e", hat: "none", moustache: false, glasses: false, lipstick: false, bowtie: false });
    const decked = renderAvatarSvg({ skin: "#c8a96e", hat: "sombrero", moustache: true, glasses: true, lipstick: true, bowtie: true });
    expect(countRects(decked)).toBeGreaterThan(countRects(bare));
  });

  it("each hat kind renders distinctly (different rect counts/positions)", () => {
    const base: AvatarSpec = { skin: "#c8a96e", hat: "none", moustache: false, glasses: false, lipstick: false, bowtie: false };
    const cap = renderAvatarSvg({ ...base, hat: "cap" });
    const cowboy = renderAvatarSvg({ ...base, hat: "cowboy" });
    const sombrero = renderAvatarSvg({ ...base, hat: "sombrero" });
    expect(cap).not.toBe(cowboy);
    expect(cowboy).not.toBe(sombrero);
  });
});

describe("loadOrCreateAvatarSpec / saveAvatarSpec", () => {
  beforeEach(() => localStorage.clear());

  it("creates and persists a spec on first call", () => {
    const spec = loadOrCreateAvatarSpec();
    expect(localStorage.getItem("hk-avatar-spec")).toBe(JSON.stringify(spec));
  });

  it("returns the same stored spec on subsequent calls, not a new random one", () => {
    const first = loadOrCreateAvatarSpec();
    const second = loadOrCreateAvatarSpec();
    expect(second).toEqual(first);
  });

  it("saveAvatarSpec overwrites the stored spec", () => {
    loadOrCreateAvatarSpec();
    const custom: AvatarSpec = { skin: "#7a8c6e", hat: "cap", moustache: false, glasses: false, lipstick: false, bowtie: false };
    saveAvatarSpec(custom);
    expect(JSON.parse(localStorage.getItem("hk-avatar-spec")!)).toEqual(custom);
  });
});

describe("wireAvatar", () => {
  beforeEach(() => localStorage.clear());

  it("renders an svg into the wrap element immediately", () => {
    const wrap = document.createElement("div");
    wireAvatar(wrap);
    expect(wrap.querySelector("svg")).not.toBeNull();
  });

  it("regenerates and persists a new spec on click", () => {
    const wrap = document.createElement("div");
    wireAvatar(wrap);
    const before = localStorage.getItem("hk-avatar-spec");
    // Force many clicks so we're not relying on one random draw differing from another.
    let after = before;
    for (let i = 0; i < 10 && after === before; i++) {
      wrap.dispatchEvent(new Event("click", { bubbles: true }));
      after = localStorage.getItem("hk-avatar-spec");
    }
    expect(after).not.toBe(before);
  });
});

describe("wireAvatar press-and-hold (2026-08-03, direct request)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function currentSpec(): string | null {
    return localStorage.getItem("hk-avatar-spec");
  }

  it("a press released before the hold delay behaves like a single plain click", () => {
    const wrap = document.createElement("div");
    wireAvatar(wrap);
    const before = currentSpec();

    // Force many short presses so we're not relying on one random draw
    // differing from another (same tolerance the plain-click test above uses).
    let afterClick = before;
    for (let i = 0; i < 10 && afterClick === before; i++) {
      wrap.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      vi.advanceTimersByTime(50); // well under HOLD_DELAY_MS - never arms the cycle
      wrap.dispatchEvent(new Event("pointerup", { bubbles: true }));
      wrap.dispatchEvent(new Event("click", { bubbles: true }));
      afterClick = currentSpec();
    }
    expect(afterClick).not.toBe(before);

    // And nothing keeps regenerating afterward - proves no cycle was left running.
    vi.advanceTimersByTime(1000);
    expect(currentSpec()).toBe(afterClick);
  });

  it("a press held past the hold delay rapid-cycles until released", () => {
    const wrap = document.createElement("div");
    wireAvatar(wrap);

    wrap.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    vi.advanceTimersByTime(360); // past HOLD_DELAY_MS (350) - first cycle regenerate fires

    const seen = new Set<string | null>([currentSpec()]);
    for (let i = 0; i < 8; i++) {
      vi.advanceTimersByTime(100); // CYCLE_INTERVAL_MS
      seen.add(currentSpec());
    }
    // Multiple distinct specs across 8 further ticks - the interval is genuinely cycling.
    expect(seen.size).toBeGreaterThan(1);

    const atRelease = currentSpec();
    wrap.dispatchEvent(new Event("pointerup", { bubbles: true }));

    // Cycle has stopped - no further change even if time keeps advancing.
    vi.advanceTimersByTime(1000);
    expect(currentSpec()).toBe(atRelease);

    // The browser's real click-after-pointerup for this same physical press
    // must NOT add one more regenerate on top of what the hold already did.
    wrap.dispatchEvent(new Event("click", { bubbles: true }));
    expect(currentSpec()).toBe(atRelease);
  });

  it("moving off the element (pointerleave) while holding stops the cycle", () => {
    const wrap = document.createElement("div");
    wireAvatar(wrap);

    wrap.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    vi.advanceTimersByTime(360);
    const running = currentSpec();
    wrap.dispatchEvent(new Event("pointerleave", { bubbles: true }));

    vi.advanceTimersByTime(1000);
    expect(currentSpec()).toBe(running);
  });

  it("pointercancel while holding stops the cycle", () => {
    const wrap = document.createElement("div");
    wireAvatar(wrap);

    wrap.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    vi.advanceTimersByTime(360);
    const running = currentSpec();
    wrap.dispatchEvent(new Event("pointercancel", { bubbles: true }));

    vi.advanceTimersByTime(1000);
    expect(currentSpec()).toBe(running);
  });

  it("keyboard activation (Enter/Space) still regenerates exactly once, unaffected by the hold logic", () => {
    const wrap = document.createElement("div");
    wireAvatar(wrap);
    const before = currentSpec();

    let after = before;
    for (let i = 0; i < 10 && after === before; i++) {
      wrap.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
      after = currentSpec();
    }
    expect(after).not.toBe(before);

    vi.advanceTimersByTime(1000);
    expect(currentSpec()).toBe(after);
  });
});
