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

// ---------------------------------------------------------------------
// Generic widget chrome (2026-08-02, direct request: "fix close x button
// in each card not showing" + "auto-hide taskbar... enable/disable each
// card from the scene"). Every card on the scene (canvas) is built through
// createWidget below so all of them get the same chrome for free: a drag
// handle, a close (x) control, and a visibility state the left scene
// taskbar can also flip. Closing a widget doesn't destroy it or its
// contents/listeners - it's just `display:none` via .hk-widget-hidden, so a
// hidden Notes card's typed text (or a hidden Prayer card's running timer)
// isn't lost or orphaned, only invisible, and reappears exactly as it was
// the moment it's re-enabled.

function visibilityKey(id: string): string {
  return `hk-widget-visible-${id}`;
}

/** Whether widget `id` should be visible. Reads localStorage; if nothing's
 * been stored yet (first-ever visit, or private browsing), falls back to
 * `defaultVisible` rather than assuming either way. */
export function loadVisible(id: string, defaultVisible: boolean): boolean {
  try {
    const raw = localStorage.getItem(visibilityKey(id));
    if (raw === null) return defaultVisible;
    return raw === "1";
  } catch {
    return defaultVisible;
  }
}

export function saveVisible(id: string, visible: boolean): void {
  try {
    localStorage.setItem(visibilityKey(id), visible ? "1" : "0");
  } catch {
    // no persistence available this session
  }
}

function titleKey(id: string): string {
  return `hk-widget-title-${id}`;
}

/** Whether widget `id` has a custom saved title; falls back to
 * `defaultTitle` if nothing's been saved yet, storage is unavailable, or
 * the saved value is blank (never let a widget end up with an empty
 * title). */
export function loadTitle(id: string, defaultTitle: string): string {
  try {
    const raw = localStorage.getItem(titleKey(id));
    return raw !== null && raw.trim() !== "" ? raw : defaultTitle;
  } catch {
    return defaultTitle;
  }
}

export function saveTitle(id: string, title: string): void {
  try {
    localStorage.setItem(titleKey(id), title);
  } catch {
    // no persistence available this session
  }
}

export interface WidgetHandle {
  id: string;
  /** Title at creation time - already reflects any previously-saved rename
   * (see loadTitle), but is a one-time snapshot, not live. Use getTitle()
   * for the current value after any in-session rename. */
  title: string;
  root: HTMLElement;
  body: HTMLElement;
  setVisible: (visible: boolean) => void;
  isVisible: () => boolean;
  /** Current title, live - identical to `title` unless editableTitle was
   * enabled and the visitor has renamed it since. */
  getTitle: () => string;
}

export interface CreateWidgetOptions {
  defaultRect: Rect;
  /** Whether this widget should be visible the very first time a visitor
   * sees it (before anything is stored). Defaults to true - most cards ship
   * on by default; extra Notes slots pass false so "add a note" reads as an
   * action, not clutter that showed up uninvited. */
  defaultVisible?: boolean;
  /** Direct request (2026-08-03): "ability to rename note from note/note
   * 1/2/3/4/5 to anything user wanted." When true, clicking the title turns
   * it into an editable field; Enter or clicking away saves (persisted per
   * widget-id), Escape cancels. Opt-in and defaults to false - most cards'
   * titles ("Activity", "Upcoming Prayer") describe fixed content that
   * shouldn't invite renaming; only the 5 Notes widgets enable this in
   * main.ts. */
  editableTitle?: boolean;
}

/** Builds one card's full chrome - handle (label + drag grip + close
 * button) and a content body - appends it to `canvas`, wires drag/resize,
 * and restores whatever visibility state was last saved for `id`. Every
 * card on the scene (heatmap, prayer, notes, etc.) is created through this
 * one function so "close" and "the taskbar can show it again" behave
 * identically everywhere, rather than each card reinventing its own chrome. */
export function createWidget(canvas: HTMLElement, id: string, title: string, options: CreateWidgetOptions): WidgetHandle {
  const { defaultRect, defaultVisible = true, editableTitle = false } = options;

  const initialTitle = editableTitle ? loadTitle(id, title) : title;
  let currentTitle = initialTitle;

  const root = document.createElement("div");
  root.className = "hk-widget";
  root.dataset.widgetId = id;
  root.style.left = `${defaultRect.left}px`;
  root.style.top = `${defaultRect.top}px`;
  root.style.width = `${defaultRect.width}px`;
  root.style.height = `${defaultRect.height}px`;

  const handle = document.createElement("div");
  handle.className = "hk-widget-handle";

  const label = document.createElement("span");
  label.className = "hk-label";
  label.style.margin = "0";
  label.textContent = initialTitle;
  handle.appendChild(label);

  const rightGroup = document.createElement("span");
  rightGroup.className = "hk-widget-handle-right";

  const grip = document.createElement("span");
  grip.className = "hk-widget-grip";
  grip.textContent = "⠿⠿";
  rightGroup.appendChild(grip);

  const closeBtn = document.createElement("span");
  closeBtn.className = "hk-widget-close";
  closeBtn.textContent = "×";
  closeBtn.tabIndex = 0;
  closeBtn.setAttribute("role", "button");
  closeBtn.setAttribute("aria-label", `Close ${title}`);
  rightGroup.appendChild(closeBtn);

  handle.appendChild(rightGroup);
  root.appendChild(handle);

  const body = document.createElement("div");
  body.className = "hk-widget-body";
  root.appendChild(body);

  canvas.appendChild(root);
  makeDraggable(root, handle, canvas, id);

  const setVisible = (visible: boolean): void => {
    root.classList.toggle("hk-widget-hidden", !visible);
    saveVisible(id, visible);
  };
  const isVisible = (): boolean => !root.classList.contains("hk-widget-hidden");

  setVisible(loadVisible(id, defaultVisible));

  const close = (): void => setVisible(false);
  closeBtn.addEventListener("click", close);
  closeBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      close();
    }
  });
  // The close button lives inside the drag handle - without this, a click
  // on it would also bubble into makeDraggable's pointerdown listener on
  // `handle` and start a drag at the same time as closing.
  closeBtn.addEventListener("pointerdown", (e) => e.stopPropagation());

  if (editableTitle) {
    label.tabIndex = 0;
    label.setAttribute("role", "button");
    label.setAttribute("aria-label", `${currentTitle} - click to rename`);
    label.classList.add("hk-widget-title-editable");
    // Same reasoning as the close button above - editing lives inside the
    // drag handle, so a click here must never also start a drag.
    label.addEventListener("pointerdown", (e) => e.stopPropagation());

    const startEditing = (): void => {
      label.contentEditable = "true";
      label.textContent = currentTitle;
      label.focus();
      const range = document.createRange();
      range.selectNodeContents(label);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    };

    const commitEditing = (): void => {
      label.contentEditable = "false";
      // Never save a blank title - an empty rename falls back to the
      // original default this widget was created with, not to nothing.
      currentTitle = label.textContent?.trim() || title;
      label.textContent = currentTitle;
      label.setAttribute("aria-label", `${currentTitle} - click to rename`);
      saveTitle(id, currentTitle);
    };

    const cancelEditing = (): void => {
      label.contentEditable = "false";
      label.textContent = currentTitle;
    };

    label.addEventListener("click", () => {
      if (label.contentEditable !== "true") startEditing();
    });
    label.addEventListener("keydown", (e) => {
      if (label.contentEditable !== "true") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startEditing();
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        label.blur(); // blur listener below runs commitEditing()
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEditing();
        label.blur();
      }
    });
    label.addEventListener("blur", () => {
      if (label.contentEditable === "true") commitEditing();
    });
  }

  return { id, title: initialTitle, root, body, setVisible, isVisible, getTitle: () => currentTitle };
}
