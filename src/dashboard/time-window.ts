// Time-of-day window model (2026-08-02, direct request: "Time window
// (currently it's which window - refer the six window designed)" and "a
// card of suggest activity 'Best time for' (refer the six hour window)").
//
// FLAGGED, NOT INVENTED: Adam's actual "Adaptive Daily OS Three-Layer
// Model" document - the real source for "the six windows" - did not come
// through in the upload (only 3 HTML mockups did, and neither describes a
// six-window daily model; they cover a different six-part thing, the Six
// Domains taxonomy). Rather than invent Adam's own proprietary framework,
// WINDOWS below is a generic, clearly-labeled ILLUSTRATIVE six-window
// structure so the feature itself - live tracking of "which window is it
// right now," and a suggestion tied to it - is real and working. Swap the
// array below for the real model once supplied; renderTimeWindowCard/
// renderBestTimeForCard and everything that calls them keeps working
// unchanged. Both render functions surface `.hk-placeholder-flag` in the
// DOM so this is visibly marked as pending, not silently presented as real.

export interface TimeWindow {
  name: string;
  startHour: number; // 0-23, local Kuala Lumpur time
  endHour: number; // exclusive
  suggestion: string;
}

export const WINDOWS: TimeWindow[] = [
  { name: "Pre-Dawn", startHour: 0, endHour: 5, suggestion: "Rest, or quiet reflection before the day starts." },
  { name: "Morning", startHour: 5, endHour: 10, suggestion: "Focused work - attention is usually freshest here." },
  { name: "Midday", startHour: 10, endHour: 14, suggestion: "Meetings and collaboration - anything that needs other people." },
  { name: "Afternoon", startHour: 14, endHour: 18, suggestion: "Lighter tasks, admin, follow-ups." },
  { name: "Evening", startHour: 18, endHour: 21, suggestion: "Wind down - family, personal time." },
  { name: "Night", startHour: 21, endHour: 24, suggestion: "Reflection, planning tomorrow, early rest." },
];

function klHour(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  return Number(parts.find((p) => p.type === "hour")?.value ?? 0);
}

export function currentWindow(now: Date = new Date(), windows: TimeWindow[] = WINDOWS): TimeWindow {
  const hour = klHour(now);
  return windows.find((w) => hour >= w.startHour && hour < w.endHour) ?? windows[windows.length - 1]!;
}

function formatHour(h: number): string {
  const hour24 = h % 24;
  const period = hour24 < 12 ? "AM" : "PM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}${period}`;
}

function placeholderFlag(text: string): HTMLElement {
  const flag = document.createElement("div");
  flag.className = "hk-placeholder-flag";
  flag.textContent = text;
  return flag;
}

export function renderTimeWindowCard(now: Date = new Date(), windows: TimeWindow[] = WINDOWS): HTMLElement {
  const wrap = document.createElement("div");
  const current = currentWindow(now, windows);

  const list = document.createElement("div");
  list.className = "hk-window-list";
  for (const w of windows) {
    const row = document.createElement("div");
    row.className = "hk-window-row" + (w.name === current.name ? " current" : "");
    row.innerHTML = `<span class="hk-window-name">${w.name}</span><span class="hk-window-range">${formatHour(w.startHour)}-${formatHour(w.endHour)}</span>`;
    list.appendChild(row);
  }
  wrap.appendChild(list);
  wrap.appendChild(placeholderFlag("Illustrative for now - this gets more personal as more is added."));
  return wrap;
}

export function renderBestTimeForCard(now: Date = new Date(), windows: TimeWindow[] = WINDOWS): HTMLElement {
  const wrap = document.createElement("div");
  const current = currentWindow(now, windows);

  const heading = document.createElement("div");
  heading.className = "hk-window-name";
  heading.textContent = `Right now: ${current.name}`;
  wrap.appendChild(heading);

  const suggestion = document.createElement("div");
  suggestion.className = "hk-window-suggestion";
  suggestion.style.marginTop = "6px";
  suggestion.textContent = current.suggestion;
  wrap.appendChild(suggestion);

  wrap.appendChild(placeholderFlag("Illustrative for now - this gets more personal as more is added."));
  return wrap;
}

/** Thin timer-owning wrappers (same split pattern as clock.ts/prayer-times.ts:
 * a pure render function plus a small "start" wrapper that owns the
 * interval). Window boundaries are hour-based, so a minute-scale tick is
 * more than enough to keep "which window is current" honest without a busy
 * loop. Both return a stop function. */
export function startTimeWindowCard(container: HTMLElement, tickMs = 60000): () => void {
  const tick = (): void => {
    container.innerHTML = "";
    container.appendChild(renderTimeWindowCard(new Date()));
  };
  tick();
  const id = setInterval(tick, tickMs);
  return () => clearInterval(id);
}

export function startBestTimeForCard(container: HTMLElement, tickMs = 60000): () => void {
  const tick = (): void => {
    container.innerHTML = "";
    container.appendChild(renderBestTimeForCard(new Date()));
  };
  tick();
  const id = setInterval(tick, tickMs);
  return () => clearInterval(id);
}
