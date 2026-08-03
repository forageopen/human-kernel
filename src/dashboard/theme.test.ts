/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { getStoredTheme, applyTheme, toggleTheme, wireThemeToggle } from "./theme.js";

describe("theme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to dark when nothing is stored", () => {
    expect(getStoredTheme()).toBe("dark");
  });

  it("applyTheme('light') sets data-theme on <html> and persists the choice", () => {
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("hk-theme")).toBe("light");
  });

  it("applyTheme('feminine') sets data-theme to feminine and persists the choice", () => {
    applyTheme("feminine");
    expect(document.documentElement.getAttribute("data-theme")).toBe("feminine");
    expect(localStorage.getItem("hk-theme")).toBe("feminine");
  });

  it("applyTheme('dark') removes data-theme rather than setting it explicitly", () => {
    applyTheme("light");
    applyTheme("dark");
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(localStorage.getItem("hk-theme")).toBe("dark");
  });

  it("toggleTheme cycles dark -> light -> feminine -> dark", () => {
    expect(toggleTheme()).toBe("light");
    expect(toggleTheme()).toBe("feminine");
    expect(toggleTheme()).toBe("dark");
  });

  it("wireThemeToggle applies the stored theme immediately and labels the button with the NEXT mode", () => {
    localStorage.setItem("hk-theme", "light");
    const btn = document.createElement("button");
    wireThemeToggle(btn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(btn.textContent).toBe("Feminine mode");

    btn.dispatchEvent(new Event("click", { bubbles: true }));
    expect(document.documentElement.getAttribute("data-theme")).toBe("feminine");
    expect(btn.textContent).toBe("Dark mode");

    btn.dispatchEvent(new Event("click", { bubbles: true }));
    expect(document.documentElement.hasAttribute("data-theme")).toBe(false);
    expect(btn.textContent).toBe("Light mode");
  });
});
