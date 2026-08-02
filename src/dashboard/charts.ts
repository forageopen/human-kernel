// GitHub-style calendar heatmap (2026-08-02, fourth pass - real-data variety
// fix). The six Chart.js cards that used to live in this file (domain count,
// confidence histogram, status donut, relationship types, source files,
// domain-confidence radar) are gone per direct instruction ("lets scrap:
// parameters by domain, confidence distribution, status breakdown,
// relationship type, evidence by source file, mean confidence by domain") -
// see render.ts and index.html, which no longer load Chart.js at all now
// that nothing here uses it.
//
// This file used to show one calendar month at a time, defaulting to
// whichever month had the most real Evidence - direct feedback: "it's just
// one day that's shown active - introduce variety." The real vault data
// (sample-vault/README.md) has genuine activity on three real, separate
// dates thirteen months apart (2025-06-22, 2026-05-15, 2026-07-04) that a
// single-month view can only ever show one of at a time. The fix is not to
// invent more data - it's to stop hiding the real data that already exists:
// this now renders a GitHub-contribution-style week-column grid spanning
// from the earliest real Evidence date to today, so all three real active
// periods are visible at once. Zero invented entries.

import type { Evidence } from "../types.js";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The real span to render: earliest real Evidence timestamp through today
 * (or through the latest Evidence timestamp, if that's somehow in the
 * future). Falls back to just today when there's no Evidence at all - never
 * a fabricated range. */
export function evidenceDateRange(evidence: Evidence[], now: Date = new Date()): { start: Date; end: Date } {
  if (evidence.length === 0) return { start: now, end: now };
  let min = new Date(evidence[0]!.timestamp);
  let max = min;
  for (const e of evidence) {
    const d = new Date(e.timestamp);
    if (d.getTime() < min.getTime()) min = d;
    if (d.getTime() > max.getTime()) max = d;
  }
  if (now.getTime() > max.getTime()) max = now;
  return { start: min, end: max };
}

/** GitHub-style calendar heatmap: weeks as columns (Sun-Sat rows), spanning
 * the real Evidence date range. Color-only intensity (no visible digit -
 * same reasoning as before: a digit forces cells to be big), exact
 * date/count on hover `title`, month labels above the column where each
 * month starts, Less->More legend. Cell intensity is scaled against the
 * busiest single day across the WHOLE rendered range (not per-month), so
 * relative intensity stays meaningful across the wider span. */
export function renderEvidenceHeatmap(evidence: Evidence[], now: Date = new Date()): HTMLElement {
  const { start, end } = evidenceDateRange(evidence, now);

  const gridStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // back up to the Sunday on/before start
  const gridEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const countsByDate = new Map<string, number>();
  for (const e of evidence) {
    const key = dateKey(new Date(e.timestamp));
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }
  const maxCount = Math.max(1, ...Array.from(countsByDate.values()));

  const wrap = document.createElement("div");
  wrap.className = "hk-heatmap";

  const label = document.createElement("div");
  label.className = "hk-label";
  label.textContent = "Activity";
  wrap.appendChild(label);

  const caption = document.createElement("div");
  caption.className = "hk-muted hk-heatmap-caption";
  caption.textContent = "How often new entries were added, day by day.";
  wrap.appendChild(caption);

  const scroll = document.createElement("div");
  scroll.className = "hk-heatmap-scroll";

  const dowCol = document.createElement("div");
  dowCol.className = "hk-heatmap-dow-col";
  const dowSpacer = document.createElement("div");
  dowSpacer.className = "hk-heatmap-month-slot";
  dowCol.appendChild(dowSpacer);
  for (const dow of ["", "Mon", "", "Wed", "", "Fri", ""]) {
    const d = document.createElement("div");
    d.className = "hk-heatmap-dow";
    d.textContent = dow;
    dowCol.appendChild(d);
  }
  scroll.appendChild(dowCol);

  const weeksWrap = document.createElement("div");
  weeksWrap.className = "hk-heatmap-weeks";

  const cursor = new Date(gridStart);
  let lastMonth = -1;
  while (cursor.getTime() <= gridEnd.getTime()) {
    const weekCol = document.createElement("div");
    weekCol.className = "hk-heatmap-week";

    const monthSlot = document.createElement("div");
    monthSlot.className = "hk-heatmap-month-slot";
    if (cursor.getMonth() !== lastMonth) {
      monthSlot.textContent = cursor.toLocaleDateString("en-US", { month: "short" });
      lastMonth = cursor.getMonth();
    }
    weekCol.appendChild(monthSlot);

    for (let i = 0; i < 7; i++) {
      const day = new Date(cursor);
      const cell = document.createElement("div");
      if (day.getTime() < gridStart.getTime() || day.getTime() > gridEnd.getTime()) {
        cell.className = "hk-heatmap-cell empty";
      } else {
        const key = dateKey(day);
        const count = countsByDate.get(key) ?? 0;
        const intensity = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCount) * 4));
        cell.className = `hk-heatmap-cell level-${intensity}`;
        cell.dataset.date = key;
        const dayLabel = day.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
        cell.title = `${dayLabel}: ${count} ${count === 1 ? "entry" : "entries"}`;
      }
      weekCol.appendChild(cell);
      cursor.setDate(cursor.getDate() + 1);
    }
    weeksWrap.appendChild(weekCol);
  }
  scroll.appendChild(weeksWrap);
  wrap.appendChild(scroll);

  const legend = document.createElement("div");
  legend.className = "hk-heatmap-legend";
  const less = document.createElement("span");
  less.textContent = "Less";
  legend.appendChild(less);
  for (let level = 0; level <= 4; level++) {
    const swatch = document.createElement("span");
    swatch.className = `hk-heatmap-cell level-${level}`;
    swatch.setAttribute("aria-hidden", "true");
    legend.appendChild(swatch);
  }
  const more = document.createElement("span");
  more.textContent = "More";
  legend.appendChild(more);
  wrap.appendChild(legend);

  return wrap;
}
