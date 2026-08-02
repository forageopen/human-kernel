/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
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
