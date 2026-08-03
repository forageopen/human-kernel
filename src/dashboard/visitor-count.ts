// Simulated visitor count (2026-08-03, direct request: "add number of user
// (visitor) this week? and total user if that applicable. put it under date
// row"). Investigated first before writing any of this - reported back,
// per instructions, rather than silently faking it or silently skipping it:
//
// - localStorage (the only persistence this whole app has) is private per
//   browser. It cannot see other visitors, so it structurally cannot count
//   them - there is no "real" number this static app can compute on its own.
// - GitHub's own repo Traffic Insights (checked live) tracks the
//   github.com repo page, not the deployed Pages site, shows 0/0 for this
//   repo, and is admin-only/unembeddable regardless.
// - A real number needs a third party in the loop (a hit-counter badge or
//   an analytics account) - a bigger, separate decision with its own
//   trade-offs (privacy, an account Adam has to create himself, long-term
//   reliability of a free service).
//
// Asked directly; answer was "Simulate now." Everything below is
// deliberately, visibly simulated - the footer text ends in "(simulated)"
// and the element carries a title= explaining why, so this is never
// mistaken for real traffic (same disclosure habit as the disclaimer
// reasoning in supplements.ts and the placeholder framing the Time
// Window/Best-Time-For cards used originally).
//
// Numbers only move when this browser loads the page (recordSimulatedVisit,
// called once per load) - deliberately not a live background tick. A true
// live-ticking count would need a backend or third-party service, which is
// exactly the "real" path that was declined for now; ticking on a timer
// anyway would oversell a client-only simulation as something more than it
// is. MVD: the two numbers asked for, honestly labeled, nothing more.

const KL_TIMEZONE = "Asia/Kuala_Lumpur";

const TOTAL_KEY = "hk-visitor-total";
const WEEK_KEY_KEY = "hk-visitor-week-key";
const WEEK_COUNT_KEY = "hk-visitor-week-count";

export interface VisitorCounts {
  total: number;
  thisWeek: number;
  weekKey: string;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** ISO-ish "YYYY-Www" week key, computed from the KL-local calendar date so
 * the weekly reset lines up with the same Asia/Kuala_Lumpur convention every
 * other "today"/"this week" concept in this app already uses (see
 * supplements.ts's currentKlDateKey / clock.ts's formatKlDateTime) - not the
 * visitor's own device timezone. Once reduced to a plain local Y/M/D,
 * ISO-week math needs no further timezone handling. */
export function currentKlWeekKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KL_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === type)?.value ?? "0";

  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));

  // Standard ISO-8601 week-number algorithm on a UTC-anchored date built
  // from the already-KL-local Y/M/D - the UTC anchor here is just a plain
  // calendar-math scratch value, not a timezone claim.
  const local = new Date(Date.UTC(y, m - 1, d));
  const dayNum = (local.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
  local.setUTCDate(local.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(local.getUTCFullYear(), 0, 4));
  const firstThursdayDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstThursdayDayNum + 3);
  const week = 1 + Math.round((local.getTime() - firstThursday.getTime()) / (7 * 24 * 60 * 60 * 1000));

  return `${local.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Reads (or seeds, on first-ever load) the stored simulated counts,
 * rolling `thisWeek` over to a fresh small baseline whenever the KL week
 * has changed since the last read. `total` only ever carries forward or
 * grows - it never resets. Safe to call more than once without drifting
 * the numbers itself; only recordSimulatedVisit below increments. */
export function loadOrCreateVisitorCounts(now: Date): VisitorCounts {
  const weekKey = currentKlWeekKey(now);
  const storedTotal = localStorage.getItem(TOTAL_KEY);
  const storedWeekKey = localStorage.getItem(WEEK_KEY_KEY);
  const storedWeekCount = localStorage.getItem(WEEK_COUNT_KEY);

  if (storedTotal === null) {
    const seeded: VisitorCounts = {
      total: randomInt(120, 450),
      thisWeek: randomInt(8, 30),
      weekKey,
    };
    localStorage.setItem(TOTAL_KEY, String(seeded.total));
    localStorage.setItem(WEEK_KEY_KEY, seeded.weekKey);
    localStorage.setItem(WEEK_COUNT_KEY, String(seeded.thisWeek));
    return seeded;
  }

  const total = Number(storedTotal);

  if (storedWeekKey !== weekKey) {
    const thisWeek = randomInt(4, 14); // fresh week, only a few visits logged so far
    localStorage.setItem(WEEK_KEY_KEY, weekKey);
    localStorage.setItem(WEEK_COUNT_KEY, String(thisWeek));
    return { total, thisWeek, weekKey };
  }

  return { total, thisWeek: Number(storedWeekCount ?? 0), weekKey };
}

/** Call exactly once per page load - treats this load as "a visit" and
 * bumps both counters by a small random step (thisWeek's step can be zero,
 * so it doesn't lock-step total 1:1 and look mechanical). Persists and
 * returns the updated counts. */
export function recordSimulatedVisit(now: Date): VisitorCounts {
  const before = loadOrCreateVisitorCounts(now);
  const counts: VisitorCounts = {
    total: before.total + randomInt(1, 3),
    thisWeek: before.thisWeek + randomInt(0, 2),
    weekKey: before.weekKey,
  };
  localStorage.setItem(TOTAL_KEY, String(counts.total));
  localStorage.setItem(WEEK_COUNT_KEY, String(counts.thisWeek));
  return counts;
}

/** "23 visitors this week · 842 total (simulated)" - matches the same
 * " · " separator clock.ts's formatKlDateTime already established for the
 * footer, so the two lines read as one family. */
export function formatVisitorCountText(counts: VisitorCounts): string {
  return `${counts.thisWeek} visitors this week · ${counts.total} total (simulated)`;
}

/** Wires the simulated count into `el` (expected: the element directly
 * under the footer's live clock, per the direct request to put this "under
 * the date row"). Records this load as one visit, then renders. */
export function wireVisitorCount(el: HTMLElement, now: Date = new Date()): void {
  const counts = recordSimulatedVisit(now);
  el.textContent = formatVisitorCountText(counts);
  el.title = "Simulated for now - no real traffic tracking is wired up yet.";
}
