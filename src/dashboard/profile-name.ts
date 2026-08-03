// Editable profile header name/title (2026-08-03, direct request: "the
// header 'Adam Rosman', instead of my name, I want it to be editable upon
// clicking, like anyone can either write their name, or can write any title
// for their project"). Same click-to-edit interaction as draggable.ts's
// createWidget `editableTitle` option (Notes card renaming): click or
// Enter/Space arms editing (contentEditable, select-all), Enter or blur
// commits, Escape cancels, and a blank commit falls back to the original
// default rather than persisting empty. Reimplemented here rather than
// routed through createWidget, since #hk-profile-name isn't a widget at all
// - no drag handle, no close button, not on the canvas - and forcing it
// through that machinery would mean carrying widget-only concerns (the
// close button's aria-label wording, the drag-handle pointerdown conflict)
// into page chrome that has neither.
//
// Persistence reuses draggable.ts's loadTitle/saveTitle directly under a
// fixed id - that pair is already generic (id + default in, string out)
// and there's no reason to duplicate a second localStorage key scheme for
// the exact same shape of problem.

import { loadTitle, saveTitle } from "./draggable.js";

const PROFILE_NAME_ID = "profile-header-name";

export function loadProfileName(defaultName: string): string {
  return loadTitle(PROFILE_NAME_ID, defaultName);
}

export function saveProfileName(name: string): void {
  saveTitle(PROFILE_NAME_ID, name);
}

export interface ProfileNameHandle {
  /** Current name/title, live - reflects any in-session rename. */
  getName: () => string;
}

/** Wires click-to-edit onto `el` (index.html's #hk-profile-name, which
 * already carries tabindex/role/aria-label in static markup - this only
 * adds behavior, not accessibility attributes, and keeps the aria-label in
 * sync with the live value on every rename). Restores any previously-saved
 * name/title immediately. */
export function wireProfileName(el: HTMLElement, defaultName: string): ProfileNameHandle {
  let currentName = loadProfileName(defaultName);
  el.textContent = currentName;
  el.setAttribute("aria-label", `${currentName} - click to edit`);

  const startEditing = (): void => {
    el.contentEditable = "true";
    el.textContent = currentName;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const commitEditing = (): void => {
    el.contentEditable = "false";
    // Never save a blank name/title - an empty edit falls back to the
    // original default this page shipped with, not to nothing.
    currentName = el.textContent?.trim() || defaultName;
    el.textContent = currentName;
    el.setAttribute("aria-label", `${currentName} - click to edit`);
    saveProfileName(currentName);
  };

  const cancelEditing = (): void => {
    el.contentEditable = "false";
    el.textContent = currentName;
  };

  el.addEventListener("click", () => {
    if (el.contentEditable !== "true") startEditing();
  });
  el.addEventListener("keydown", (e) => {
    if (el.contentEditable !== "true") {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        startEditing();
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      el.blur(); // blur listener below runs commitEditing()
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEditing();
      el.blur();
    }
  });
  el.addEventListener("blur", () => {
    if (el.contentEditable === "true") commitEditing();
  });

  return { getName: () => currentName };
}
