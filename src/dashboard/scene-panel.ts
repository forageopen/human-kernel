// Auto-hide left "scene" taskbar (2026-08-02, direct request: "i need a
// auto-hide taskbar on the left. where you can enable (again after close) &
// or disable each cards from the scene (lets call the background as
// scene)"). Two jobs: a live show/hide switch for every card on the canvas
// (the same mechanism the close (x) button on each card also writes to -
// see draggable.ts's createWidget), and a slider controlling the shared
// background-animation speed (particles.ts + starchase.ts both read the
// same --hk-speed CSS variable this slider writes).
//
// The open/close ("auto-hide") behavior itself is pure CSS - `:hover` and
// `:focus-within` on .hk-scene-panel, plus a `.open` class for a click/touch
// toggle since hover doesn't exist on touch devices - so nothing here needs
// to manage open/closed state in JS at all. This file only needs to keep
// the toggle switches truthful (re-read each card's real visibility every
// time the panel is opened, since a card's own close button can change that
// state without the panel knowing) and to persist/restore the speed choice.

export interface SceneCardEntry {
  id: string;
  label: string;
  isVisible: () => boolean;
  setVisible: (visible: boolean) => void;
}

const SPEED_KEY = "hk-scene-speed";
const DEFAULT_SPEED = 1;
export const MIN_SPEED = 0.25;
export const MAX_SPEED = 3;

export function loadSpeed(): number {
  try {
    const raw = localStorage.getItem(SPEED_KEY);
    if (raw === null) return DEFAULT_SPEED;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_SPEED;
  } catch {
    return DEFAULT_SPEED;
  }
}

export function saveSpeed(speed: number): void {
  try {
    localStorage.setItem(SPEED_KEY, String(speed));
  } catch {
    // no persistence available this session
  }
}

/** Writes --hk-speed on <html> - both particles.ts's and starchase.ts's
 * animation-duration formulas divide their base duration by this one shared
 * value, so a single slider speeds up or slows down both layers together. */
export function applySpeed(speed: number): void {
  document.documentElement.style.setProperty("--hk-speed", String(speed));
}

export function renderScenePanel(entries: SceneCardEntry[]): {
  root: HTMLElement;
  tab: HTMLElement;
  toggleInputs: Map<string, HTMLInputElement>;
  speedSlider: HTMLInputElement;
} {
  const root = document.createElement("div");
  root.className = "hk-scene-panel";

  const tab = document.createElement("button");
  tab.type = "button";
  tab.className = "hk-scene-tab";
  tab.setAttribute("aria-label", "Open scene controls");
  tab.innerHTML = `<span aria-hidden="true">&#9776;</span>`;
  root.appendChild(tab);

  const inner = document.createElement("div");
  inner.className = "hk-scene-panel-inner";

  const heading = document.createElement("div");
  heading.className = "hk-label";
  heading.textContent = "Scene";
  inner.appendChild(heading);

  const speedLabel = document.createElement("label");
  speedLabel.className = "hk-scene-speed-label";
  speedLabel.textContent = "Background motion speed";
  const speedSlider = document.createElement("input");
  speedSlider.type = "range";
  speedSlider.min = String(MIN_SPEED);
  speedSlider.max = String(MAX_SPEED);
  speedSlider.step = "0.05";
  speedSlider.className = "hk-scene-speed-slider";
  speedLabel.appendChild(speedSlider);
  inner.appendChild(speedLabel);

  const listHeading = document.createElement("div");
  listHeading.className = "hk-label hk-scene-cards-heading";
  listHeading.textContent = "Cards";
  inner.appendChild(listHeading);

  const list = document.createElement("div");
  list.className = "hk-scene-card-list";
  const toggleInputs = new Map<string, HTMLInputElement>();
  for (const entry of entries) {
    const row = document.createElement("label");
    row.className = "hk-scene-card-row";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.widgetId = entry.id;
    const span = document.createElement("span");
    span.textContent = entry.label;
    row.appendChild(input);
    row.appendChild(span);
    list.appendChild(row);
    toggleInputs.set(entry.id, input);
  }
  inner.appendChild(list);

  root.appendChild(inner);

  return { root, tab, toggleInputs, speedSlider };
}

export function wireScenePanel(
  root: HTMLElement,
  tab: HTMLElement,
  toggleInputs: Map<string, HTMLInputElement>,
  speedSlider: HTMLInputElement,
  entries: SceneCardEntry[]
): void {
  const syncToggles = (): void => {
    for (const entry of entries) {
      const input = toggleInputs.get(entry.id);
      if (input) input.checked = entry.isVisible();
    }
  };

  tab.addEventListener("click", () => {
    root.classList.toggle("open");
    if (root.classList.contains("open")) syncToggles();
  });
  root.addEventListener("mouseenter", syncToggles);

  for (const entry of entries) {
    const input = toggleInputs.get(entry.id);
    input?.addEventListener("change", () => entry.setVisible(input.checked));
  }

  const speed = loadSpeed();
  speedSlider.value = String(speed);
  applySpeed(speed);
  speedSlider.addEventListener("input", () => {
    const value = Number(speedSlider.value);
    applySpeed(value);
    saveSpeed(value);
  });

  syncToggles();
}
