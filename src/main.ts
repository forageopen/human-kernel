// Browser entry point. Loaded by index.html as a module script.
//
// Wiring order matters here: theme/particles/clock/avatar are page chrome
// with no dependency on vault data, so they're wired immediately. The five
// widget-canvas cards split into two kinds - wireBrowserUI owns the one that
// IS vault-reactive (the heatmap, via heatmapBody) as part of its normal
// render cycle; the other four (prayer, time window, best-time-for, notepad)
// don't depend on vault data at all and are wired directly here, once, so
// they're never destroyed by a vault switch or rescan (see render.ts's
// top-of-file note for why that split exists). Every widget's drag+resize
// wiring (makeDraggable) also happens here, once, regardless of which of the
// two categories it's in.
import { wireBrowserUI } from "./dashboard/app.js";
import { startLiveClock } from "./dashboard/clock.js";
import { initParticles } from "./dashboard/particles.js";
import { wireThemeToggle } from "./dashboard/theme.js";
import { wireAvatar } from "./dashboard/avatar.js";
import { makeDraggable } from "./dashboard/draggable.js";
import { startPrayerCard } from "./dashboard/prayer-times.js";
import { startTimeWindowCard, startBestTimeForCard } from "./dashboard/time-window.js";
import { renderNotepad, wireNotepad } from "./dashboard/notepad.js";

const root = document.getElementById("app");
if (!root) {
  throw new Error("index.html is missing the #app root element");
}

// Footer clock lives outside #app - it's page chrome, not dashboard data, so
// it's wired directly here rather than through render.ts/app.ts.
const clockEl = document.getElementById("hk-live-clock");
if (clockEl) startLiveClock(clockEl);

// Ambient background particles - same reasoning as the clock: page chrome,
// not dashboard data, wired directly rather than through render.ts/app.ts.
const particlesEl = document.getElementById("hk-particles");
if (particlesEl) initParticles(particlesEl);

// Light/dark toggle - persists in localStorage, defaults to dark (theme.ts).
const themeToggleEl = document.getElementById("hk-theme-toggle");
if (themeToggleEl) wireThemeToggle(themeToggleEl);

// Generative avatar - click (or Enter/Space) regenerates and remembers the
// new one.
const avatarWrapEl = document.getElementById("hk-avatar-wrap");
if (avatarWrapEl) wireAvatar(avatarWrapEl);

// Widget canvas: drag+resize wiring for all five cards, once. Native
// `resize:both` (styles.css) needs no JS at all; makeDraggable adds the
// pointer-driven header drag and persists both to localStorage per widget id.
const canvasEl = document.getElementById("hk-canvas");
if (canvasEl) {
  const widgets: Array<[id: string, handleId: string]> = [
    ["heatmap", "hk-heatmap-handle"],
    ["prayer", "hk-prayer-handle"],
    ["time-window", "hk-time-window-handle"],
    ["best-time", "hk-best-time-handle"],
    ["notepad", "hk-notepad-handle"],
  ];
  for (const [id, handleId] of widgets) {
    const widgetEl = canvasEl.querySelector<HTMLElement>(`[data-widget-id="${id}"]`);
    const handleEl = document.getElementById(handleId);
    if (widgetEl && handleEl) makeDraggable(widgetEl, handleEl, canvasEl, id);
  }
}

// Upcoming Prayer - real JAKIM data (api.waktusolat.app), fetched at most
// once a day and re-rendered every 30s just to keep "next prayer" current.
const prayerBodyEl = document.getElementById("hk-prayer-body");
if (prayerBodyEl) startPrayerCard(prayerBodyEl);

// Time Window / Best Time For - illustrative six-window model, flagged as
// pending the real Adaptive Daily OS document; re-rendered every 60s so the
// "current window" highlight stays live without a busy loop.
const timeWindowBodyEl = document.getElementById("hk-time-window-body");
if (timeWindowBodyEl) startTimeWindowCard(timeWindowBodyEl);

const bestTimeBodyEl = document.getElementById("hk-best-time-body");
if (bestTimeBodyEl) startBestTimeForCard(bestTimeBodyEl);

// Notepad - contenteditable + highlighter, persists to localStorage as the
// visitor types.
const notepadBodyEl = document.getElementById("hk-notepad-body");
if (notepadBodyEl) {
  const { root: notepadRoot, area, swatches } = renderNotepad();
  notepadBodyEl.appendChild(notepadRoot);
  wireNotepad(notepadRoot, area, swatches);
}

// Vault-reactive dashboard: source banner/warnings/heatmap content, plus the
// evidence drawer and profile-header stats. heatmapBody and drawerEl are the
// stable elements described above - wireBrowserUI/render.ts fill them, never
// recreate them.
const heatmapBodyEl = document.getElementById("hk-heatmap-body");
const drawerEl = document.getElementById("hk-drawer");
const statEvidenceEl = document.getElementById("hk-stat-evidence");
const statParametersEl = document.getElementById("hk-stat-parameters");

if (!heatmapBodyEl) throw new Error("index.html is missing #hk-heatmap-body");
if (!drawerEl) throw new Error("index.html is missing #hk-drawer");

void wireBrowserUI(
  root,
  heatmapBodyEl,
  drawerEl,
  statEvidenceEl && statParametersEl ? { evidence: statEvidenceEl, parameters: statParametersEl } : undefined
);
