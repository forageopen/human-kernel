// Live footer clock (2026-08-02, requested directly: "something kinetic in
// the screen" now that the direction is a live dashboard). Text only, always
// Asia/Kuala_Lumpur regardless of the visitor's own device timezone - this is
// deliberately NOT "new Date().getMonth()" etc., which would read the
// browser's local timezone instead. Intl.DateTimeFormat with an explicit
// timeZone is the zero-dependency way to do this correctly; no date library
// added (Chart.js remains the only CDN exception - see charts.ts).
//
// Split the same way charts.ts splits drawChart from renderEvidenceHeatmap:
// formatKlDateTime is pure and fully unit-testable with fixed dates regardless
// of the machine running the test; startLiveClock is the thin, timer-owning
// side effect on top of it.

import { klDateTimeParts, getPart } from "./kl-time.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "Month day, Q#, year · H:MM:SS AM/PM" in Asia/Kuala_Lumpur, computed from
 * the given instant - not from the caller's local clock. hourCycle:"h12"
 * (not hour12:true) is the explicit, unambiguous way to ask for a 12-hour
 * clock that renders midnight/noon as 12, not 0 - the dayPeriod part
 * (AM/PM) comes along automatically once hourCycle is h11/h12. */
export function formatKlDateTime(date: Date): string {
  const parts = klDateTimeParts(date, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h12",
  });

  const get = (type: Intl.DateTimeFormatPartTypes): string => getPart(parts, type);

  const monthNum = Number(get("month"));
  const day = get("day");
  const year = get("year");
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");
  const dayPeriod = get("dayPeriod");

  const monthName = MONTH_NAMES[monthNum - 1] ?? "";
  const quarter = Math.min(4, Math.max(1, Math.ceil(monthNum / 3)));

  return `${monthName} ${day}, Q${quarter}, ${year} · ${hour}:${minute}:${second} ${dayPeriod}`;
}

/** Starts the ticking clock on the given element and returns a stop function.
 * Ticks every second by default - visible motion, not a busy-loop (this is
 * the one thing on an otherwise static page that moves on its own). */
export function startLiveClock(el: HTMLElement, intervalMs = 1000): () => void {
  const tick = (): void => {
    el.textContent = formatKlDateTime(new Date());
  };
  tick();
  const id = setInterval(tick, intervalMs);
  return () => clearInterval(id);
}
