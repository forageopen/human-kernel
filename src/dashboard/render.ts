// Pure DOM rendering functions - given a root element and data, produce/update
// markup. No fetch, no file-system access, no globals beyond the DOM APIs
// themselves - this is what makes these unit-testable with jsdom (render.test.ts).
//
// Boundary rule (Tension C / README): this module renders whatever it's given.
// It never calls vault-reader, evidence-parser, compiler, or store directly -
// app.ts owns that wiring and passes this module plain data.
//
// No frontend framework has been chosen (that would be an unmade architectural
// decision - see docs/sprint-0-walkthrough-simulated.md). Built with vanilla DOM
// APIs for the MVD specifically to avoid quietly pre-committing to React/Vue/
// Svelte without that ever being an actual decision anyone signed off on.

import type { HumanKernelIndex, Parameter } from "../types.js";
import type { ParseWarning } from "../evidence-parser/index.js";

/** Brief v2 §9, quoted exactly: "Immersive mode: no scroll, ambient
 * command-center view. Observation only." / "Inspect mode: scroll enabled,
 * evidence drawer active. Investigation." Screen = awareness layer -> Drawer
 * = investigation layer -> Evidence = verification layer. This type is UI
 * state, not part of the canonical data model, so it lives here and not in
 * types.ts. */
export type DashboardMode = "immersive" | "inspect";

export function renderUnsupportedBrowser(root: HTMLElement): void {
  root.innerHTML = "";
  const box = document.createElement("div");
  box.className = "hk-empty";
  box.innerHTML = `
    <div class="hk-empty-icon">⚠</div>
    <div><b>Browser not supported</b></div>
    <div class="hk-muted">Human Kernel needs Chrome, Edge, or Brave (ADR-0003) - the File System
    Access API isn't available here. Open this page in one of those browsers to continue.</div>
  `;
  root.appendChild(box);
}

export function renderEmptyState(root: HTMLElement, onPickVault: () => void): void {
  root.innerHTML = "";
  const box = document.createElement("div");
  box.className = "hk-empty";
  box.innerHTML = `
    <div class="hk-empty-icon">◌</div>
    <div><b>No vault connected</b></div>
    <div class="hk-muted">Human Kernel reads a local folder of .md files directly in your
    browser. Nothing is uploaded anywhere.</div>
  `;
  const btn = document.createElement("button");
  btn.className = "hk-primary";
  btn.textContent = "Open Vault Folder";
  btn.addEventListener("click", onPickVault);
  box.appendChild(btn);
  root.appendChild(box);
}

function renderWarningsPanel(warnings: ParseWarning[]): HTMLElement {
  const panel = document.createElement("div");
  panel.className = "hk-card";
  const label = document.createElement("div");
  label.className = "hk-label";
  label.textContent = `PARSE WARNINGS (${warnings.length})`;
  panel.appendChild(label);
  for (const w of warnings) {
    const row = document.createElement("div");
    row.className = "hk-warn-row";
    row.innerHTML = `<span class="hk-tag">WARNING</span><span>${w.sourceFile} (${w.sourceRef}): ${w.message}</span>`;
    panel.appendChild(row);
  }
  return panel;
}

function renderParameterCard(param: Parameter, onOpen: (param: Parameter) => void): HTMLElement {
  const card = document.createElement("div");
  card.className = "hk-param-card" + (param.status === "disputed" ? " disputed" : "");
  card.dataset.parameterId = param.id;

  const title = document.createElement("div");
  title.className = "hk-param-title";
  title.innerHTML = `<b>${param.name}</b><span class="hk-status-pill ${param.status}">${param.status}</span>`;
  card.appendChild(title);

  const conf = document.createElement("div");
  conf.className = "hk-conf";
  conf.textContent = `Confidence ${param.confidence.toFixed(2)} — ${param.evidenceIds.length} linked evidence. Click to inspect.`;
  card.appendChild(conf);

  card.addEventListener("click", () => onOpen(param));
  return card;
}

export interface DashboardCallbacks {
  onOpenParameter: (param: Parameter) => void;
  onRescan: () => void;
  onModeChange: (mode: DashboardMode) => void;
}

function renderModeToggle(mode: DashboardMode, onModeChange: (mode: DashboardMode) => void): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "hk-mode-toggle";
  (["immersive", "inspect"] as const).forEach((m) => {
    const btn = document.createElement("button");
    btn.className = "hk-mode-btn" + (mode === m ? " active" : "");
    btn.textContent = m === "immersive" ? "Immersive" : "Inspect";
    btn.title =
      m === "immersive"
        ? "Observation only - no scroll, drawer closed (Brief v2 §9)"
        : "Investigation - scroll and evidence drawer enabled (Brief v2 §9)";
    btn.addEventListener("click", () => onModeChange(m));
    wrap.appendChild(btn);
  });
  return wrap;
}

/** Renders the populated dashboard: grouped-by-domain parameter cards + warnings, if any.
 * `mode` only controls presentation here (toggle state, scroll-lock class, cursor
 * affordance on cards) - app.ts owns the actual behavioral gating of whether a
 * card click is allowed to open the evidence drawer (Immersive = "observation
 * only", Brief v2 §9). */
export function renderDashboard(
  root: HTMLElement,
  index: HumanKernelIndex,
  warnings: ParseWarning[],
  mode: DashboardMode,
  callbacks: DashboardCallbacks
): void {
  root.innerHTML = "";
  document.body.classList.toggle("hk-immersive", mode === "immersive");

  const toolbar = document.createElement("div");
  toolbar.className = "hk-toolbar";
  toolbar.appendChild(renderModeToggle(mode, callbacks.onModeChange));

  const rescanBtn = document.createElement("button");
  rescanBtn.className = "hk-primary";
  rescanBtn.textContent = "Re-scan Vault";
  rescanBtn.addEventListener("click", callbacks.onRescan);
  toolbar.appendChild(rescanBtn);
  root.appendChild(toolbar);

  if (warnings.length > 0) {
    root.appendChild(renderWarningsPanel(warnings));
  }

  const byDomain = new Map<string, Parameter[]>();
  for (const param of index.parameters) {
    const list = byDomain.get(param.domain) ?? [];
    list.push(param);
    byDomain.set(param.domain, list);
  }

  const grid = document.createElement("div");
  grid.className = "hk-grid " + mode; // mode class only drives cursor affordance (CSS) - see styles.css
  for (const [domain, params] of byDomain) {
    const card = document.createElement("div");
    card.className = "hk-card";
    const label = document.createElement("div");
    label.className = "hk-label";
    label.textContent = `DOMAIN: ${domain.toUpperCase()}`;
    card.appendChild(label);
    for (const param of params) {
      card.appendChild(renderParameterCard(param, callbacks.onOpenParameter));
    }
    grid.appendChild(card);
  }
  root.appendChild(grid);

  if (index.parameters.length === 0) {
    const none = document.createElement("div");
    none.className = "hk-muted";
    none.textContent = "Vault parsed, but no [!evidence] blocks were found (Spec v0.1 §4).";
    root.appendChild(none);
  }
}

/** Evidence drawer - Brief v2 §10 principle 2 ("every claim needs a witness") made visible. */
export function renderDrawer(
  root: HTMLElement,
  param: Parameter,
  index: HumanKernelIndex,
  onClose: () => void
): void {
  let drawer = root.querySelector<HTMLElement>(".hk-drawer");
  if (!drawer) {
    drawer = document.createElement("div");
    drawer.className = "hk-drawer";
    root.appendChild(drawer);
  }

  const evidence = param.evidenceIds
    .map((id) => index.evidence.find((e) => e.id === id))
    .filter((e): e is NonNullable<typeof e> => e !== undefined);

  drawer.innerHTML = "";
  const label = document.createElement("div");
  label.className = "hk-label";
  label.textContent = `EVIDENCE — "${param.name}"`;
  drawer.appendChild(label);

  for (const ev of evidence) {
    const row = document.createElement("div");
    row.className = "hk-evidence-row";
    row.innerHTML = `<span class="hk-src">${ev.sourceFile}${ev.sourceRef ? "#" + ev.sourceRef : ""}</span><span>${ev.observation}</span><span class="hk-meta">conf ${ev.confidence.toFixed(2)} · ${ev.timestamp.slice(0, 10)}</span>`;
    drawer.appendChild(row);
  }

  const closeBtn = document.createElement("span");
  closeBtn.className = "hk-close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", onClose);
  drawer.appendChild(closeBtn);

  drawer.classList.add("active");
}

export function closeDrawer(root: HTMLElement): void {
  const drawer = root.querySelector<HTMLElement>(".hk-drawer");
  drawer?.classList.remove("active");
}

/** Immersive mode is "observation only" (Brief v2 SS9) - clicking a card must
 * not just silently do nothing. This says why, and lets you act on it in one
 * click rather than making you find the mode toggle yourself. */
export function renderImmersiveLockPrompt(root: HTMLElement, onSwitchToInspect: () => void): void {
  let toast = root.querySelector<HTMLElement>(".hk-lock-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "hk-lock-toast";
    root.appendChild(toast);
  }
  toast.innerHTML = "";

  const msg = document.createElement("div");
  msg.textContent = "Immersive mode is observation only - evidence isn't reachable here.";
  toast.appendChild(msg);

  const btn = document.createElement("button");
  btn.className = "hk-lock-toast-btn";
  btn.textContent = "Switch to Inspect";
  btn.addEventListener("click", onSwitchToInspect);
  toast.appendChild(btn);

  const closeBtn = document.createElement("span");
  closeBtn.className = "hk-close";
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => toast?.classList.remove("active"));
  toast.appendChild(closeBtn);

  toast.classList.add("active");
}

/** Dismisses the Immersive lock prompt - mirrors closeDrawer(). Also called
 * automatically by renderDashboard's own root.innerHTML reset on re-render. */
export function closeImmersiveLockPrompt(root: HTMLElement): void {
  const toast = root.querySelector<HTMLElement>(".hk-lock-toast");
  toast?.classList.remove("active");
}
