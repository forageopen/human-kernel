// Six additional visualization cards (requested: a GitHub-style daily
// calendar heatmap plus >=5 more chart types, chosen against the taxonomy at
// datavizproject.com - Heat Map, Bar Chart, Histogram, Donut Chart, Radar
// Diagram all appear there as established chart types).
//
// Every chart here derives from fields that actually exist on Evidence /
// Parameter / Relationship (see ../types.ts). None of them invent a data
// axis the schema doesn't have - that's the exact mistake flagged earlier
// with a literal SWOT card (Strengths/Weaknesses/Opportunities/Threats has
// no home in this data model; domain/status/confidence/timestamp do).
//
// Chart.js is loaded as a plain global script via CDN in index.html, not an
// npm dependency - keeps the no-bundler, vanilla-DOM architecture intact.
// Deliberately absent in jsdom tests (no canvas support there), so drawChart
// no-ops when the global isn't present - tests exercise the DOM/data-shaping
// logic, not Chart.js's own internal canvas rendering.

import type { Evidence, Parameter, Relationship } from "../types.js";

declare const Chart: new (
  ctx: HTMLCanvasElement,
  config: unknown
) => { destroy(): void };

const EMBER = "#c8a96e";
const SAGE = "#7a8c6e";
const CRIMSON = "#c1286b";
const STONE = "#b0ada4";
const GRID_LINE = "rgba(200, 169, 110, 0.12)";

const liveCharts = new Map<string, { destroy(): void }>();

function drawChart(canvas: HTMLCanvasElement, id: string, config: unknown): void {
  if (typeof Chart === "undefined") return; // no CDN script loaded (e.g. jsdom tests) - nothing to draw
  liveCharts.get(id)?.destroy();
  liveCharts.set(id, new Chart(canvas, config));
}

function baseScaleOptions() {
  return {
    x: { ticks: { color: STONE, font: { family: "JetBrains Mono", size: 10 } }, grid: { color: GRID_LINE } },
    y: { ticks: { color: STONE, font: { family: "JetBrains Mono", size: 10 } }, grid: { color: GRID_LINE }, beginAtZero: true },
  };
}

/** Bar: Parameter count per Domain - volume, not quality. */
export function drawDomainCountChart(canvas: HTMLCanvasElement, parameters: Parameter[]): void {
  const byDomain = new Map<string, number>();
  for (const p of parameters) byDomain.set(p.domain, (byDomain.get(p.domain) ?? 0) + 1);
  drawChart(canvas, "domain-count", {
    type: "bar",
    data: {
      labels: Array.from(byDomain.keys()),
      datasets: [{ data: Array.from(byDomain.values()), backgroundColor: EMBER, borderRadius: 4 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false, // fill .hk-chart-canvas-wrap's fixed height so every card in the grid matches
      plugins: { legend: { display: false } },
      scales: baseScaleOptions(),
    },
  });
}

/** Histogram: Parameter confidence distribution, 5 bins across 0.0-1.0. */
export function drawConfidenceHistogram(canvas: HTMLCanvasElement, parameters: Parameter[]): void {
  const bins = [0, 0, 0, 0, 0];
  for (const p of parameters) {
    const idx = Math.min(4, Math.max(0, Math.floor(p.confidence / 0.2)));
    bins[idx] = (bins[idx] ?? 0) + 1;
  }
  drawChart(canvas, "confidence-hist", {
    type: "bar",
    data: {
      labels: ["0.0-0.2", "0.2-0.4", "0.4-0.6", "0.6-0.8", "0.8-1.0"],
      datasets: [{ data: bins, backgroundColor: SAGE, borderRadius: 4 }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: baseScaleOptions(),
    },
  });
}

/** Donut: Parameter status breakdown (draft / verified / disputed). */
export function drawStatusDonut(canvas: HTMLCanvasElement, parameters: Parameter[]): void {
  const counts = { draft: 0, verified: 0, disputed: 0 };
  for (const p of parameters) counts[p.status] += 1;
  drawChart(canvas, "status-donut", {
    type: "doughnut",
    data: {
      labels: ["Draft", "Verified", "Disputed"],
      datasets: [{ data: [counts.draft, counts.verified, counts.disputed], backgroundColor: [STONE, SAGE, CRIMSON] }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: STONE, font: { family: "DM Sans" } } } },
    },
  });
}

/** Horizontal bar: Relationship type breakdown (causal/correlated/contradicts/supports). */
export function drawRelationshipTypeChart(canvas: HTMLCanvasElement, relationships: Relationship[]): void {
  const counts = { causal: 0, correlated: 0, contradicts: 0, supports: 0 };
  for (const r of relationships) counts[r.relationshipType] += 1;
  drawChart(canvas, "relationship-types", {
    type: "bar",
    data: {
      labels: ["Causal", "Correlated", "Contradicts", "Supports"],
      datasets: [
        {
          data: [counts.causal, counts.correlated, counts.contradicts, counts.supports],
          backgroundColor: EMBER,
          borderRadius: 4,
        },
      ],
    },
    options: {
      indexAxis: "y" as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: baseScaleOptions(),
    },
  });
}

/** Horizontal bar: which source files contributed the most Evidence (top 8). */
export function drawSourceFileChart(canvas: HTMLCanvasElement, evidence: Evidence[]): void {
  const byFile = new Map<string, number>();
  for (const e of evidence) byFile.set(e.sourceFile, (byFile.get(e.sourceFile) ?? 0) + 1);
  const sorted = Array.from(byFile.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  drawChart(canvas, "source-files", {
    type: "bar",
    data: {
      labels: sorted.map(([f]) => f),
      datasets: [{ data: sorted.map(([, c]) => c), backgroundColor: SAGE, borderRadius: 4 }],
    },
    options: {
      indexAxis: "y" as const,
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: baseScaleOptions(),
    },
  });
}

/** Radar: mean confidence per Domain - the quality/certainty counterpart to
 * the plain count bar above (two different real statistics, not padding). */
export function drawDomainConfidenceRadar(canvas: HTMLCanvasElement, parameters: Parameter[]): void {
  const byDomain = new Map<string, number[]>();
  for (const p of parameters) {
    const list = byDomain.get(p.domain) ?? [];
    list.push(p.confidence);
    byDomain.set(p.domain, list);
  }
  const labels = Array.from(byDomain.keys());
  const data = labels.map((d) => {
    const vals = byDomain.get(d) ?? [];
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });
  drawChart(canvas, "domain-radar", {
    type: "radar",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: "rgba(200, 169, 110, 0.15)",
          borderColor: EMBER,
          pointBackgroundColor: EMBER,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0,
          max: 1,
          ticks: { color: STONE, backdropColor: "transparent" },
          grid: { color: GRID_LINE },
          angleLines: { color: GRID_LINE },
          pointLabels: { color: STONE, font: { family: "JetBrains Mono", size: 10 } },
        },
      },
    },
  });
}

/** Picks the calendar month with the most Evidence to show by default. A
 * hardcoded "always show the current month" default silently shows an empty
 * grid for any vault whose real activity doesn't happen to fall in the
 * current month - true for the bundled reference profile itself, whose real
 * file-mtimes cluster on one evening over a year ago (see sample-vault/
 * README.md). Falls back to today when there's no Evidence at all. */
export function monthWithMostEvidence(evidence: Evidence[]): Date {
  if (evidence.length === 0) return new Date();
  const counts = new Map<string, number>();
  for (const e of evidence) {
    const d = new Date(e.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let bestKey = "";
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  const [year, month] = bestKey.split("-").map(Number);
  return new Date(year ?? new Date().getFullYear(), month ?? 0, 1);
}

/** GitHub-style calendar heatmap, one real month, hand-built (no chart lib
 * needed for this one). Cell intensity = count of Evidence timestamps that
 * calendar day, scaled against that month's own max - a proxy for
 * documentation activity, deliberately not labeled "productivity" since the
 * data doesn't support that stronger claim. */
export function renderEvidenceHeatmap(evidence: Evidence[], monthDate: Date = new Date()): HTMLElement {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const countsByDay = new Map<number, number>();
  for (const e of evidence) {
    const d = new Date(e.timestamp);
    if (d.getFullYear() === year && d.getMonth() === month) {
      countsByDay.set(d.getDate(), (countsByDay.get(d.getDate()) ?? 0) + 1);
    }
  }
  const maxCount = Math.max(1, ...Array.from(countsByDay.values()));
  const monthLabel = monthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const wrap = document.createElement("div");
  wrap.className = "hk-heatmap";

  const label = document.createElement("div");
  label.className = "hk-label";
  label.textContent = `EVIDENCE ACTIVITY — ${monthLabel.toUpperCase()}`;
  wrap.appendChild(label);

  const caption = document.createElement("div");
  caption.className = "hk-muted hk-heatmap-caption";
  caption.textContent =
    "Evidence entries captured per day - a proxy for documentation activity, not a productivity score.";
  wrap.appendChild(caption);

  const grid = document.createElement("div");
  grid.className = "hk-heatmap-grid";

  for (const dow of ["S", "M", "T", "W", "T", "F", "S"]) {
    const h = document.createElement("div");
    h.className = "hk-heatmap-dow";
    h.textContent = dow;
    grid.appendChild(h);
  }

  for (let i = 0; i < firstWeekday; i++) {
    const filler = document.createElement("div");
    filler.className = "hk-heatmap-cell empty";
    grid.appendChild(filler);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const count = countsByDay.get(day) ?? 0;
    const intensity = count === 0 ? 0 : Math.min(4, Math.ceil((count / maxCount) * 4));
    const cell = document.createElement("div");
    cell.className = `hk-heatmap-cell level-${intensity}`;
    cell.title = `${monthLabel} ${day}: ${count} evidence ${count === 1 ? "entry" : "entries"}`;
    cell.textContent = String(day);
    grid.appendChild(cell);
  }

  wrap.appendChild(grid);
  return wrap;
}
