// Cognitive Supplement Dashboard - Phase 0 ONLY (2026-08-03, direct request,
// full rebuilt spec supplied verbatim). The spec's own framing: "Before any
// of the original ten build items: does a timing reminder change whether
// you actually take something consistently. That's the open question.
// Nothing past Phase 0 gets built until it's answered." This file - and
// every other file this feature touches - implements Phase 0 and Phase 0
// only:
//   - Fixed daily times for the five supplements, set once ["fixed"/"set
//     once" is read here as describing the DATA MODEL - one time per day,
//     not a window or multiple reminders - not that the input becomes
//     read-only after the first save; nothing in the spec asks for a lock]
//   - A reminder at each time (reminder.ts, built on top of this file)
//   - A checkbox: taken or not
//   - Nothing else. No time slider, no drag-and-drop, no rules engine, no
//     status effects, no graph.
//
// Disclaimer decision (spec explicitly asks to "pick one before Phase 0
// ships" - the two options were "state plainly, in the copy itself, that
// timing windows come from general product-label guidance" or "drop
// suggested windows entirely - user sets their own times, system suggests
// nothing"): Option 2. There is no default/recommended time anywhere in
// this feature - every supplement starts unset, and the user picks their
// own time via a plain <input type="time"> (supplement-card.ts). This
// removes the "personalized timing guidance" problem by construction
// rather than hedging it with a disclaimer, per the spec's own reasoning
// ("removes the claim instead of hedging it").
//
// Adherence is still logged silently (loadTakenOn/saveTakenOn, keyed by the
// KL calendar date) so the two-week test has real data to look back on -
// but nothing in this feature renders that history anywhere. That satisfies
// "no graph" for the visible UI without throwing away the only data that
// could ever answer the test's actual question later.
//
// Scope note: Biotin and Iron are deliberately not here (spec: "stay out").
// Weather integration, the supplement marketplace/encyclopedia, the Daily
// OS window-model integration, and the Support/Active/Maintaining/Recovery
// status labels are all Phase 1/2+ and explicitly not touched by this file.

export interface Supplement {
  id: string;
  name: string;
}

/** Unchanged from the original spec - exactly these five, in this order.
 * Biotin and Iron stay out, per direct instruction. */
export const SUPPLEMENTS: readonly Supplement[] = [
  { id: "creatine", name: "Creatine Monohydrate" },
  { id: "l-theanine", name: "L-Theanine" },
  { id: "magnesium", name: "Magnesium Bisglycinate" },
  { id: "omega-3", name: "Omega-3" },
  { id: "vitamin-d3-k2", name: "Vitamin D3+K2" },
];

// Same convention as clock.ts - Asia/Kuala_Lumpur regardless of the
// visitor's own device timezone, computed via Intl.DateTimeFormat rather
// than new Date().getHours() etc.
const KL_TIMEZONE = "Asia/Kuala_Lumpur";

/** "HH:MM" in Asia/Kuala_Lumpur for the given instant - 24-hour, zero-padded,
 * so it string-compares correctly and matches <input type="time">'s own
 * value format directly (no parsing needed on either side). */
export function currentKlTime(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: KL_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}`;
}

/** "YYYY-MM-DD" in Asia/Kuala_Lumpur - the calendar day a "taken today"
 * checkbox actually belongs to, independent of the visitor's own device
 * timezone (same reasoning as clock.ts's formatKlDateTime). en-CA happens
 * to format in YYYY-MM-DD order already, so no manual reassembly needed
 * beyond pulling the three parts. */
export function currentKlDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function timeKey(id: string): string {
  return `hk-supplement-time-${id}`;
}

/** The user's own chosen daily time for supplement `id`, or "" if never set -
 * deliberately no suggested/default value (disclaimer Option 2, above). */
export function loadSupplementTime(id: string): string {
  try {
    return localStorage.getItem(timeKey(id)) ?? "";
  } catch {
    return "";
  }
}

export function saveSupplementTime(id: string, time: string): void {
  try {
    localStorage.setItem(timeKey(id), time);
  } catch {
    // no persistence available this session
  }
}

function takenKey(id: string, dateKey: string): string {
  return `hk-supplement-taken-${id}-${dateKey}`;
}

/** Whether supplement `id` was checked off taken on the given (KL) calendar
 * date. Defaults to false for any date nothing was ever saved for -
 * including every future date, which is exactly the "resets at midnight"
 * behavior a daily checkbox needs, for free, just by keying on the date. */
export function loadTakenOn(id: string, dateKey: string): boolean {
  try {
    return localStorage.getItem(takenKey(id, dateKey)) === "1";
  } catch {
    return false;
  }
}

export function saveTakenOn(id: string, dateKey: string, taken: boolean): void {
  try {
    if (taken) {
      localStorage.setItem(takenKey(id, dateKey), "1");
    } else {
      // Remove rather than write "0" - an unchecked day shouldn't accumulate
      // an ever-growing row of explicit "not taken" keys forever.
      localStorage.removeItem(takenKey(id, dateKey));
    }
  } catch {
    // no persistence available this session
  }
}

/** Whether supplement `id`'s reminder should be considered due right now: a
 * time has actually been set, that time has arrived or passed (KL time),
 * and today's dose isn't already checked off. Pure given the two time
 * strings and a flag, so this needs no real clock to unit test, and
 * correctly stops being "due" the moment either the box is checked or the
 * KL calendar day rolls over (the caller re-derives `nowKlTime` fresh each
 * check, so a post-midnight "00:03" naturally reads as earlier than
 * yesterday's set time again). */
export function isReminderDue(setTime: string, nowKlTime: string, alreadyTaken: boolean): boolean {
  if (!setTime || alreadyTaken) return false;
  return nowKlTime >= setTime;
}
