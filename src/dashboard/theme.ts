// Theme cycle: Dark -> Light -> Feminine -> Dark (2026-08-02, extended from
// the original dark/light toggle by direct request: "New theme mode:
// Feminine - (light pink-maroon)"). Dark and Light are real, locked brand
// definitions (forage-colorway skill, FDMAI-BRAND-001: "Forage Deep Minds"
// dark x Ember Gold, "Forage Open" light x Sage). Feminine is NOT part of
// that brand guideline - it's a deliberate, explicitly-flagged personal
// theming option for Adam's own dashboard, same category as the mascot's
// purple (mascot.ts): a one-off outside the locked palette, added because
// it was directly requested, never presented as official Forage identity.
// See styles.css's `[data-theme]` blocks for the actual color values. Dark
// stays the default (the guideline's own stated default for the two real
// tiers); the choice persists in localStorage so it survives a reload.

const STORAGE_KEY = "hk-theme";
export type Theme = "dark" | "light" | "feminine";

const CYCLE: readonly Theme[] = ["dark", "light", "feminine"];

const LABELS: Record<Theme, string> = {
  dark: "Dark mode",
  light: "Light mode",
  feminine: "Feminine mode",
};

export function getStoredTheme(): Theme {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw === "light" || raw === "feminine" ? raw : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme): void {
  if (theme === "dark") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable (private mode, disabled) - theme still
    // applies for this session, it just won't persist across a reload.
  }
}

export function initTheme(): Theme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}

function nextInCycle(theme: Theme): Theme {
  const idx = CYCLE.indexOf(theme);
  return CYCLE[(idx + 1) % CYCLE.length]!;
}

/** Advances one step through Dark -> Light -> Feminine -> Dark. */
export function toggleTheme(): Theme {
  const next = nextInCycle(getStoredTheme());
  applyTheme(next);
  return next;
}

/** Applies the stored theme immediately and labels the button with the mode
 * CURRENTLY active - not the one clicking it leads to. (Direct correction:
 * the original two-mode toggle showed the NEXT mode, e.g. "Light mode" while
 * dark was on screen; with a third, visually distinct Feminine palette added,
 * that label-vs-colors mismatch read as every mode being "wrong" - dark on
 * screen labeled "Light mode", light on screen labeled "Feminine mode", and
 * so on around the cycle. The button now always names what you're looking
 * at.) Advances one step through the cycle on click, then re-labels for the
 * theme that click just applied. */
export function wireThemeToggle(button: HTMLElement): void {
  const render = (theme: Theme): void => {
    button.textContent = LABELS[theme];
  };
  render(initTheme());
  button.addEventListener("click", () => render(toggleTheme()));
}
