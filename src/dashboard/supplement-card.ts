// Supplement card (2026-08-03, Cognitive Supplement Dashboard - Phase 0,
// plus one named Founder Override - see supplements.ts's header for the
// full reasoning on both). Two variants, dispatched by main.ts on
// supplement.effectProfile:
//   - renderSupplementCard/wireSupplementCard (BASELINE - creatine,
//     magnesium, omega-3, vitamin D3+K2): unchanged Phase 0 mechanic - a
//     name (the card's own createWidget title - see main.ts), an info
//     line, a time the user sets themselves - no suggested/default value,
//     see supplements.ts's header for the disclaimer reasoning - and a
//     "taken today" checkbox. Nothing else.
//   - renderAcuteSupplementCard/wireAcuteSupplementCard (ACUTE -
//     L-Theanine only): the Founder Override mechanic - an info line, an
//     editable effect-duration input (pre-filled with a recommended
//     value), and a Start button that becomes a live countdown, then
//     "Effect window ended", then Start again.

import {
  loadSupplementTime,
  saveSupplementTime,
  loadTakenOn,
  saveTakenOn,
  currentKlDateKey,
  loadEffectDurationMinutes,
  saveEffectDurationMinutes,
  loadStartedAt,
  saveStartedAt,
  clearStartedAt,
  remainingEffectMs,
  formatCountdown,
  type Supplement,
} from "./supplements.js";

export interface SupplementCardElements {
  root: HTMLElement;
  timeInput: HTMLInputElement;
  checkbox: HTMLInputElement;
}

/** Builds one supplement's card body (to be placed inside a createWidget
 * instance - see main.ts). Takes `supplement` now (2026-08-03, second
 * round) purely to render its static `info` line - everything else here
 * is still plain markup with no values read/written until
 * wireSupplementCard runs. This is the BASELINE card only (time+checkbox) -
 * for the one acute supplement (L-Theanine), main.ts calls
 * renderAcuteSupplementCard/wireAcuteSupplementCard below instead. */
export function renderSupplementCard(supplement: Supplement): SupplementCardElements {
  const root = document.createElement("div");
  root.className = "hk-supplement-card";

  // Generic descriptive line (2026-08-03, direct request: "so have info for
  // each card") - not personalized advice, just what kind of supplement
  // this is. Same line shown on the acute card below.
  const info = document.createElement("div");
  info.className = "hk-supplement-info";
  info.textContent = supplement.info;
  root.appendChild(info);

  // Labeled "Remind me at" rather than a bare "Time" (2026-08-03, direct
  // feedback: "mechanism okay, just the wording is not clear") - setting a
  // time here is what arms the reminder, and the old generic "Time" label
  // didn't say that. The checkbox below is what silences it (see
  // wireSupplementCard/isReminderDue): ticked = no reminder, unticked +
  // time reached = reminder fires. Mechanism unchanged, label now says why
  // it exists.
  const timeRow = document.createElement("label");
  timeRow.className = "hk-supplement-time-row";
  const timeLabelText = document.createElement("span");
  timeLabelText.textContent = "Remind me at";
  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.className = "hk-supplement-time-input";
  timeRow.appendChild(timeLabelText);
  timeRow.appendChild(timeInput);
  root.appendChild(timeRow);

  // Disclaimer decision, stated plainly in the UI rather than hidden in a
  // footnote (supplements.ts's header comment has the full reasoning):
  // Option 2 was chosen - no suggested/recommended window exists anywhere
  // in this feature, so this line explains why the field starts empty
  // rather than implying a missing default.
  const note = document.createElement("div");
  note.className = "hk-supplement-note";
  note.textContent = "You choose the time. No suggested schedule.";
  root.appendChild(note);

  const checkRow = document.createElement("label");
  checkRow.className = "hk-supplement-check-row";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "hk-supplement-checkbox";
  const checkLabelText = document.createElement("span");
  checkLabelText.textContent = "Taken today";
  checkRow.appendChild(checkbox);
  checkRow.appendChild(checkLabelText);
  root.appendChild(checkRow);

  return { root, timeInput, checkbox };
}

/** Loads any previously-saved time/taken-state and wires both controls to
 * persist on change. The date key used for "taken today" is deliberately
 * recomputed fresh at the moment of each read/write (never captured once
 * and reused) - a tab left open across a KL midnight rollover must write to
 * the NEW day, not silently keep writing to the day the page happened to
 * load on. */
export function wireSupplementCard(supplement: Supplement, elements: SupplementCardElements): void {
  const { timeInput, checkbox } = elements;

  timeInput.value = loadSupplementTime(supplement.id);
  timeInput.addEventListener("change", () => {
    saveSupplementTime(supplement.id, timeInput.value);
  });

  checkbox.checked = loadTakenOn(supplement.id, currentKlDateKey(new Date()));
  checkbox.addEventListener("change", () => {
    saveTakenOn(supplement.id, currentKlDateKey(new Date()), checkbox.checked);
  });
}

/** Re-applies today's real saved taken-state onto the checkbox. Exists
 * separately from wireSupplementCard because a card left open across a KL
 * midnight rollover needs its checkbox reset to match the NEW day - this is
 * called every tick by reminder.ts's single shared clock, rather than each
 * card running its own independent timer and drifting apart from the
 * others. */
export function resyncSupplementCardCheckbox(supplement: Supplement, checkbox: HTMLInputElement, todayKey: string): void {
  checkbox.checked = loadTakenOn(supplement.id, todayKey);
}

// ---------------------------------------------------------------------
// Acute variant (Founder Override - supplements.ts's header has the full
// reasoning for why this exists and why it's scoped to effectProfile
// "acute" supplements only, currently just L-Theanine).

export interface AcuteSupplementCardElements {
  root: HTMLElement;
  durationInput: HTMLInputElement;
  countdownEl: HTMLElement;
  startButton: HTMLButtonElement;
  cancelButton: HTMLButtonElement;
}

/** Builds the acute card body: an info line (same convention as the
 * baseline card), an editable effect-duration input in minutes (pre-filled
 * with supplement.recommendedDurationMinutes), a Start button, and a
 * countdown display. Start/Cancel are both always in the DOM - which one
 * is visible (native `hidden`) is decided by resyncAcuteSupplementCard
 * below, not by adding/removing elements, so this stays consistent with
 * how every other toggle-driven UI in this app works (e.g. .hk-widget-
 * hidden). Plain markup only; wireAcuteSupplementCard reads/writes values. */
export function renderAcuteSupplementCard(supplement: Supplement): AcuteSupplementCardElements {
  const root = document.createElement("div");
  root.className = "hk-supplement-card";

  const info = document.createElement("div");
  info.className = "hk-supplement-info";
  info.textContent = supplement.info;
  root.appendChild(info);

  const durationRow = document.createElement("label");
  durationRow.className = "hk-supplement-duration-row";
  const durationLabelText = document.createElement("span");
  durationLabelText.textContent = "Effectiveness (minutes)";
  const durationInput = document.createElement("input");
  durationInput.type = "number";
  durationInput.min = "1";
  durationInput.step = "5";
  durationInput.className = "hk-supplement-duration-input";
  durationRow.appendChild(durationLabelText);
  durationRow.appendChild(durationInput);
  root.appendChild(durationRow);

  // Recommended value stated plainly (2026-08-03, direct request:
  // "effectiveness (fill in yourself) with recommendation") - a generic,
  // commonly-cited duration figure, not personalized timing advice (see
  // supplements.ts's disclaimer note above it) - always editable, never
  // locked, same "pre-filled but overridable" spirit as everything else.
  const durationNote = document.createElement("div");
  durationNote.className = "hk-supplement-note";
  durationNote.textContent = supplement.recommendedDurationMinutes
    ? `Recommended: ${supplement.recommendedDurationMinutes} min - edit if yours differs.`
    : "Set how long the effect typically lasts for you.";
  root.appendChild(durationNote);

  const countdownEl = document.createElement("div");
  countdownEl.className = "hk-supplement-countdown";
  countdownEl.setAttribute("aria-live", "polite");
  root.appendChild(countdownEl);

  const actions = document.createElement("div");
  actions.className = "hk-supplement-acute-actions";
  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.className = "hk-supplement-start-btn";
  startButton.textContent = "Start";
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "hk-supplement-cancel-btn";
  cancelButton.textContent = "Cancel";
  actions.appendChild(startButton);
  actions.appendChild(cancelButton);
  root.appendChild(actions);

  return { root, durationInput, countdownEl, startButton, cancelButton };
}

/** Loads the saved (or recommended-default) duration, wires the duration
 * input to persist on change, wires Start/Cancel, and immediately renders
 * whichever of the three states (not started / running / finished) is
 * real. Pressing Start silently logs the supplement taken for today too
 * (saveTakenOn) - see supplements.ts's header for why: starting the
 * countdown IS the "I took it" action here, so adherence data stays
 * comparable across all five cards despite the UI differing. */
export function wireAcuteSupplementCard(supplement: Supplement, elements: AcuteSupplementCardElements): void {
  const { durationInput, startButton, cancelButton } = elements;

  durationInput.value = String(loadEffectDurationMinutes(supplement));
  durationInput.addEventListener("change", () => {
    const minutes = Number(durationInput.value);
    if (Number.isFinite(minutes) && minutes > 0) {
      saveEffectDurationMinutes(supplement.id, minutes);
    }
  });

  startButton.addEventListener("click", () => {
    saveStartedAt(supplement.id, Date.now());
    saveTakenOn(supplement.id, currentKlDateKey(new Date()), true);
    resyncAcuteSupplementCard(supplement, elements);
  });

  cancelButton.addEventListener("click", () => {
    clearStartedAt(supplement.id);
    resyncAcuteSupplementCard(supplement, elements);
  });

  resyncAcuteSupplementCard(supplement, elements);
}

/** Re-applies the real not-started/running/finished state onto the card -
 * called once by wireAcuteSupplementCard and then every tick by
 * reminder.ts's shared clock (same role as resyncSupplementCardCheckbox
 * above, just for the countdown text and which button shows), so this card
 * never runs a timer of its own. */
export function resyncAcuteSupplementCard(supplement: Supplement, elements: AcuteSupplementCardElements): void {
  const { durationInput, countdownEl, startButton, cancelButton } = elements;
  const startedAt = loadStartedAt(supplement.id);

  if (startedAt === null) {
    durationInput.disabled = false;
    countdownEl.textContent = "";
    startButton.hidden = false;
    cancelButton.hidden = true;
    return;
  }

  const duration = loadEffectDurationMinutes(supplement);
  const remaining = remainingEffectMs(startedAt, duration, Date.now());
  countdownEl.textContent = formatCountdown(remaining);

  const running = remaining > 0;
  durationInput.disabled = running;
  startButton.hidden = running;
  cancelButton.hidden = !running;
}
