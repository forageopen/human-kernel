// Tab system (2026-08-03, direct request: "lets have a second tab in
// addition to this... like chrome tab, 2nd tab with black background &
// taskbar with this cards toggle"). Two tabs: the existing dashboard
// (unchanged - profile header, widget canvas, background layers, avatars,
// its own scene taskbar) and the new Cognitive Supplement Dashboard, Phase
// 0 only (supplements.ts/supplement-card.ts/reminder.ts, its own separate
// canvas + scene taskbar). This file owns ONLY the switching mechanism -
// which one panel is visible, and remembering the choice - not either
// panel's content.
//
// index.html wraps ALL of tab 1's content (background layers, avatars,
// widget canvas, everything) inside one #hk-tab1-panel element, and tab 2's
// content inside #hk-tab2-panel - so toggling .hk-tab-hidden (display:none)
// on whichever one isn't active already hides everything inside it in one
// shot, background animation loops included (a display:none ancestor hides
// fixed-position descendants too - they're only exempt from clipping/scroll,
// not from being removed from rendering entirely). That's why applyTab
// below only ever touches the two panels and the two buttons - there is
// nothing else that needs hiding. onSwitch is offered purely as an optional
// extension point for a future caller that needs to react to the switch for
// some other reason (e.g. pausing an animation loop for battery/CPU, not
// just visibility) - main.ts doesn't currently pass one, since Phase 0 has
// no requirement to do more than hide.

export type TabId = "dashboard" | "supplements";

const STORAGE_KEY = "hk-active-tab";
const DEFAULT_TAB: TabId = "dashboard";

export function loadActiveTab(): TabId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "supplements" ? "supplements" : DEFAULT_TAB;
  } catch {
    return DEFAULT_TAB;
  }
}

export function saveActiveTab(tab: TabId): void {
  try {
    localStorage.setItem(STORAGE_KEY, tab);
  } catch {
    // no persistence available this session
  }
}

export interface TabBarElements {
  root: HTMLElement;
  dashboardBtn: HTMLElement;
  supplementsBtn: HTMLElement;
}

/** Builds the tab strip only - two buttons, no page content. Always mounted
 * as a sibling of both panels (never inside either one), so it stays
 * visible and clickable regardless of which tab is currently showing -
 * hiding tab 1's content can never also hide the only way back to it. */
export function renderTabBar(): TabBarElements {
  const root = document.createElement("div");
  root.className = "hk-tab-bar";
  root.setAttribute("role", "tablist");
  root.setAttribute("aria-label", "Dashboards");

  const dashboardBtn = document.createElement("button");
  dashboardBtn.type = "button";
  dashboardBtn.className = "hk-tab-btn";
  dashboardBtn.textContent = "Dashboard";
  dashboardBtn.setAttribute("role", "tab");

  const supplementsBtn = document.createElement("button");
  supplementsBtn.type = "button";
  supplementsBtn.className = "hk-tab-btn";
  supplementsBtn.textContent = "Supplements";
  supplementsBtn.setAttribute("role", "tab");

  root.appendChild(dashboardBtn);
  root.appendChild(supplementsBtn);
  return { root, dashboardBtn, supplementsBtn };
}

/** Wires tab switching: shows exactly one of `panels.dashboard`/
 * `panels.supplements` at a time (`.hk-tab-hidden`), keeps both buttons'
 * `active` class/`aria-selected` truthful, restores whichever tab was last
 * open, and persists every change. `onSwitch` fires after every switch
 * (including the initial restore) - main.ts uses it to also hide/show
 * things this file has no knowledge of (background layers, avatars). */
export function wireTabBar(
  elements: TabBarElements,
  panels: { dashboard: HTMLElement; supplements: HTMLElement },
  onSwitch?: (tab: TabId) => void
): void {
  const { dashboardBtn, supplementsBtn } = elements;

  const applyTab = (tab: TabId): void => {
    const showDashboard = tab === "dashboard";
    panels.dashboard.classList.toggle("hk-tab-hidden", !showDashboard);
    panels.supplements.classList.toggle("hk-tab-hidden", showDashboard);
    dashboardBtn.classList.toggle("active", showDashboard);
    supplementsBtn.classList.toggle("active", !showDashboard);
    dashboardBtn.setAttribute("aria-selected", String(showDashboard));
    supplementsBtn.setAttribute("aria-selected", String(!showDashboard));
    onSwitch?.(tab);
  };

  dashboardBtn.addEventListener("click", () => {
    saveActiveTab("dashboard");
    applyTab("dashboard");
  });
  supplementsBtn.addEventListener("click", () => {
    saveActiveTab("supplements");
    applyTab("supplements");
  });

  applyTab(loadActiveTab());
}
