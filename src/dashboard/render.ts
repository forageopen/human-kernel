// Pure-ish DOM rendering functions - given elements and data, produce/update
// markup. No fetch, no globals beyond the DOM APIs - this is what makes most
// of this unit-testable with jsdom (render.test.ts).
//
// Boundary rule (Tension C / README): this module renders whatever it's
// given. It never calls vault-reader, evidence-parser, compiler, or store
// directly - app.ts owns that wiring and passes this module plain data.
//
// Architecture note (2026-08-02, fifth pass): the six Chart.js cards and the
// domain-grouped Parameter card grid are GONE - scrapped per direct
// instruction. The heatmap is the one visualization that survives, and it
// now lives inside a persistent widget canvas (index.html's .hk-canvas)
// alongside four new cards (prayer times, time window, best-time-for,
// notepad) that do NOT depend on vault data and are wired once by main.ts,
// never rebuilt on a vault switch. renderDashboard below only ever touches
// the vault-REACTIVE parts (source banner, warnings, empty-state, and the
// heatmap's content specifically) - if it destroyed the whole canvas on
// every vault switch/rescan, the prayer/notepad/time-window widgets' live
// wiring (timers, event listeners) would be silently orphaned the moment a
// visitor switched views. Evidence detail now opens keyed by DATE (a
// heatmap cell click) rather than by Parameter, since there's no more
// Parameter card to click - see renderDrawer.

import type { Evidence, HumanKernelIndex } from "../types.js";
import type { ParseWarning } from "../evidence-parser/index.js";
import { renderEvidenceHeatmap } from "./charts.js";
import { makeDraggable } from "./draggable.js";

export type ViewSource = "sample" | "own-vault";

export function renderUnsupportedBrowser(root: HTMLElement): void {
  root.innerHTML = "";
  const box = document.createElement("div");
  box.className = "hk-empty";
  box.innerHTML = `
    <div class="hk-empty-icon">⚠</div>
    <div><b>This browser can't open a folder directly</b></div>
    <div class="hk-muted">Try Chrome, Edge, or Brave instead - the reference profile below still works here either way.</div>
  `;
  root.appendChild(box);
}

export function renderEmptyState(root: HTMLElement, onPickVault: () => void): void {
  root.innerHTML = "";
  const box = document.createElement("div");
  box.className = "hk-empty";
  box.innerHTML = `
    <div class="hk-empty-icon">◌</div>
    <div><b>No notes connected yet</b></div>
    <div class="hk-muted">Point this at a folder of your own notes and it builds your profile from them, right in your browser. Nothing is uploaded anywhere.</div>
  `;
  const btn = document.createElement("button");
  btn.className = "hk-primary";
  btn.textContent = "Choose a folder";
  btn.addEventListener("click", onPickVault);
  box.appendChild(btn);
  root.appendChild(box);
}

export function renderNotice(root: HTMLElement, message: string): void {
  let toast = root.querySelector<HTMLElement>(".hk-lock-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "hk-lock-toast";
    root.appendChild(toast);
  }
  toast.innerHTML = "";
  const msg = document.createElement("div");
  msg.textContent = message;
  toast.appendChild(msg);
  const closeBtn = document.createElement("span");
  closeBtn.className = "hk-close";
  closeBtn.textContent = "×";
  closeBtn.tabIndex = 0;
  closeBtn.setAttribute("role", "button");
  closeBtn.setAttribute("aria-label", "Dismiss");
  onActivate(closeBtn, () => toast?.classList.remove("active"));
  toast.appendChild(closeBtn);
  toast.classList.add("active");
}

function onActivate(el: HTMLElement, handler: () => void): void {
  el.addEventListener("click", handler);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  });
}

function renderWarningsPanel(warnings: ParseWarning[]): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "hk-card";
  const label = document.createElement("div");
  label.className = "hk-label";
  label.textContent = `Some notes couldn't be read (${warnings.length})`;
  panel.appendChild(label);
  for (const w of warnings) {
    const row = document.createElement("div");
    row.className = "hk-warn-row";
    row.innerHTML = `<span class="hk-tag">Skipped</span><span>${w.sourceFile} (${w.sourceRef}): ${w.message}</span>`;
    panel.appendChild(row);
  }
  return panel;
}

export interface DashboardCallbacks {
  onOpenDate: (dateKey: string, evidenceThatDay: Evidence[]) => void;
  onRescan: () => void;
  onConnectOwnVault: () => void;
  onViewSample: () => void;
}

function renderSourceBanner(viewing: ViewSource, callbacks: DashboardCallbacks): HTMLElement {
  const banner = document.createElement("div");
  banner.className = "hk-source-banner";

  const text = document.createElement("span");
  const link = document.createElement("button");
  link.className = "hk-link-btn";

  if (viewing === "sample") {
    text.textContent = "You're looking at a real example profile - Adam's own.";
    link.textContent = "Use my own notes instead";
    link.addEventListener("click", callbacks.onConnectOwnVault);
  } else {
    text.textContent = "Showing your own notes.";
    link.textContent = "Back to the example profile";
    link.addEventListener("click", callbacks.onViewSample);
  }

  banner.appendChild(text);
  banner.appendChild(link);
  return banner;
}

/** Wires click-to-open on every day that actually has evidence - a day with
 * nothing recorded has nothing to show, so it stays inert (title/hover
 * tooltip only, same as before). */
function wireHeatmapClicks(heatmapEl: HTMLElement, index: HumanKernelIndex, callbacks: DashboardCallbacks): void {
  const cells = heatmapEl.querySelectorAll<HTMLElement>(".hk-heatmap-cell:not(.empty)");
  for (const cell of cells) {
    const dateKey = cell.dataset.date;
    if (!dateKey || cell.classList.contains("level-0")) continue;
    cell.style.cursor = "pointer";
    onActivate(cell, () => {
      const matches = index.evidence.filter((e) => e.timestamp.slice(0, 10) === dateKey);
      callbacks.onOpenDate(dateKey, matches);
    });
  }
}

/** Renders the vault-reactive part only: source banner, optional rescan
 * toolbar, warnings, empty-state message, and the heatmap's content
 * (heatmapBody is the stable #hk-heatmap-body element inside the persistent
 * widget canvas - see index.html - its surrounding widget chrome is never
 * touched here). The other four widgets (prayer, time window, best-time-for,
 * notepad) are wired once by main.ts and are not part of this function at
 * all. */
export function renderDashboard(
  appRoot: HTMLElement,
  heatmapBody: HTMLElement,
  index: HumanKernelIndex,
  warnings: ParseWarning[],
  viewing: ViewSource,
  callbacks: DashboardCallbacks
): void {
  appRoot.innerHTML = "";
  appRoot.appendChild(renderSourceBanner(viewing, callbacks));

  if (viewing === "own-vault") {
    const toolbar = document.createElement("div");
    toolbar.className = "hk-toolbar";
    const rescanBtn = document.createElement("button");
    rescanBtn.className = "hk-primary";
    rescanBtn.textContent = "Refresh from my notes";
    rescanBtn.addEventListener("click", callbacks.onRescan);
    toolbar.appendChild(rescanBtn);
    appRoot.appendChild(toolbar);
  }

  if (warnings.length > 0) {
    appRoot.appendChild(renderWarningsPanel(warnings));
  }

  if (index.parameters.length === 0) {
    const none = document.createElement("div");
    none.className = "hk-muted";
    none.textContent =
      viewing === "sample"
        ? "The example profile is still being put together - check back soon."
        : "Nothing usable was found in those notes yet.";
    appRoot.appendChild(none);
  }

  heatmapBody.innerHTML = "";
  const heatmap = renderEvidenceHeatmap(index.evidence);
  wireHeatmapClicks(heatmap, index, callbacks);
  heatmapBody.appendChild(heatmap);
}

/** Evidence detail popup - resizable (native `resize:both`, styles.css),
 * movable (drag via .hk-drawer-handle, wired exactly once - see below),
 * closable (X, click or Enter/Space). Opens on a heatmap day click now,
 * showing every real Evidence entry captured that day - "Evidence for a
 * Parameter" doesn't apply anymore since there's no more Parameter card to
 * click into this from.
 *
 * The handle element is created once and kept alive across every call - an
 * earlier version cleared the whole drawer (innerHTML = "") on each render,
 * which destroyed the handle makeDraggable had already wired listeners to
 * and replaced it with a fresh, unwired one, silently breaking drag after
 * the first day you opened. Only the content BELOW the handle gets rebuilt
 * on each call now. */
export function renderDrawer(drawer: HTMLElement, title: string, evidence: Evidence[], onClose: () => void): void {
  let handle = drawer.querySelector<HTMLElement>(".hk-drawer-handle");
  if (!handle) {
    handle = document.createElement("div");
    handle.className = "hk-drawer-handle";
    handle.innerHTML = `<span class="hk-widget-grip">⠿⠿ drag</span>`;
    drawer.appendChild(handle);
    makeDraggable(drawer, handle, document.body, "evidence-drawer");
  }
  for (const child of Array.from(drawer.children)) {
    if (child !== handle) child.remove();
  }

  const label = document.createElement("div");
  label.className = "hk-label";
  label.textContent = title;
  drawer.appendChild(label);

  if (evidence.length === 0) {
    const empty = document.createElement("div");
    empty.className = "hk-muted";
    empty.textContent = "Nothing recorded for this day.";
    drawer.appendChild(empty);
  }

  for (const ev of evidence) {
    const row = document.createElement("div");
    row.className = "hk-evidence-row";
    row.innerHTML = `<span class="hk-src">${ev.sourceFile}</span><span>${ev.observation}</span><span class="hk-meta">${ev.timestamp.slice(0, 10)}</span>`;
    drawer.appendChild(row);
  }

  const closeBtn = document.createElement("span");
  closeBtn.className = "hk-close";
  closeBtn.textContent = "×";
  closeBtn.tabIndex = 0;
  closeBtn.setAttribute("role", "button");
  closeBtn.setAttribute("aria-label", "Close");
  onActivate(closeBtn, onClose);
  drawer.appendChild(closeBtn);

  drawer.classList.add("active");
}

export function closeDrawer(drawer: HTMLElement): void {
  drawer.classList.remove("active");
}
