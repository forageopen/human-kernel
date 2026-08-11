// Shared Asia/Kuala_Lumpur time plumbing - extracted from the identical
// KL_TIMEZONE + Intl.DateTimeFormat(...).formatToParts() shape that used to
// be hand-rolled separately in clock.ts, supplements.ts, visitor-count.ts,
// prayer-times.ts, and time-window.ts. Every "what's the KL-local
// hour/date/time right now, regardless of the visitor's own device
// timezone" question in this app routes through here; each caller still
// owns its own final formatting (12h vs 24h, locale, separators, etc).

export const KL_TIMEZONE = "Asia/Kuala_Lumpur";

/** Formats `date` in Asia/Kuala_Lumpur with the given Intl options/locale and
 * returns the raw parts array - the shared plumbing behind every
 * Asia/Kuala_Lumpur-based formatter in this app. Callers pull out whichever
 * part types they need via `getPart`. */
export function klDateTimeParts(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  locale = "en-US",
): Intl.DateTimeFormatPart[] {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: KL_TIMEZONE }).formatToParts(date);
}

/** Looks up a single part's string value out of a `formatToParts()` result,
 * falling back (default "") when that part type wasn't produced. */
export function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
  fallback = "",
): string {
  return parts.find((p) => p.type === type)?.value ?? fallback;
}

/** The KL-local calendar year/month/day for `date`, as numbers - shared by
 * every "what KL calendar day is this" computation (supplements.ts's
 * currentKlDateKey, visitor-count.ts's currentKlWeekKey). */
export function klYearMonthDay(date: Date): { year: number; month: number; day: number } {
  const parts = klDateTimeParts(date, { year: "numeric", month: "2-digit", day: "2-digit" }, "en-CA");
  return {
    year: Number(getPart(parts, "year", "0")),
    month: Number(getPart(parts, "month", "0")),
    day: Number(getPart(parts, "day", "0")),
  };
}

/** The current hour (0-23) in Asia/Kuala_Lumpur - time-window.ts's window
 * lookup. */
export function klHour(now: Date): number {
  const parts = klDateTimeParts(now, { hour: "numeric", hourCycle: "h23" });
  return Number(getPart(parts, "hour", "0"));
}
