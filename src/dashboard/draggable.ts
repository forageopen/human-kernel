// Generic drag-to-move + native-resize widget positioning (2026-08-02,
// direct request: "resizeable movable card... moving, it's not static").
// No external drag/resize library - vanilla pointer events for dragging,
// the browser's own `resize: both` (already on .hk-widget/.hk-drawer in
// styles.css) for resizing, which needs zero JS at all. Position/size
// persists per-widget-id in localStorage so a visitor's arrangement
// survives a reload; first-time visitors get whatever default the CSS/
// inline styles already set.

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function storageKey(id: string): string {
  return `hk-widget-rect-${id}`;
}

export function loadRect(id: string): Rect | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return null;
    return JSON.parse(raw) as Rect;
  } catch {
    return null;
  }
}

export function saveRect(id: string, rect: Rect): void {
  try {
    localStorage.setItem(storageKey(id), JSON.stringify(rect));
  } catch {
    // no persistence available this session
  }
}

/** Applies a stored rect (if any) to `el` as inline styles. Returns whether
 * one was found and applied - callers use this to know whether to fall back
 * to their own CSS-authored default position. */
export function applyStoredRect(el: HTMLElement, id: string): boolean {
  const rect = loadRect(id);
  if (!rect) return false;
  el.style.left = `${rect.left}px`;
  el.style.top = `${rect.top}px`;
  el.style.width = `${rect.width}px`;
  el.style.height = `${rect.height}px`;
  return true;
}

/** Wires drag-to-move (via `handle`, typically the widget's header bar) and
 * persists both drag moves and native `resize:both` changes for `el` under
 * `id`. `canvas` is the positioned ancestor drags are constrained to - never
 * allowed left of its left edge, above its top edge, or fully off its right
 * edge. */
export function makeDraggable(el: HTMLElement, handle: HTMLElement, canvas: HTMLElement, id: string): void {
  applyStoredRect(el, id);

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  const persist = (): void => {
    saveRect(id, {
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
  };

  handle.addEventListener("pointerdown", (e) => {
    dragging = true;
    el.classList.add("dragging");
    startX = e.clientX;
    startY = e.clientY;
    startLeft = el.offsetLeft;
    startTop = el.offsetTop;
    handle.setPointerCapture(e.pointerId);
  });

  handle.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const maxLeft = Math.max(0, canvas.clientWidth - el.offsetWidth);
    el.style.left = `${Math.min(Math.max(0, startLeft + dx), maxLeft)}px`;
    el.style.top = `${Math.max(0, startTop + dy)}px`;
  });

  const endDrag = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    el.classList.remove("dragging");
    try {
      handle.releasePointerCapture(e.pointerId);
    } catch {
      // capture was never actually granted (e.g. synthetic event in tests) - fine to ignore
    }
    persist();
  };
  handle.addEventListener("pointerup", endDrag);
  handle.addEventListener("pointercancel", endDrag);

  // Native `resize: both` doesn't fire a dedicated DOM event - ResizeObserver
  // is the standard way to detect it and is what persists the new size.
  if (typeof ResizeObserver !== "undefined") {
    const ro = new ResizeObserver(() => {
      if (!dragging) persist();
    });
    ro.observe(el);
  }
}
