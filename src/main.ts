// Browser entry point. Loaded by index.html as a module script.
//
// 2026-08-02, current pass: every card on the canvas - including all 5
// independent Notes slots and the two new Layer-3 cards (Cognitive
// Currents, Unplanned Activity Check) - is now created dynamically through
// draggable.ts's createWidget, rather than looking up static per-widget
// markup in index.html. That gives every card the same chrome for free
// (drag, native resize, a close button, and a visibility state the scene
// taskbar can also flip) with no per-card boilerplate. A purple mascot
// (mascot.ts) and a second, autonomous dog avatar (dog-avatar.ts) roam the
// page; two more background layers (sakura.ts, fireworks.ts) join the
// original particle field and star-chase; and the left-edge scene taskbar
// (scene-panel.ts) lists every card AND both avatars, plus a shared
// background-motion speed slider and a firework color-count slider.
//
// Wiring order still matters: page chrome (clock/particles/starchase/
// sakura/fireworks/theme/avatar/mascot/dog) has no dependency on vault data
// and is wired immediately. The widget canvas is built next, entirely from
// this file - only the heatmap card is vault-reactive (wireBrowserUI/
// render.ts fill its body on every load/rescan/view-switch); every other
// card's content is set once, right after creation, and is never touched
// again by a vault switch (see render.ts's top-of-file note for why that
// split exists).
import { wireBrowserUI } from "./dashboard/app.js";
import { startLiveClock } from "./dashboard/clock.js";
import { initParticles } from "./dashboard/particles.js";
import { initStarChase } from "./dashboard/starchase.js";
import { initSakura } from "./dashboard/sakura.js";
import { initFireworks } from "./dashboard/fireworks.js";
import { wireThemeToggle } from "./dashboard/theme.js";
import { wireAvatar } from "./dashboard/avatar.js";
import { wireMascot } from "./dashboard/mascot.js";
import { wireDogAvatar } from "./dashboard/dog-avatar.js";
import { createWidget, loadVisible, saveVisible, type WidgetHandle } from "./dashboard/draggable.js";
import { startPrayerCard } from "./dashboard/prayer-times.js";
import { startTimeWindowCard, startBestTimeForCard } from "./dashboard/time-window.js";
import { renderNotepad, wireNotepad } from "./dashboard/notepad.js";
import {
  renderCognitiveCurrentsCard,
  wireCognitiveCurrentsCard,
  renderUnplannedActivityCard,
  wireUnplannedActivityCard,
} from "./dashboard/cognitive-currents.js";
import { renderScenePanel, wireScenePanel, loadFireworkColorCount, type SceneCardEntry } from "./dashboard/scene-panel.js";

const root = document.getElementById("app");
if (!root) {
  throw new Error("index.html is missing the #app root element");
}

// ---- Page chrome: no dependency on vault data, wired immediately. ----

const clockEl = document.getElementById("hk-live-clock");
if (clockEl) startLiveClock(clockEl);

const particlesEl = document.getElementById("hk-particles");
if (particlesEl) initParticles(particlesEl);

const starchaseEl = document.getElementById("hk-starchase");
if (starchaseEl) initStarChase(starchaseEl);

const sakuraEl = document.getElementById("hk-sakura");
if (sakuraEl) initSakura(sakuraEl);

const fireworksEl = document.getElementById("hk-fireworks");
const fireworksController = fireworksEl ? initFireworks(fireworksEl, loadFireworkColorCount()) : undefined;

const themeToggleEl = document.getElementById("hk-theme-toggle");
if (themeToggleEl) wireThemeToggle(themeToggleEl);

const avatarWrapEl = document.getElementById("hk-avatar-wrap");
if (avatarWrapEl) wireAvatar(avatarWrapEl);

const mascotEl = document.getElementById("hk-mascot");
if (mascotEl) wireMascot(mascotEl);

const dogEl = document.getElementById("hk-dog");
if (dogEl) wireDogAvatar(dogEl);

// Both roaming avatars get an individual show/hide switch in the scene
// taskbar (below), same loadVisible/saveVisible + .hk-widget-hidden
// mechanism every card's close button already uses - applied directly to
// their container elements here since neither is a createWidget canvas card.
if (mascotEl) mascotEl.classList.toggle("hk-widget-hidden", !loadVisible("mascot", true));
if (dogEl) dogEl.classList.toggle("hk-widget-hidden", !loadVisible("dog-avatar", true));

// ---- Widget canvas: every card is created through createWidget, so drag,
// resize, close, and scene-taskbar show/hide behave identically everywhere.
// The rects below are only a first-time-visitor starting layout - dragging
// or resizing any card persists per-widget-id (draggable.ts) and overrides
// this on every later visit. ----

const canvasEl = document.getElementById("hk-canvas");
const widgets: WidgetHandle[] = [];

if (canvasEl) {
  const heatmapWidget = createWidget(canvasEl, "heatmap", "Activity", {
    defaultRect: { left: 0, top: 0, width: 560, height: 250 },
  });
  widgets.push(heatmapWidget);

  // Upcoming Prayer - real JAKIM data (api.waktusolat.app), fetched at most
  // once a day and re-rendered every 30s just to keep "next prayer" current.
  const prayerWidget = createWidget(canvasEl, "prayer", "Upcoming Prayer", {
    defaultRect: { left: 580, top: 0, width: 280, height: 400 },
  });
  widgets.push(prayerWidget);
  startPrayerCard(prayerWidget.body);

  // Time Window / Best Time For - real content from Adam's Adaptive Daily
  // OS (Six-Window ROI Map); re-rendered every 60s so the "current window"
  // highlight stays live without a busy loop.
  const timeWindowWidget = createWidget(canvasEl, "time-window", "Time Window", {
    defaultRect: { left: 0, top: 270, width: 270, height: 260 },
  });
  widgets.push(timeWindowWidget);
  startTimeWindowCard(timeWindowWidget.body);

  const bestTimeWidget = createWidget(canvasEl, "best-time", "Best Time For", {
    defaultRect: { left: 290, top: 270, width: 270, height: 260 },
  });
  widgets.push(bestTimeWidget);
  startBestTimeForCard(bestTimeWidget.body);

  // Layer 3 of the Adaptive Daily OS - the mode-switch engine underneath
  // the six windows, plus its own 3-question retrospective test for
  // unplanned activity. Both static-content-at-creation, no timer.
  const cognitiveCurrentsWidget = createWidget(canvasEl, "cognitive-currents", "Cognitive Currents", {
    defaultRect: { left: 0, top: 550, width: 270, height: 260 },
  });
  widgets.push(cognitiveCurrentsWidget);
  const { root: ccRoot, mindBtn, handBtn } = renderCognitiveCurrentsCard();
  cognitiveCurrentsWidget.body.appendChild(ccRoot);
  wireCognitiveCurrentsCard(mindBtn, handBtn);

  const unplannedWidget = createWidget(canvasEl, "unplanned-activity", "Unplanned Activity Check", {
    defaultRect: { left: 290, top: 550, width: 270, height: 300 },
  });
  widgets.push(unplannedWidget);
  const { root: uaRoot, checkboxes, noteInput, logBtn, verdict, list } = renderUnplannedActivityCard();
  unplannedWidget.body.appendChild(uaRoot);
  wireUnplannedActivityCard(checkboxes, noteInput, logBtn, verdict, list);

  // Up to 5 independent Notes cards (2026-08-02, direct request: "give
  // option to add more notes card (limit to 5)"). All 5 are created now, so
  // "adding" one is just enabling it from the scene taskbar - reusing the
  // same show/hide mechanism every other card already has, rather than a
  // separate "add card" flow. Only slot 1 is visible by default; 2-5 start
  // hidden and stay that way until a visitor turns one on.
  const notesLayout: Array<{ left: number; top: number }> = [
    { left: 580, top: 420 },
    { left: 870, top: 420 },
    { left: 580, top: 700 },
    { left: 870, top: 700 },
    { left: 580, top: 980 },
  ];
  for (let i = 0; i < 5; i++) {
    const slot = i + 1;
    const id = `notepad-${slot}`;
    const pos = notesLayout[i]!;
    const notesWidget = createWidget(canvasEl, id, slot === 1 ? "Notes" : `Notes ${slot}`, {
      defaultRect: { left: pos.left, top: pos.top, width: 280, height: 260 },
      defaultVisible: slot === 1,
    });
    widgets.push(notesWidget);
    const { root: notepadRoot, area, swatches, formatButtons } = renderNotepad(String(slot));
    notesWidget.body.appendChild(notepadRoot);
    wireNotepad(String(slot), notepadRoot, area, swatches, formatButtons);
  }
}

// ---- Scene taskbar: lists every card above PLUS both roaming avatars, with
// a live show/hide switch for each; also carries the shared background-
// motion speed slider and the firework color-count slider. Card entries are
// built straight from the widgets array so they can never fall out of sync
// with what's actually on the canvas; the two avatars are appended the same
// way any other entry works, just backed by loadVisible/saveVisible +
// .hk-widget-hidden on their own elements instead of a WidgetHandle. ----
{
  const entries: SceneCardEntry[] = widgets.map((w) => ({
    id: w.id,
    label: w.title,
    isVisible: w.isVisible,
    setVisible: w.setVisible,
  }));

  if (mascotEl) {
    entries.push({
      id: "mascot",
      label: "Mascot",
      isVisible: () => loadVisible("mascot", true),
      setVisible: (visible) => {
        saveVisible("mascot", visible);
        mascotEl.classList.toggle("hk-widget-hidden", !visible);
      },
    });
  }
  if (dogEl) {
    entries.push({
      id: "dog-avatar",
      label: "Dog",
      isVisible: () => loadVisible("dog-avatar", true),
      setVisible: (visible) => {
        saveVisible("dog-avatar", visible);
        dogEl.classList.toggle("hk-widget-hidden", !visible);
      },
    });
  }

  const { root: panelRoot, tab, toggleInputs, speedSlider, fireworkSlider } = renderScenePanel(entries);
  document.body.appendChild(panelRoot);
  wireScenePanel(panelRoot, tab, toggleInputs, speedSlider, entries, fireworkSlider, (count) => {
    fireworksController?.setColorCount(count);
  });
}

// ---- Vault-reactive dashboard: source banner/warnings/heatmap content,
// plus the evidence drawer and profile-header stats. heatmapBody and
// drawerEl are stable elements - wireBrowserUI/render.ts fill them, never
// recreate them, so nothing above is ever touched by a vault switch or
// rescan (see render.ts's top-of-file note). ----
const heatmapBodyEl = widgets.find((w) => w.id === "heatmap")?.body;
const drawerEl = document.getElementById("hk-drawer");
const statEvidenceEl = document.getElementById("hk-stat-evidence");
const statParametersEl = document.getElementById("hk-stat-parameters");

if (!heatmapBodyEl) throw new Error("The heatmap widget wasn't created - check #hk-canvas exists in index.html");
if (!drawerEl) throw new Error("index.html is missing #hk-drawer");

void wireBrowserUI(
  root,
  heatmapBodyEl,
  drawerEl,
  statEvidenceEl && statParametersEl ? { evidence: statEvidenceEl, parameters: statParametersEl } : undefined
);
