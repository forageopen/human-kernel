// Light/dark theme toggle (2026-08-02, fifth pass, direct request). Both
// tiers are real, locked brand definitions (forage-colorway skill,
// FDMAI-BRAND-001: "Forage Deep Minds" dark x Ember Gold, "Forage Open"
// light x Sage) - this wires the switch, it does not invent a palette. Dark
// is the guideline's own stated default; the choice persists in
// localStorage so it survives a reload. See styles.css's `[data-theme]`
// block for the actual color values.

const STORAGE_KEY = "hk-theme";
export type Theme = "dark" | "light";

export function getStoredTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function applyTheme(theme: Theme): void {
  if (theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.removeAttribute("data-theme");
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

export function toggleTheme(): Theme {
  const next: Theme = getStoredTheme() === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}

/** Applies the stored theme immediately, labels the button with the OTHER
 * mode (what clicking it will switch to - matches how most theme toggles
 * are actually labeled), and flips on click. */
export function wireThemeToggle(button: HTMLElement): void {
  const render = (theme: Theme): void => {
    button.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  };
  render(initTheme());
  button.addEventListener("click", () => render(toggleTheme()));
}
