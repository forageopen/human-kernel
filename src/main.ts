// Browser entry point. Loaded by index.html as a module script.
//
// 2026-08-02 pass: every card on the canvas - including all 5 independent
// Notes slots and the two Layer-3 cards (Cognitive Currents, Unplanned
// Activity Check) - is created dynamically through draggable.ts's
// createWidget, rather than looking up static per-widget markup in
// index.html. That gives every card the same chrome for free (drag, native
// resize, a close button, and a visibility state the scene taskbar can also
// flip) with no per-card boilerplate. A purple mascot (mascot.ts) and a
// second, autonomous dog avatar (dog-avatar.ts) roam the page; four
// background layers (particles.ts "fireflies", starchase.ts "lasers",
// sakura.ts, fireworks.ts) each get their own on/off toggle in the scene
// taskbar so they're never all four on together for a first-time visitor.
//
// 2026-08-03 pass: the scene taskbar (scene-panel.ts) also supports drag-to-
// reorder on its card/avatar list, and carries a quote widget (quote-
// widget.ts) in its footer slot. The 5 Notes widgets opt into
// createWidget's editableTitle option (click-to-rename). The page header
// name/title (profile-name.ts) is click-to-edit rather than hardcoded.
//
// 2026-08-03 pass (second): a second product tab - Cognitive Supplement
// Dashboard, Phase 0 only (tabs.ts, supplements.ts, supplement-card.ts,
// reminder.ts). Tab 2 gets its own canvas and its own scene-taskbar
// instance, reusing createWidget and renderScenePanel/wireScenePanel
// unmodified in behavior (scene-panel.ts gained an options param so this
// second instance can drop the speed/firework sliders, which mean nothing
// on a tab with no ambient background - see its ScenePanelOptions comment).
// A single shared reminder clock (reminder.ts) drives both the taken-today
// reminder and keeping every checkbox honest across a KL midnight rollover,
// regardless of which tab is currently showing.
//
// 2026-08-03 pass (third, Founder Override - see supplements.ts's header):
// one supplement (L-Theanine, effectProfile "acute") gets a start-button/
// live-countdown card instead of the plain time+checkbox one every other
// supplement still uses - the branch below is on supplement.effectProfile,
// not a hardcoded id, so reclassifying a supplement later is a data change,
// not a code change. The same shared reminder.ts clock also drives the
// countdown's live text and its own one-time completion toast.
//
// Wiring order still matters: page chrome (clock/particles/starchase/
// sakura/fireworks/theme/avatar/mascot/dog/profile-name) has no dependency
// on vault data and is wired immediately. The widget canvas is built next,
// entirely from this file - only the heatmap card is vault-reactive
// (wireBrowserUI/render.ts fill its body on every load/rescan/view-switch);
// every other card's content is set once, right after creation, and is
// never touched again by a vault switch (see render.ts's top-of-file note
// for why that split exists).
import { wireBrowserUI } from "./dashboard/app.js";
import { startLiveClock } from "./dashboard/clock.js";
import { wireVisitorCount } from "./dashboard/visitor-count.js";
import { initParticles } from "./dashboard/particles.js";
import { initStarChase } from "./dashboard/starchase.js";
import { initSakura } from "./dashboard/sakura.js";
import { initFireworks } from "./dashboard/fireworks.js";
import { wireThemeToggle } from "./dashboard/theme.js";
import { wireAvatar } from "./dashboard/avatar.js";
import { wireMascot } from "./dashboard/mascot.js";
import { wireDogAvatar } from "./dashboard/dog-avatar.js";
import { wireProfileName } from "./dashboard/profile-name.js";
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
import { renderQuoteWidget, wireQuoteWidget } from "./dashboard/quote-widget.js";
import { renderTabBar, wireTabBar } from "./dashboard/tabs.js";
import { SUPPLEMENTS } from "./dashboard/supplements.js";
import {
  renderSupplementCard,
  wireSupplementCard,
  renderAcuteSupplementCard,
  wireAcuteSupplementCard,
} from "./dashboard/supplement-card.js";
import { startReminders, type ReminderTarget, type CountdownTarget } from "./dashboard/reminder.js";

const root = document.getElementById("app");
if (!root) {
  throw new Error("index.html is missing the #app root element");
}

// ---- Page chrome: no dependency on vault data, wired immediately. ----

const clockEl = document.getElementById("hk-live-clock");
if (clockEl) startLiveClock(clockEl);

const visitorCountEl = document.getElementById("hk-visitor-count");
if (visitorCountEl) wireVisitorCount(visitorCountEl);

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

// Direct request (2026-08-03): the header name/title is click-to-edit, not
// hardcoded to "Adam Rosman" - anyone can write their own name or a project
// title instead. index.html already ships "Adam Rosman" as the default.
const profileNameEl = document.getElementById("hk-profile-name");
if (profileNameEl) wireProfileName(profileNameEl, "Adam Rosman");

// ---- Tab bar (2026-08-03, second product tab: Cognitive Supplement
// Dashboard). Chrome-style two-tab switcher, mounted as the very first
// element in <body> so it stays visible/clickable regardless of which of
// the two panels below is active. Both panels are static in index.html
// (#hk-tab1-panel wraps everything the dashboard already had; #hk-tab2-panel
// is the new black-background supplements tab, built further below) -
// wireTabBar just toggles which one is hidden and restores/persists the
// visitor's last-active tab; no onSwitch callback is needed since nothing
// else in this file depends on the switch happening (tab 1's animation
// loops keep running while hidden, same as any display:none content -
// Phase 0 has no requirement to pause them). ----
const tab1PanelEl = document.getElementById("hk-tab1-panel");
const tab2PanelEl = document.getElementById("hk-tab2-panel");
if (tab1PanelEl && tab2PanelEl) {
  const tabBarElements = renderTabBar();
  document.body.insertBefore(tabBarElements.root, document.body.firstChild);
  wireTabBar(tabBarElements, { dashboard: tab1PanelEl, supplements: tab2PanelEl });
}

// Both roaming avatars get an individual show/hide switch in the scene
// taskbar (below), same loadVisible/saveVisible + .hk-widget-hidden
// mechanism every card's close button already uses - applied directly to
// their container elements here since neither is a createWidget canvas card.
if (mascotEl) mascotEl.classList.toggle("hk-widget-hidden", !loadVisible("mascot", true));
if (dogEl) dogEl.classList.toggle("hk-widget-hidden", !loadVisible("dog-avatar", true));

// Direct request (2026-08-03): "i want a separate scene toggle on/off for
// the fireflies, lasers, sakura, & fireworks. so it dont appear on on by
// default all at the same time." Each of the 4 background layers already
// initializes unconditionally above (initParticles/initStarChase/
// initSakura/initFireworks) - visibility is applied the same way as the
// mascot/dog avatars, directly on each layer's container, rather than
// touching any of those 4 modules' own animation-loop internals. Fireflies
// (particles.ts - the original, subtlest layer) stays on by default; the
// newer three start off until a visitor turns one on from the scene
// taskbar, so all four are never on together for a first-time visitor.
if (particlesEl) particlesEl.classList.toggle("hk-widget-hidden", !loadVisible("fireflies", true));
if (starchaseEl) starchaseEl.classList.toggle("hk-widget-hidden", !loadVisible("lasers", false));
if (sakuraEl) sakuraEl.classList.toggle("hk-widget-hidden", !loadVisible("sakura", false));
if (fireworksEl) fireworksEl.classList.toggle("hk-widget-hidden", !loadVisible("fireworks", false));

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
      // Direct request (2026-08-03): "ability to rename note from note/note
      // 1/2/3/4/5 to anything user wanted." Only the 5 Notes widgets opt in.
      editableTitle: true,
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

  // The 4 background-layer toggles - same shape as the two avatars above,
  // just backed by particlesEl/starchaseEl/sakuraEl/fireworksEl instead of
  // mascotEl/dogEl.
  if (particlesEl) {
    entries.push({
      id: "fireflies",
      label: "Fireflies",
      isVisible: () => loadVisible("fireflies", true),
      setVisible: (visible) => {
        saveVisible("fireflies", visible);
        particlesEl.classList.toggle("hk-widget-hidden", !visible);
      },
    });
  }
  if (starchaseEl) {
    entries.push({
      id: "lasers",
      label: "Lasers",
      isVisible: () => loadVisible("lasers", false),
      setVisible: (visible) => {
        saveVisible("lasers", visible);
        starchaseEl.classList.toggle("hk-widget-hidden", !visible);
      },
    });
  }
  if (sakuraEl) {
    entries.push({
      id: "sakura",
      label: "Sakura",
      isVisible: () => loadVisible("sakura", false),
      setVisible: (visible) => {
        saveVisible("sakura", visible);
        sakuraEl.classList.toggle("hk-widget-hidden", !visible);
      },
    });
  }
  if (fireworksEl) {
    entries.push({
      id: "fireworks",
      label: "Fireworks",
      isVisible: () => loadVisible("fireworks", false),
      setVisible: (visible) => {
        saveVisible("fireworks", visible);
        fireworksEl.classList.toggle("hk-widget-hidden", !visible);
      },
    });
  }

  const {
    root: panelRoot,
    tab,
    toggleInputs,
    speedSlider,
    fireworkSlider,
    footer,
    list: cardList,
    rowElements,
  } = renderScenePanel(entries);
  // Mounted inside #hk-tab1-panel (not document.body directly) so hiding
  // that panel on tab switch also hides this taskbar - see the tab-bar
  // wiring above (2026-08-03).
  (tab1PanelEl ?? document.body).appendChild(panelRoot);
  wireScenePanel(
    panelRoot,
    tab,
    toggleInputs,
    speedSlider,
    entries,
    fireworkSlider,
    (count) => {
      fireworksController?.setColorCount(count);
    },
    { list: cardList, rowElements }
  );

  // Quote widget lives in the scene panel's footer slot (2026-08-03, direct
  // request - see quote-widget.ts's own header for the full behavior:
  // shuffle/loop, timed 7-11s auto-advance, category cycle, and a fresh
  // quote every time the taskbar is opened).
  const { root: quoteRoot, textEl: quoteTextEl, categoryBtn: quoteCategoryBtn } = renderQuoteWidget();
  footer.appendChild(quoteRoot);
  wireQuoteWidget(panelRoot, quoteTextEl, quoteCategoryBtn);
}

// ---- Tab 2: Cognitive Supplement Dashboard (Phase 0 only - see
// src/dashboard/supplements.ts's header for the full scope reasoning: fixed
// user-set times, a reminder, a taken/not-taken checkbox, nothing else - no
// time slider, no drag-and-drop scheduling, no rules engine, no status
// effects, no graph). Reuses createWidget (draggable.ts) and
// renderScenePanel/wireScenePanel (scene-panel.ts) exactly as tab 1 does
// above - a second, fully independent instance of each. The speed/firework
// sliders are excluded (scene-panel.ts's ScenePanelOptions) since neither
// means anything here - there's no ambient background or fireworks layer
// on this tab to control. ----
const tab2CanvasEl = document.getElementById("hk-tab2-canvas");
const reminderToastEl = document.getElementById("hk-reminder-toast-container");

if (tab2CanvasEl) {
  const supplementWidgets: WidgetHandle[] = [];
  const reminderTargets: ReminderTarget[] = [];
  const countdownTargets: CountdownTarget[] = [];

  // First-time-visitor starting layout only, same convention as the Notes
  // layout above - dragging/resizing any card persists per-widget-id
  // (draggable.ts) and overrides this on every later visit. The acute
  // card (currently just L-Theanine) gets a little extra starting height -
  // its content (duration input + note + countdown + two buttons) runs
  // longer than the baseline card's (time input + note + checkbox).
  const supplementLayout: Array<{ left: number; top: number }> = [
    { left: 0, top: 0 },
    { left: 290, top: 0 },
    { left: 580, top: 0 },
    { left: 0, top: 280 },
    { left: 290, top: 280 },
  ];

  // Branch is on supplement.effectProfile, not a hardcoded id (2026-08-03,
  // Founder Override - see supplements.ts's header) - reclassifying a
  // supplement later is a data change in supplements.ts, not a code change
  // here.
  SUPPLEMENTS.forEach((supplement, i) => {
    const pos = supplementLayout[i]!;
    const isAcute = supplement.effectProfile === "acute";
    const widget = createWidget(tab2CanvasEl, `supplement-${supplement.id}`, supplement.name, {
      defaultRect: { left: pos.left, top: pos.top, width: 270, height: isAcute ? 260 : 210 },
    });
    supplementWidgets.push(widget);

    if (isAcute) {
      const cardElements = renderAcuteSupplementCard(supplement);
      widget.body.appendChild(cardElements.root);
      wireAcuteSupplementCard(supplement, cardElements);
      countdownTargets.push({ supplement, elements: cardElements });
    } else {
      const cardElements = renderSupplementCard(supplement);
      widget.body.appendChild(cardElements.root);
      wireSupplementCard(supplement, cardElements);
      reminderTargets.push({ supplement, checkbox: cardElements.checkbox });
    }
  });

  // Tab 2's own scene taskbar - same component/call shape as tab 1's above,
  // a fully separate instance backed by supplementWidgets instead of the
  // dashboard's widgets array. Reorder support is kept (it's the app's
  // existing generic taskbar-list convenience, not a new feature being
  // added for supplements - see scene-panel.ts); the speed/firework sliders
  // are dropped via options instead.
  const supplementEntries: SceneCardEntry[] = supplementWidgets.map((w) => ({
    id: w.id,
    label: w.title,
    isVisible: w.isVisible,
    setVisible: w.setVisible,
  }));
  const {
    root: supplementPanelRoot,
    tab: supplementTab,
    toggleInputs: supplementToggleInputs,
    speedSlider: supplementSpeedSlider,
    list: supplementList,
    rowElements: supplementRowElements,
  } = renderScenePanel(supplementEntries, {
    panelLabel: "Supplements",
    listHeading: "Supplements",
    includeSpeedSlider: false,
    includeFireworkSlider: false,
  });
  tab2PanelEl?.appendChild(supplementPanelRoot);
  wireScenePanel(
    supplementPanelRoot,
    supplementTab,
    supplementToggleInputs,
    supplementSpeedSlider,
    supplementEntries,
    undefined,
    undefined,
    { list: supplementList, rowElements: supplementRowElements }
  );

  // Reminder mechanism (reminder.ts) - one shared clock for all 5 cards; see
  // its own header for the full reasoning (foreground-only, at-most-once-
  // per-KL-day per supplement, keeps every checkbox honest across a
  // midnight rollover) - runs regardless of which tab is currently showing.
  // countdownTargets (the acute card(s)) piggybacks on this same clock -
  // see reminder.ts's header for why that's the same tick rather than a
  // second timer.
  if (reminderToastEl) startReminders(reminderTargets, reminderToastEl, countdownTargets);
}

// ---- Vault-reactive dashboard: source banner/warnings/heatmap content,
// plus the evidence drawer and profile-header stats. heatmapBody and
// drawerEl are stable elements - wireBrowserUI/render.ts fill them, never
// recreate them, so nothing above is ever touched by a vault switch or
// rescan (see render.ts's top-of-file note). ----
const heatmapBodyEl = widgets.find((w) => w.id === "heatmap")?.body;
const drawerEl = document.getElementById("hk-drawer");

if (!heatmapBodyEl) throw new Error("The heatmap widget wasn't created - check #hk-canvas exists in index.html");
if (!drawerEl) throw new Error("index.html is missing #hk-drawer");

// statEls param omitted - the "N notes captured / N traits tracked" profile
// stats line was retired (2026-08-03, direct request); wireBrowserUI's
// statEls stays optional so this needs no other change.
void wireBrowserUI(root, heatmapBodyEl, drawerEl);
