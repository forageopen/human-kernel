// Supplement card (2026-08-03, Cognitive Supplement Dashboard - Phase 0
// only). Deliberately minimal, per the spec: a name (the card's own
// createWidget title - see main.ts), a time the user sets themselves - no
// suggested/default value, see supplements.ts's header for the disclaimer
// reasoning behind that - and a "taken today" checkbox. Nothing else: no
// time slider, no drag-and-drop, no rules engine, no status-effect UI, no
// graph. All of that is explicitly Phase 1/2+ and not touched here.

import { loadSupplementTime, saveSupplementTime, loadTakenOn, saveTakenOn, currentKlDateKey, type Supplement } from "./supplements.js";

export interface SupplementCardElements {
  root: HTMLElement;
  timeInput: HTMLInputElement;
  checkbox: HTMLInputElement;
}

/** Builds one supplement's card body (to be placed inside a createWidget
 * instance - see main.ts). Plain markup only; no values are read/written
 * here yet, that's wireSupplementCard's job. */
export function renderSupplementCard(): SupplementCardElements {
  const root = document.createElement("div");
  root.className = "hk-supplement-card";

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
