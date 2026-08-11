// Cognitive Supplement Dashboard - Phase 0 (2026-08-03, direct request, full
// rebuilt spec supplied verbatim), PLUS one deliberate, named Founder
// Override on top (2026-08-03, same day, second feedback round). The
// spec's own framing: "Before any of the original ten build items: does a
// timing reminder change whether you actually take something consistently.
// That's the open question. Nothing past Phase 0 gets built until it's
// answered." Phase 0 itself is still exactly:
//   - Fixed daily times for the five supplements, set once ["fixed"/"set
//     once" is read here as describing the DATA MODEL - one time per day,
//     not a window or multiple reminders - not that the input becomes
//     read-only after the first save; nothing in the spec asks for a lock]
//   - A reminder at each time (reminder.ts, built on top of this file)
//   - A checkbox: taken or not
//   - Nothing else. No time slider, no drag-and-drop, no rules engine, no
//     status effects, no graph.
//
// Founder Override (named explicitly, not silently absorbed into "Phase
// 0"): direct feedback asked for a start button + live countdown against a
// per-supplement effectiveness duration - functionally the Phase 2
// status-effect/"Active" mechanic the spec itself gated behind a two-week
// Phase-0 adherence read that hadn't happened yet. Flagged back to Adam as
// exactly that; his call, confirmed, to build it now anyway - scoped to
// ONLY the one supplement with a real acute onset/offset (L-Theanine,
// `effectProfile: "acute"`). The other four are daily-baseline supplements
// with no real "wears off" point (creatine doesn't saturate-then-clear on a
// clock; magnesium/omega-3/D3+K2 are cumulative daily support, not
// single-dose windows) - forcing a countdown number onto those would be
// inventing false precision, the same trap the disclaimer problem below
// already caught once. Those four keep Phase 0's plain time+checkbox
// mechanic completely unchanged; only L-Theanine's card
// (supplement-card.ts's renderAcuteSupplementCard/wireAcuteSupplementCard)
// gets the new start/countdown UI.
//
// Disclaimer decision (spec explicitly asks to "pick one before Phase 0
// ships" - the two options were "state plainly, in the copy itself, that
// timing windows come from general product-label guidance" or "drop
// suggested windows entirely - user sets their own times, system suggests
// nothing"): Option 2, for WHEN to take something. There is no
// default/recommended TIME anywhere in this feature - every supplement's
// clock-time starts unset, and the user picks their own via a plain
// <input type="time"> (supplement-card.ts). This removes the "personalized
// timing guidance" problem by construction rather than hedging it with a
// disclaimer, per the spec's own reasoning ("removes the claim instead of
// hedging it"). `recommendedDurationMinutes` below is a different kind of
// fact - a generic, commonly-cited HOW LONG figure for an acute supplement's
// effect window, not personalized timing advice - and Adam explicitly
// asked for exactly that ("effectiveness... with recommendation"), so it's
// pre-filled but always user-editable, same as every other value here.
//
// Adherence is still logged silently (loadTakenOn/saveTakenOn, keyed by the
// KL calendar date) so the two-week test has real data to look back on -
// but nothing in this feature renders that history anywhere. That satisfies
// "no graph" for the visible UI without throwing away the only data that
// could ever answer the test's actual question later. Starting L-Theanine's
// countdown also silently logs it taken for the day (see
// supplement-card.ts's wireAcuteSupplementCard), so this data stays
// comparable across all five cards despite the UI differing.
//
// Scope note: Biotin and Iron are deliberately not here (spec: "stay out").
// Weather integration, the supplement marketplace/encyclopedia, the Daily
// OS window-model integration, and the Support/Active/Maintaining/Recovery
// status labels are all still Phase 1/2+ and not touched by this file - the
// Founder Override above is scoped narrowly to one countdown mechanic on
// one card, not a blanket "Phase 2 is open now."

import { klDateTimeParts, getPart, klYearMonthDay } from "./kl-time.js";

export interface Supplement {
  id: string;
  name: string;
  /** Short, generic descriptive line - not personalized advice, just what
   * kind of supplement this is (acute single-dose vs. cumulative daily
   * baseline). Shown on every card regardless of effectProfile. */
  info: string;
  /** "acute" = has a real onset/offset, eligible for the start/countdown
   * mechanic (Founder Override above). "baseline" = daily/cumulative
   * supplement with no meaningful "wears off" point - keeps Phase 0's
   * plain time+checkbox mechanic only. */
  effectProfile: "acute" | "baseline";
  /** Only meaningful when effectProfile is "acute" - a generic, commonly-
   * cited default for the effect-duration input, always user-editable. */
  recommendedDurationMinutes?: number;
}

/** Supplement scope unchanged from the original spec - exactly these five,
 * in this order. Biotin and Iron stay out, per direct instruction. Only
 * L-Theanine is "acute" - see the Founder Override note above for why the
 * other four aren't. */
export const SUPPLEMENTS: readonly Supplement[] = [
  {
    id: "creatine",
    name: "Creatine Monohydrate",
    info: "Saturates with consistent use - a continuous daily baseline, not a per-dose window.",
    effectProfile: "baseline",
  },
  {
    id: "l-theanine",
    name: "L-Theanine",
    info: "Acute, single-dose effect - commonly described as winding down within a few hours.",
    effectProfile: "acute",
    recommendedDurationMinutes: 150, // "5 half hour" - Adam's own figure
  },
  {
    id: "magnesium",
    name: "Magnesium Bisglycinate",
    info: "Daily baseline mineral - typically taken as ongoing support, not for a single-dose window.",
    effectProfile: "baseline",
  },
  {
    id: "omega-3",
    name: "Omega-3",
    info: "Cumulative - builds up with consistent daily intake rather than acting on one dose.",
    effectProfile: "baseline",
  },
  {
    id: "vitamin-d3-k2",
    name: "Vitamin D3+K2",
    info: "Daily baseline - body stores build gradually, not a per-dose effect window.",
    effectProfile: "baseline",
  },
];

// Same convention as clock.ts - Asia/Kuala_Lumpur regardless of the
// visitor's own device timezone, computed via Intl.DateTimeFormat rather
// than new Date().getHours() etc. Shared plumbing lives in kl-time.ts.

/** "HH:MM" in Asia/Kuala_Lumpur for the given instant - 24-hour, zero-padded,
 * so it string-compares correctly and matches <input type="time">'s own
 * value format directly (no parsing needed on either side). */
export function currentKlTime(date: Date): string {
  const parts = klDateTimeParts(date, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, "en-GB");
  const get = (type: Intl.DateTimeFormatPartTypes): string => getPart(parts, type, "00");
  return `${get("hour")}:${get("minute")}`;
}

/** "YYYY-MM-DD" in Asia/Kuala_Lumpur - the calendar day a "taken today"
 * checkbox actually belongs to, independent of the visitor's own device
 * timezone (same reasoning as clock.ts's formatKlDateTime). */
export function currentKlDateKey(date: Date): string {
  const { year, month, day } = klYearMonthDay(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

// ---------------------------------------------------------------------
// Start/countdown mechanic (Founder Override, above) - acute supplements
// only (currently just L-Theanine). Everything below is generic on
// Supplement, not hardcoded to one id, so a future reclassification is
// just flipping effectProfile, not new code.

function durationKey(id: string): string {
  return `hk-supplement-duration-${id}`;
}

/** The user's current effect-duration setting for supplement `id`, in
 * minutes - falls back to that supplement's recommendedDurationMinutes
 * (or 0 if it has none) the first time, before the user has ever touched
 * it. Always user-editable afterward - this is a generic recommended
 * figure, not personalized timing advice (see the disclaimer note above),
 * so pre-filling it doesn't repeat the earlier disclaimer problem. */
export function loadEffectDurationMinutes(supplement: Supplement): number {
  const fallback = supplement.recommendedDurationMinutes ?? 0;
  try {
    const raw = localStorage.getItem(durationKey(supplement.id));
    if (raw === null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  } catch {
    return fallback;
  }
}

export function saveEffectDurationMinutes(id: string, minutes: number): void {
  try {
    localStorage.setItem(durationKey(id), String(minutes));
  } catch {
    // no persistence available this session
  }
}

function startedAtKey(id: string): string {
  return `hk-supplement-started-${id}`;
}

/** Epoch-ms timestamp of when supplement `id`'s countdown was last started,
 * or null if it's never been started (or has been reset/cancelled since).
 * Deliberately NOT auto-cleared just because the countdown reached zero -
 * "Effect window ended" is itself a real, useful state (see
 * formatCountdown) that stays visible until the next Start overwrites it. */
export function loadStartedAt(id: string): number | null {
  try {
    const raw = localStorage.getItem(startedAtKey(id));
    if (raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveStartedAt(id: string, epochMs: number): void {
  try {
    localStorage.setItem(startedAtKey(id), String(epochMs));
  } catch {
    // no persistence available this session
  }
}

/** Cancels/resets a running (or finished) countdown back to "not started" -
 * the card's "Cancel" control while running, wired in supplement-card.ts. */
export function clearStartedAt(id: string): void {
  try {
    localStorage.removeItem(startedAtKey(id));
  } catch {
    // no persistence available this session
  }
}

/** Milliseconds remaining in the effect window, floored at 0 - pure given
 * the three inputs, so this needs no real clock or timers to unit test.
 * `nowMs` is always passed in fresh by the caller (reminder.ts's shared
 * tick), never captured once, so a long-open tab stays accurate. */
export function remainingEffectMs(startedAtMs: number, durationMinutes: number, nowMs: number): number {
  const totalMs = durationMinutes * 60_000;
  const elapsed = nowMs - startedAtMs;
  return Math.max(0, totalMs - elapsed);
}

/** Renders remaining time as "Xh Ym remaining" (or just "Ym remaining"
 * under an hour), or "Effect window ended" once it's hit zero - the one
 * function that decides what that zero state says, so the card and the
 * completion-toast trigger (reminder.ts) never have to duplicate the
 * wording or the <=0 check themselves. Rounds UP to the next minute
 * (ceil, not floor) so the display never shows "0m remaining" while time
 * is technically still left. */
export function formatCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return "Effect window ended";
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m remaining` : `${minutes}m remaining`;
}
