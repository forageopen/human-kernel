// Layer 3 of Adam's Adaptive Daily OS ("the Cognitive Cue System") as two
// new cards (2026-08-02, direct request: "just introduce set of new cards
// then" - responding to a standing offer to build this after it was
// deliberately left out of the Time Window / Best Time For rebuild, since
// it's a mode-switch signal rather than an hour range and didn't fit either
// of those two cards as designed).
//
// Two currents, both real, close to verbatim from the source document:
// Mind-work (screen-based, analytical, judgment-heavy) and Hand-work
// (muscle-memory, procedural, physical) - switched on a mood/vibe cue, not
// a clock. This file builds that as an interactive current toggle (Card 1)
// plus the document's own 3-question retrospective test for logging
// unplanned activity after the fact (Card 2) - both genuinely new
// interaction, not just restated text, matching the rest of this canvas's
// "real-live, not static" cards.

export type Current = "mind" | "hand";

const CURRENT_KEY = "hk-cognitive-current";
const LOG_KEY = "hk-unplanned-activity-log";

export function loadCurrent(): Current {
  try {
    return localStorage.getItem(CURRENT_KEY) === "hand" ? "hand" : "mind";
  } catch {
    return "mind";
  }
}

export function saveCurrent(current: Current): void {
  try {
    localStorage.setItem(CURRENT_KEY, current);
  } catch {
    // no persistence available this session
  }
}

/** Builds the Cognitive Currents card: the two currents explained, the cue
 * that switches between them, and a live "which one am I in right now"
 * toggle - Layer 3 explicitly "runs regardless of the clock," so this is a
 * manual toggle, not a time-based one like Time Window's. */
export function renderCognitiveCurrentsCard(): { root: HTMLElement; mindBtn: HTMLElement; handBtn: HTMLElement } {
  const root = document.createElement("div");

  const intro = document.createElement("div");
  intro.className = "hk-muted";
  intro.textContent = "The engine underneath the six windows - runs regardless of the clock.";
  root.appendChild(intro);

  const toggle = document.createElement("div");
  toggle.className = "hk-current-toggle";

  const mindBtn = document.createElement("button");
  mindBtn.type = "button";
  mindBtn.className = "hk-current-btn";
  mindBtn.dataset.current = "mind";
  mindBtn.innerHTML = `<b>Mind-work</b><span>Screen-based, analytical, judgment-heavy - reading, writing, reviewing, deciding.</span>`;

  const handBtn = document.createElement("button");
  handBtn.type = "button";
  handBtn.className = "hk-current-btn";
  handBtn.dataset.current = "hand";
  handBtn.innerHTML = `<b>Hand-work</b><span>Muscle-memory, procedural, physical - prepping food, washing, walking, tidying, cooking.</span>`;

  toggle.appendChild(mindBtn);
  toggle.appendChild(handBtn);
  root.appendChild(toggle);

  const cue = document.createElement("div");
  cue.className = "hk-window-suggestion hk-cue-note";
  cue.innerHTML = `<b>The cue</b> - a shift in mood or vibe, that felt sense of exhaustion or flatness, is the signal to switch. It isn't a break from work, it's a switch of channel - Hand-work is still productive, just on a different system, and it's often exactly when a stuck idea resolves itself in the background.`;
  root.appendChild(cue);

  return { root, mindBtn, handBtn };
}

export function wireCognitiveCurrentsCard(mindBtn: HTMLElement, handBtn: HTMLElement): void {
  const apply = (current: Current): void => {
    mindBtn.classList.toggle("active", current === "mind");
    handBtn.classList.toggle("active", current === "hand");
  };
  const select = (current: Current): void => {
    saveCurrent(current);
    apply(current);
  };

  apply(loadCurrent());
  mindBtn.addEventListener("click", () => select("mind"));
  handBtn.addEventListener("click", () => select("hand"));
}

export interface LoggedActivity {
  note: string;
  loggedAt: string; // ISO instant, when it was logged (not when the activity happened - this is retrospective)
  matchesCue: boolean; // true only if all 3 questions were answered yes
}

export function loadActivityLog(): LoggedActivity[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LoggedActivity[];
  } catch {
    return [];
  }
}

function saveActivityLog(entries: LoggedActivity[]): void {
  try {
    localStorage.setItem(LOG_KEY, JSON.stringify(entries));
  } catch {
    // no persistence available this session
  }
}

const QUESTIONS = [
  "Does it match the cognitive mode of the hour - associative, or analytical?",
  "Does it carry its own momentum, rather than needing willpower to start?",
  "Does it produce output without you noticing the effort?",
];

/** Builds the Unplanned Activity Check card: the document's own 3-question
 * retrospective test, a note field, a Log button, and the running list of
 * past entries. Meant to be filled in AFTER something happens, not during -
 * the source document is explicit that watching it too closely while it's
 * happening risks collapsing the very thing that makes it work. */
export function renderUnplannedActivityCard(): {
  root: HTMLElement;
  checkboxes: HTMLInputElement[];
  noteInput: HTMLInputElement;
  logBtn: HTMLElement;
  verdict: HTMLElement;
  list: HTMLElement;
} {
  const root = document.createElement("div");

  const intro = document.createElement("div");
  intro.className = "hk-muted";
  intro.textContent = "Something happened that wasn't on any plan? Check it against these three, after the fact - not while it's happening.";
  root.appendChild(intro);

  const checkboxes: HTMLInputElement[] = [];
  const checklist = document.createElement("div");
  checklist.className = "hk-activity-checklist";
  for (const q of QUESTIONS) {
    const row = document.createElement("label");
    row.className = "hk-activity-check-row";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    const span = document.createElement("span");
    span.textContent = q;
    row.appendChild(cb);
    row.appendChild(span);
    checklist.appendChild(row);
    checkboxes.push(cb);
  }
  root.appendChild(checklist);

  const verdict = document.createElement("div");
  verdict.className = "hk-activity-verdict";
  root.appendChild(verdict);

  const noteRow = document.createElement("div");
  noteRow.className = "hk-activity-note-row";
  const noteInput = document.createElement("input");
  noteInput.type = "text";
  noteInput.placeholder = "What was it?";
  noteInput.className = "hk-activity-note-input";
  const logBtn = document.createElement("button");
  logBtn.type = "button";
  logBtn.className = "hk-primary hk-activity-log-btn";
  logBtn.textContent = "Log it";
  noteRow.appendChild(noteInput);
  noteRow.appendChild(logBtn);
  root.appendChild(noteRow);

  const list = document.createElement("div");
  list.className = "hk-activity-list";
  root.appendChild(list);

  return { root, checkboxes, noteInput, logBtn, verdict, list };
}

function renderLogList(list: HTMLElement, entries: LoggedActivity[]): void {
  list.innerHTML = "";
  for (const entry of entries.slice().reverse()) {
    const row = document.createElement("div");
    row.className = "hk-activity-entry" + (entry.matchesCue ? " fits" : "");
    const when = new Date(entry.loggedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    row.innerHTML = `<span>${entry.note}</span><span class="hk-meta">${when}${entry.matchesCue ? " · fits" : ""}</span>`;
    list.appendChild(row);
  }
}

export function wireUnplannedActivityCard(
  checkboxes: HTMLInputElement[],
  noteInput: HTMLInputElement,
  logBtn: HTMLElement,
  verdict: HTMLElement,
  list: HTMLElement
): void {
  const updateVerdict = (): void => {
    const allChecked = checkboxes.every((cb) => cb.checked);
    const anyChecked = checkboxes.some((cb) => cb.checked);
    if (allChecked) {
      verdict.textContent = "All three - this belongs in that window, even though it wasn't planned.";
      verdict.className = "hk-activity-verdict fits";
    } else if (anyChecked) {
      verdict.textContent = "Not all three yet.";
      verdict.className = "hk-activity-verdict";
    } else {
      verdict.textContent = "";
      verdict.className = "hk-activity-verdict";
    }
  };

  for (const cb of checkboxes) cb.addEventListener("change", updateVerdict);

  renderLogList(list, loadActivityLog());

  logBtn.addEventListener("click", () => {
    const note = noteInput.value.trim();
    if (!note) return;
    const entries = loadActivityLog();
    entries.push({
      note,
      loggedAt: new Date().toISOString(),
      matchesCue: checkboxes.every((cb) => cb.checked),
    });
    saveActivityLog(entries);
    renderLogList(list, entries);

    noteInput.value = "";
    for (const cb of checkboxes) cb.checked = false;
    updateVerdict();
  });
}
