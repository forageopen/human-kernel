// Shared safe localStorage JSON helpers - extracted from the identical
// try/JSON.parse/catch-fallback (read) and try/JSON.stringify/catch-swallow
// (write) shape duplicated across avatar.ts, mascot.ts, and draggable.ts.
// Each caller keeps its own key-naming (per-widget-id, per-spec, etc) and
// just delegates the parse/stringify + error-swallowing mechanics here.

/** Reads `key` from localStorage and JSON-parses it, returning `fallback` if
 * nothing's stored, storage is unavailable, or the stored value isn't valid
 * JSON. */
export function getJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** JSON-stringifies `value` and writes it to `key` - silently no-ops if
 * storage is unavailable (private browsing, quota exceeded, etc), same as
 * every other persistence write in this app. */
export function setJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // no persistence available this session
  }
}
