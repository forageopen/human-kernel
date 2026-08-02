// Activity card: a traditional month calendar, not a GitHub-style
// contribution strip (2026-08-02, direct feedback: "fix activity card.
// seems too long to scroll. do the calendar type instead"). One month
// on screen at a time - Prev/Next navigate - so there's no horizontal
// scrollbar to fight with inside a small card. Cell coloring (the
// `.hk-heatmap-cell level-N` classes, and the Less->More legend) is kept
// unchanged from the earlier GitHub-style version; only the layout around
// it changed, from week-columns to a day-number grid.
//
// Click-to-open-evidence now lives entirely inside this file: `onDayClick`
// is called directly by whichever cell was clicked, re-wired fresh every
// time renderMonth() runs (including on every Prev/Next click, which
// creates brand-new cell elements). An earlier version wired clicks
// externally, once, right after the initial render - that broke the moment
// someone navigated to a different month, since the newly-created cells for
// that month never got a listener attached at all.
//
// Defaults to the month containing the most recent real Evidence (or the
// current month if there's none yet) rather than always "today" - since the
// real vault data can be many months old, defaulting to "today" would often
// open on a completely blank month while real activity sits unreached a
// few clicks of Prev away.

import type { Evidence } from "../types.js";

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function renderCalendarHeatmap(
  evidence: Evidence[],
  onDayClick: (dateKey: string) => void,
  initialMonth?: Date
): HTMLElement {
  const countsByDate = new Map<string, number>();
  for (const e of evidence) {
    const key = dateKey(new Date(e.timestamp));
    countsByDate.set(key, (countsByDate.get(key) ?? 0) + 1);
  }
  const maxCount = Math.max(1, ...Array.from(countsByDate.values()));

  let cursorYear: number;
  let cursorMonth: number; // 0-11
  if (initialMonth) {
    cursorYear = initialMonth.getFullYear();
    cursorMonth = initialMonth.getMonth();
  } else if (evidence.length > 0) {
    let latest = new Date(evidence[0]!.timestamp);
    for (const e of evidence) {
      const d = new Date(e.timestamp);
      if (d.getTime() > latest.getTime()) latest = d;
    }
    cursorYear = latest.getFullYear();
    cursorMonth = latest.getMonth();
  } else {
    const now = new Date();
    cursorYear = now.getFullYear();
    cursorMonth = now.getMonth();
  }

  const wrap = document.createElement("div");
  wrap.className = "hk-calendar";

  const caption = document.createElement("div");
  caption.className = "hk-muted hk-calendar-caption";
  caption.textContent = "How often new entries were added, day by day.";
  wrap.appendChild(caption);

  const header = document.createElement("div");
  header.className = "hk-calendar-header";

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.className = "hk-calendar-nav";
  prevBtn.textContent = "‹";
  prevBtn.setAttribute("aria-label", "Previous month");

  const monthLabel = document.createElement("div");
  monthLabel.className = "hk-calendar-month-label";

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.className = "hk-calendar-nav";
  nextBtn.textContent = "›";
  nextBtn.setAttribute("aria-label", "Next month");

  header.appendChild(prevBtn);
  header.appendChild(monthLabel);
  header.appendChild(nextBtn);
  wrap.appendChild(header);

  const dowRow = document.createElement("div");
  dowRow.className = "hk-calendar-dow-row";
  for (const dow of DOW_LABELS) {
    const d = document.createElement("div");
    d.className = "hk-calendar-dow";
    d.textContent = dow;
    dowRow.appendChild(d);
  }
  wrap.appendChild(dowRow);

  const grid = document.createElement("div");
  grid.className = "hk-calendar-grid";
  wrap.appendChild(grid);

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

  function renderMonth(): void {
    monthLabel.textContent = new Date(cursorYear, cursorMonth, 1).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    grid.innerHTML = "";

    const startOffset = new Date(cursorYear, cursorMonth, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(cursorYear, cursorMonth + 1, 0).getDate();

    for (let i = 0; i < startOffset; i++) {
      const pad = document.createElement("div");
      pad.className = "hk-calendar-cell hk-heatmap-cell empty";
      grid.appendChild(pad);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(cursorYear, cursorMonth, day);
      const key = dateKey(d);
      const count = countsByDate.get(key) ?? 0;
      const intensity = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCount) * 4));

      const cell = document.createElement("div");
      cell.className = `hk-calendar-cell hk-heatmap-cell level-${intensity}`;
      cell.dataset.date = key;

      const dayNum = document.createElement("span");
      dayNum.className = "hk-calendar-daynum";
      dayNum.textContent = String(day);
      cell.appendChild(dayNum);

      const dayLabel = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
      cell.title = `${dayLabel}: ${count} ${count === 1 ? "entry" : "entries"}`;

      if (count > 0) {
        cell.tabIndex = 0;
        cell.setAttribute("role", "button");
        cell.setAttribute("aria-label", cell.title);
        const activate = (): void => onDayClick(key);
        cell.addEventListener("click", activate);
        cell.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activate();
          }
        });
      }

      grid.appendChild(cell);
    }
  }

  prevBtn.addEventListener("click", () => {
    cursorMonth -= 1;
    if (cursorMonth < 0) {
      cursorMonth = 11;
      cursorYear -= 1;
    }
    renderMonth();
  });
  nextBtn.addEventListener("click", () => {
    cursorMonth += 1;
    if (cursorMonth > 11) {
      cursorMonth = 0;
      cursorYear += 1;
    }
    renderMonth();
  });

  renderMonth();
  return wrap;
}
