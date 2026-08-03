/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import { loadActiveTab, saveActiveTab, renderTabBar, wireTabBar } from "./tabs.js";

describe("loadActiveTab / saveActiveTab", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to \"dashboard\" when nothing has been saved", () => {
    expect(loadActiveTab()).toBe("dashboard");
  });

  it("round-trips a saved tab", () => {
    saveActiveTab("supplements");
    expect(loadActiveTab()).toBe("supplements");
    saveActiveTab("dashboard");
    expect(loadActiveTab()).toBe("dashboard");
  });

  it("falls back to \"dashboard\" for a garbage stored value", () => {
    localStorage.setItem("hk-active-tab", "not-a-real-tab");
    expect(loadActiveTab()).toBe("dashboard");
  });
});

describe("renderTabBar", () => {
  it("builds a tablist with a Dashboard tab and a Supplements tab", () => {
    const { root, dashboardBtn, supplementsBtn } = renderTabBar();
    expect(root.getAttribute("role")).toBe("tablist");
    expect(dashboardBtn.textContent).toBe("Dashboard");
    expect(supplementsBtn.textContent).toBe("Supplements");
    expect(root.contains(dashboardBtn)).toBe(true);
    expect(root.contains(supplementsBtn)).toBe(true);
  });
});

describe("wireTabBar", () => {
  beforeEach(() => localStorage.clear());

  function setup() {
    const elements = renderTabBar();
    const dashboardPanel = document.createElement("div");
    const supplementsPanel = document.createElement("div");
    return { elements, panels: { dashboard: dashboardPanel, supplements: supplementsPanel } };
  }

  it("shows the dashboard panel and hides supplements by default", () => {
    const { elements, panels } = setup();
    wireTabBar(elements, panels);

    expect(panels.dashboard.classList.contains("hk-tab-hidden")).toBe(false);
    expect(panels.supplements.classList.contains("hk-tab-hidden")).toBe(true);
    expect(elements.dashboardBtn.classList.contains("active")).toBe(true);
    expect(elements.supplementsBtn.classList.contains("active")).toBe(false);
    expect(elements.dashboardBtn.getAttribute("aria-selected")).toBe("true");
    expect(elements.supplementsBtn.getAttribute("aria-selected")).toBe("false");
  });

  it("restores a previously-saved active tab instead of always defaulting to dashboard", () => {
    saveActiveTab("supplements");
    const { elements, panels } = setup();
    wireTabBar(elements, panels);

    expect(panels.supplements.classList.contains("hk-tab-hidden")).toBe(false);
    expect(panels.dashboard.classList.contains("hk-tab-hidden")).toBe(true);
    expect(elements.supplementsBtn.classList.contains("active")).toBe(true);
  });

  it("clicking the Supplements tab switches panels and persists the choice", () => {
    const { elements, panels } = setup();
    wireTabBar(elements, panels);

    elements.supplementsBtn.dispatchEvent(new Event("click", { bubbles: true }));

    expect(panels.supplements.classList.contains("hk-tab-hidden")).toBe(false);
    expect(panels.dashboard.classList.contains("hk-tab-hidden")).toBe(true);
    expect(elements.supplementsBtn.classList.contains("active")).toBe(true);
    expect(elements.dashboardBtn.classList.contains("active")).toBe(false);
    expect(loadActiveTab()).toBe("supplements");
  });

  it("clicking back to Dashboard switches back and persists", () => {
    const { elements, panels } = setup();
    wireTabBar(elements, panels);
    elements.supplementsBtn.dispatchEvent(new Event("click", { bubbles: true }));
    elements.dashboardBtn.dispatchEvent(new Event("click", { bubbles: true }));

    expect(panels.dashboard.classList.contains("hk-tab-hidden")).toBe(false);
    expect(panels.supplements.classList.contains("hk-tab-hidden")).toBe(true);
    expect(loadActiveTab()).toBe("dashboard");
  });

  it("calls onSwitch on initial wiring and again on every subsequent click", () => {
    const { elements, panels } = setup();
    const seen: string[] = [];
    wireTabBar(elements, panels, (tab) => seen.push(tab));

    elements.supplementsBtn.dispatchEvent(new Event("click", { bubbles: true }));
    elements.dashboardBtn.dispatchEvent(new Event("click", { bubbles: true }));

    expect(seen).toEqual(["dashboard", "supplements", "dashboard"]);
  });

  it("works with no onSwitch callback at all - it's optional", () => {
    const { elements, panels } = setup();
    expect(() => wireTabBar(elements, panels)).not.toThrow();
  });
});
