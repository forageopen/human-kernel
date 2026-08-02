// Time-of-day window model (2026-08-02, direct request: "Time window
// (currently it's which window - refer the six window designed)" and "a
// card of suggest activity 'Best time for' (refer the six hour window)").
//
// REAL CONTENT (as of the same day, later upload): Adam supplied
// Adaptive-Daily-OS-Three-Layer-Model.md. WINDOWS below is Layer 2 of that
// document - the "Six-Window ROI Map" - close to verbatim to his own
// "best for / poor for" framing per window. This replaces the generic
// illustrative placeholder this file shipped with earlier the same day
// (see git history if you need to compare); the `.hk-placeholder-flag` UI
// note is gone along with it, since the content is no longer a placeholder.
//
// Two things from that same document are deliberately NOT wired in here:
// - Layer 3 (a "Cognitive Cue System": two currents, Mind-work and
//   Hand-work, switched on a mood/vibe cue rather than a clock, plus a
//   3-question retrospective test for logging unplanned activity after the
//   fact). It's real, and it's richer than either card Adam actually asked
//   for here - it describes a mode-switch signal, not an hour range - so it
//   doesn't fit "Time window" or "Best time for" as designed. Worth its own
//   card later; sitting unused for now rather than force-fit.
// - Layer 1 (the hour-by-hour "Ideal Visualized Routine") isn't even fully
//   supplied in this document - it points to a separate file,
//   24H-Adaptive-Daily-OS-v2.md, for that detail, which hasn't been
//   uploaded either.
//
// One boundary note on the source text itself: written as "Early afternoon
// (noon-3 PM)" then "Late afternoon (4-6 PM)", which leaves 3-4 PM
// uncovered by either window as literally stated. Read as loose/rounded
// hour-labels rather than a deliberate gap - Early Afternoon's endHour below
// is 16 (4 PM), not 15, so all 24 hours resolve to exactly one window.
// Flagged here rather than silently smoothed over.

export interface TimeWindow {
  name: string;
  startHour: number; // 0-23, local Kuala Lumpur time
  endHour: number; // exclusive
  bestFor: string;
  poorFor: string;
}

export const WINDOWS: TimeWindow[] = [
  {
    name: "Late Night",
    startHour: 0,
    endHour: 5,
    bestFor: "Open, associative thinking - letting one idea drift into another without needing either to land anywhere - and light reflective or meaning-processing.",
    poorFor: "Committing to a decision with real consequences, holding fixed categories in mind, or absorbing new information you'll need to recall later - retention is weak here even when the thought feels vivid.",
  },
  {
    name: "Morning",
    startHour: 5,
    endHour: 9,
    bestFor: "Placing things into a system that already exists - sorting, filing, low-judgment ordering - since self-criticism hasn't switched on yet. Also fine for revisiting material already seen.",
    poorFor: "Anything needing a hard decision or genuinely new ideas - neither judgment nor creative flow has opened up yet.",
  },
  {
    name: "Late Morning Peak",
    startHour: 9,
    endHour: 12,
    bestFor: "Complex, multi-variable reasoning, and actually committing to a call - agree or disagree, accept or reject. Also the best window for taking in new information and keeping it.",
    poorFor: "Loose, wandering thought - the analytical mind is too switched on and keeps interrupting anything open-ended.",
  },
  {
    name: "Early Afternoon",
    startHour: 12,
    endHour: 16,
    bestFor: "Rule-based, repetitive placement work - sorting into an existing structure rather than judging whether the structure is right - and tolerant of physical movement since it needs little sharp cognition.",
    poorFor: "Fresh decisions, deep analysis, or absorbing anything new - the weakest retention point of the day.",
  },
  {
    name: "Late Afternoon",
    startHour: 16,
    endHour: 18,
    bestFor: "Physical output (the body's energetic peak) and anything relational - conversation, processing something together with another person.",
    poorFor: "Solitary deep analysis or dense reading - attention pulls outward rather than inward here.",
  },
  {
    name: "Evening",
    startHour: 18,
    endHour: 24,
    bestFor: "Generative, associative thought and reflective processing - exploring rather than resolving.",
    poorFor: "Locking in consequential decisions or retaining dense new material - the mind is oriented toward wandering, not encoding.",
  },
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

export function renderTimeWindowCard(now: Date = new Date(), windows: TimeWindow[] = WINDOWS): HTMLElement {
  const wrap = document.createElement("div");
  const current = currentWindow(now, windows);

  const list = document.createElement("div");
  list.className = "hk-window-list";
  for (const w of windows) {
    const row = document.createElement("div");
    row.className = "hk-window-row" + (w.name === current.name ? " current" : "");
    row.innerHTML = `
      <div class="hk-window-row-top">
        <span class="hk-window-name">${w.name}</span>
        <span class="hk-window-range">${formatHour(w.startHour)}-${formatHour(w.endHour)}</span>
      </div>
      <div class="hk-window-suggestion">${w.bestFor}</div>
    `;
    list.appendChild(row);
  }
  wrap.appendChild(list);
  return wrap;
}

export function renderBestTimeForCard(now: Date = new Date(), windows: TimeWindow[] = WINDOWS): HTMLElement {
  const wrap = document.createElement("div");
  const current = currentWindow(now, windows);

  const heading = document.createElement("div");
  heading.className = "hk-window-name";
  heading.textContent = `Right now: ${current.name}`;
  wrap.appendChild(heading);

  const best = document.createElement("div");
  best.className = "hk-window-suggestion";
  best.style.marginTop = "8px";
  best.innerHTML = `<b>Best for</b> - ${current.bestFor}`;
  wrap.appendChild(best);

  const poor = document.createElement("div");
  poor.className = "hk-window-suggestion";
  poor.style.marginTop = "8px";
  poor.innerHTML = `<b>Not great for</b> - ${current.poorFor}`;
  wrap.appendChild(poor);

  const source = document.createElement("div");
  source.className = "hk-muted";
  source.style.marginTop = "10px";
  source.textContent = "From Adam's Adaptive Daily OS - Six-Window ROI Map.";
  wrap.appendChild(source);

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
