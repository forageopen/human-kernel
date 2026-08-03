/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import { renderDogSvg, wireDogAvatar } from "./dog-avatar.js";

describe("renderDogSvg", () => {
  it("returns a valid, non-empty SVG string", () => {
    const svg = renderDogSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<rect");
  });

  it("never uses pure black or pure white (brand rule, same as the profile avatar and mascot)", () => {
    const svg = renderDogSvg();
    expect(svg).not.toContain("#000000");
    expect(svg).not.toContain("#ffffff");
    expect(svg).not.toContain("#fff");
    expect(svg).not.toContain("#000");
  });

  it("is deterministic - no randomness, same output every call", () => {
    expect(renderDogSvg()).toBe(renderDogSvg());
  });
});

describe("wireDogAvatar", () => {
  it("renders the sprite inside a .hk-dog-hop wrapper", () => {
    const el = document.createElement("div");
    wireDogAvatar(el);
    const hop = el.querySelector(".hk-dog-hop");
    expect(hop).not.toBeNull();
    expect(hop?.querySelector("svg")).not.toBeNull();
  });

  it("is idempotent - calling it again replaces rather than duplicates", () => {
    const el = document.createElement("div");
    wireDogAvatar(el);
    wireDogAvatar(el);
    expect(el.querySelectorAll(".hk-dog-hop").length).toBe(1);
  });
});
