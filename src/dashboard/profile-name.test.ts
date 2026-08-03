/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { loadProfileName, saveProfileName, wireProfileName } from "./profile-name.js";

describe("loadProfileName / saveProfileName", () => {
  beforeEach(() => localStorage.clear());

  it("falls back to the given default when nothing has been saved", () => {
    expect(loadProfileName("Adam Rosman")).toBe("Adam Rosman");
  });

  it("round-trips a saved name", () => {
    saveProfileName("My Project");
    expect(loadProfileName("Adam Rosman")).toBe("My Project");
  });

  it("falls back to the default for a blank saved value, never returning empty", () => {
    saveProfileName("   ");
    expect(loadProfileName("Adam Rosman")).toBe("Adam Rosman");
  });
});

describe("wireProfileName", () => {
  beforeEach(() => localStorage.clear());

  function setup(): HTMLElement {
    const el = document.createElement("h1");
    el.id = "hk-profile-name";
    el.tabIndex = 0;
    el.setAttribute("role", "button");
    document.body.appendChild(el);
    return el;
  }

  it("shows the given default immediately when nothing has been saved yet", () => {
    const el = setup();
    const handle = wireProfileName(el, "Adam Rosman");
    expect(el.textContent).toBe("Adam Rosman");
    expect(handle.getName()).toBe("Adam Rosman");
    expect(el.getAttribute("aria-label")).toBe("Adam Rosman - click to edit");
  });

  it("restores a previously-saved name instead of the passed-in default", () => {
    saveProfileName("Forage Deep Minds");
    const el = setup();
    const handle = wireProfileName(el, "Adam Rosman");
    expect(el.textContent).toBe("Forage Deep Minds");
    expect(handle.getName()).toBe("Forage Deep Minds");
  });

  it("clicking, editing, and blurring commits and persists the new name", () => {
    const el = setup();
    const handle = wireProfileName(el, "Adam Rosman");

    el.dispatchEvent(new Event("click", { bubbles: true }));
    expect(el.contentEditable).toBe("true");

    el.textContent = "Open Life Journey";
    el.dispatchEvent(new Event("blur"));

    expect(el.contentEditable).toBe("false");
    expect(el.textContent).toBe("Open Life Journey");
    expect(handle.getName()).toBe("Open Life Journey");
    expect(loadProfileName("Adam Rosman")).toBe("Open Life Journey");
    expect(el.getAttribute("aria-label")).toBe("Open Life Journey - click to edit");
  });

  it("Enter commits, Escape cancels back to the last committed name", () => {
    const el = setup();
    const handle = wireProfileName(el, "Adam Rosman");

    el.dispatchEvent(new Event("click", { bubbles: true }));
    el.textContent = "First rename";
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
    expect(handle.getName()).toBe("First rename");

    el.dispatchEvent(new Event("click", { bubbles: true }));
    el.textContent = "Abandoned edit";
    el.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(handle.getName()).toBe("First rename");
    expect(el.textContent).toBe("First rename");
  });

  it("clearing the name entirely falls back to the original default rather than saving blank", () => {
    const el = setup();
    const handle = wireProfileName(el, "Adam Rosman");

    el.dispatchEvent(new Event("click", { bubbles: true }));
    el.textContent = "   ";
    el.dispatchEvent(new Event("blur"));

    expect(handle.getName()).toBe("Adam Rosman");
    expect(el.textContent).toBe("Adam Rosman");
  });

  it("Space or Enter while not editing also arms editing (keyboard-only activation)", () => {
    const el = setup();
    wireProfileName(el, "Adam Rosman");

    el.dispatchEvent(new KeyboardEvent("keydown", { key: " ", cancelable: true }));
    expect(el.contentEditable).toBe("true");
  });
});
