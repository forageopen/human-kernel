// Auto-hide left "scene" taskbar (2026-08-02, direct request: "i need a
// auto-hide taskbar on the left. where you can enable (again after close) &
// or disable each cards from the scene (lets call the background as
// scene)"). Three jobs: a live show/hide switch for every card AND roaming
// avatar on the canvas (the same mechanism the close (x) button on each
// card writes to - see draggable.ts's createWidget - reused directly for
// the mascot/dog too, since they're just elements with the same
// loadVisible/saveVisible + .hk-widget-hidden pattern, wired from main.ts);
// a slider controlling the shared background-animation speed (particles.ts,
// starchase.ts, and sakura.ts all read the same --hk-speed CSS variable);
// and a slider controlling how many colors fireworks.ts is allowed to pick
// from for its next burst (a genuine JS-level choice, not a CSS variable -
// see fireworks.ts's own header for why).
//
// Later direct request: "adjust left taskbar to be fully auto-hidden" - the
// resting sliver used to be a visible 34px labeled tab; it's now a fully
// transparent ~6px hover zone at the exact screen edge (styles.css), with
// the tab's own visible chrome only appearing once the panel is actually
// open. Nothing about that change touches this file - it's a pure CSS
// state, same :hover/:focus-within/.open mechanism as before.
//
// The open/close ("auto-hide") behavior itself is pure CSS, so nothing here
// needs to manage open/closed state in JS at all. This file only needs to
// keep the toggle switches truthful (re-read each item's real visibility
// every time the panel is opened, since a card's own close button - or the
// mascot/dog having no close button at all, only this panel - can change
// that state independently) and to persist/restore the two slider choices.

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

/** Writes --hk-speed on <html> - particles.ts's, starchase.ts's, and
 * sakura.ts's animation-duration formulas all divide their base duration by
 * this one shared value, so a single slider speeds up or slows down every
 * ambient background layer together. */
export function applySpeed(speed: number): void {
  document.documentElement.style.setProperty("--hk-speed", String(speed));
}

const FIREWORK_COLORS_KEY = "hk-scene-firework-colors";
const DEFAULT_FIREWORK_COLORS = 8;
export const MIN_FIREWORK_COLORS = 1;
export const MAX_FIREWORK_COLORS = 24;

export function loadFireworkColorCount(): number {
  try {
    const raw = localStorage.getItem(FIREWORK_COLORS_KEY);
    if (raw === null) return DEFAULT_FIREWORK_COLORS;
    const n = Number(raw);
    return Number.isFinite(n) && n >= MIN_FIREWORK_COLORS && n <= MAX_FIREWORK_COLORS ? n : DEFAULT_FIREWORK_COLORS;
  } catch {
    return DEFAULT_FIREWORK_COLORS;
  }
}

export function saveFireworkColorCount(count: number): void {
  try {
    localStorage.setItem(FIREWORK_COLORS_KEY, String(count));
  } catch {
    // no persistence available this session
  }
}

// ---------------------------------------------------------------------
// Card/avatar list reordering (2026-08-03, direct request: "i want the
// ability to sort cards & avatar order on the taskbar"). Deliberately
// scoped to the TASKBAR LIST ORDER only, not each card's actual position on
// the canvas - Adam's wording ("on the taskbar") and draggable.ts's existing
// per-widget canvas position are a separate concern already solved
// separately; this doesn't move anything on the canvas itself. Mascot/dog
// are just more SceneCardEntry objects in the same `entries` array (see
// main.ts), so this one mechanism covers "cards & avatars" together with no
// special-casing needed.

const ORDER_KEY = "hk-scene-card-order";

export function loadCardOrder(): string[] | null {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.every((x) => typeof x === "string") ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

export function saveCardOrder(order: string[]): void {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  } catch {
    // no persistence available this session
  }
}

/** Reorders `entries` per any previously-saved drag order. Entries with no
 * saved position (new cards added since the order was last saved) keep
 * their relative order and are appended after everything that DOES have a
 * saved position. Saved IDs that no longer match any current entry are
 * silently ignored - a card being removed shouldn't corrupt everyone else's
 * order. Pure - takes and returns plain data, no DOM/localStorage side
 * effects of its own beyond the loadCardOrder() read. */
export function applyStoredOrder(entries: SceneCardEntry[]): SceneCardEntry[] {
  const order = loadCardOrder();
  if (!order) return entries;
  const byId = new Map(entries.map((e) => [e.id, e] as const));
  const used = new Set<string>();
  const ordered: SceneCardEntry[] = [];
  for (const id of order) {
    const entry = byId.get(id);
    if (entry && !used.has(id)) {
      ordered.push(entry);
      used.add(id);
    }
  }
  for (const entry of entries) {
    if (!used.has(entry.id)) ordered.push(entry);
  }
  return ordered;
}

export function renderScenePanel(entries: SceneCardEntry[]): {
  root: HTMLElement;
  tab: HTMLElement;
  toggleInputs: Map<string, HTMLInputElement>;
  speedSlider: HTMLInputElement;
  fireworkSlider: HTMLInputElement;
  footer: HTMLElement;
  list: HTMLElement;
  rowElements: Map<string, HTMLElement>;
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

  const fireworkLabel = document.createElement("label");
  fireworkLabel.className = "hk-scene-speed-label";
  fireworkLabel.textContent = "Firework colors";
  const fireworkSlider = document.createElement("input");
  fireworkSlider.type = "range";
  fireworkSlider.min = String(MIN_FIREWORK_COLORS);
  fireworkSlider.max = String(MAX_FIREWORK_COLORS);
  fireworkSlider.step = "1";
  fireworkSlider.className = "hk-scene-speed-slider";
  fireworkLabel.appendChild(fireworkSlider);
  inner.appendChild(fireworkLabel);

  const listHeading = document.createElement("div");
  listHeading.className = "hk-label hk-scene-cards-heading";
  listHeading.textContent = "Cards & avatars";
  inner.appendChild(listHeading);

  const list = document.createElement("div");
  list.className = "hk-scene-card-list";
  const toggleInputs = new Map<string, HTMLInputElement>();
  const rowElements = new Map<string, HTMLElement>();
  for (const entry of applyStoredOrder(entries)) {
    const row = document.createElement("label");
    row.className = "hk-scene-card-row";
    row.dataset.widgetId = entry.id;

    const grip = document.createElement("span");
    grip.className = "hk-scene-row-grip";
    grip.textContent = "⠿⠿";
    grip.setAttribute("aria-hidden", "true");
    row.appendChild(grip);

    const input = document.createElement("input");
    input.type = "checkbox";
    input.dataset.widgetId = entry.id;
    const span = document.createElement("span");
    span.textContent = entry.label;
    row.appendChild(input);
    row.appendChild(span);
    list.appendChild(row);
    toggleInputs.set(entry.id, input);
    rowElements.set(entry.id, row);
  }
  inner.appendChild(list);

  // Footer slot (2026-08-03, direct request: quote widget "under footer of
  // the taskbar"). Deliberately an empty, unopinionated container - this
  // file stays decoupled from quote-widget.ts (same boundary as every other
  // feature module: main.ts is the one place that composes independent
  // pieces together, e.g. it appends notepad.ts's root into a Notes widget's
  // body rather than notepad.ts and draggable.ts importing each other).
  const footer = document.createElement("div");
  footer.className = "hk-scene-panel-footer";
  inner.appendChild(footer);

  root.appendChild(inner);

  return { root, tab, toggleInputs, speedSlider, fireworkSlider, footer, list, rowElements };
}

/** Pointer-driven row reordering (2026-08-03) - vanilla pointer events, same
 * philosophy as draggable.ts's card dragging rather than the native HTML5
 * drag-and-drop API. Dragging a row's grip live-reorders the DOM (moving the
 * row past whichever sibling's vertical midpoint the pointer has crossed);
 * releasing the pointer reads the final DOM order back out and persists it.
 * A `click` on the grip is also prevented from bubbling into the label's
 * native "click anywhere in the label toggles its checkbox" behavior - the
 * grip is for reordering only, never a toggle target. */
function wireRowReordering(list: HTMLElement, rowElements: Map<string, HTMLElement>): void {
  let draggingRow: HTMLElement | null = null;

  const onPointerMove = (e: PointerEvent): void => {
    if (!draggingRow) return;
    const siblings = Array.from(list.querySelectorAll<HTMLElement>(".hk-scene-card-row")).filter(
      (r) => r !== draggingRow
    );
    for (const row of siblings) {
      const rect = row.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      if (e.clientY < midpoint) {
        list.insertBefore(draggingRow, row);
        return;
      }
    }
    list.appendChild(draggingRow); // past every sibling's midpoint - goes last
  };

  const endDrag = (): void => {
    if (!draggingRow) return;
    draggingRow.classList.remove("dragging");
    draggingRow = null;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", endDrag);
    const newOrder = Array.from(list.querySelectorAll<HTMLElement>(".hk-scene-card-row")).map(
      (r) => r.dataset.widgetId!
    );
    saveCardOrder(newOrder);
  };

  for (const row of rowElements.values()) {
    const grip = row.querySelector<HTMLElement>(".hk-scene-row-grip");
    if (!grip) continue;
    grip.addEventListener("click", (e) => e.preventDefault());
    grip.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      draggingRow = row;
      row.classList.add("dragging");
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", endDrag);
    });
  }
}

export function wireScenePanel(
  root: HTMLElement,
  tab: HTMLElement,
  toggleInputs: Map<string, HTMLInputElement>,
  speedSlider: HTMLInputElement,
  entries: SceneCardEntry[],
  fireworkSlider?: HTMLInputElement,
  onFireworkColorsChange?: (count: number) => void,
  reorder?: { list: HTMLElement; rowElements: Map<string, HTMLElement> }
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

  if (fireworkSlider) {
    const count = loadFireworkColorCount();
    fireworkSlider.value = String(count);
    onFireworkColorsChange?.(count);
    fireworkSlider.addEventListener("input", () => {
      const value = Number(fireworkSlider.value);
      saveFireworkColorCount(value);
      onFireworkColorsChange?.(value);
    });
  }

  if (reorder) wireRowReordering(reorder.list, reorder.rowElements);

  syncToggles();
}
