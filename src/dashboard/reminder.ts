// Reminder mechanism (2026-08-03, Cognitive Supplement Dashboard, Phase 0
// only - spec: "A reminder at each time"). Checks every supplement's set
// time against the real clock roughly every 20s while the page is open;
// fires an in-page toast (always works, no permission needed) plus a
// browser Notification if the user has explicitly opted in - never
// requested automatically, see requestNotificationPermission. Each
// supplement's reminder fires at most once per KL calendar day: once it has
// fired, or the box has been checked, it stays quiet until the next KL day.
// This same tick is also what keeps every card's "taken today" checkbox
// honest across a midnight rollover - see supplement-card.ts's
// resyncSupplementCardCheckbox - one shared clock instead of five
// independent per-card timers drifting apart from each other.
//
// Deliberately NOT a service worker / push subscription - that's real
// infrastructure (HTTPS scope registration, a push server, a separate
// permission flow) this Phase 0 test doesn't call for. "A reminder at each
// time" is satisfied honestly by a foreground check while the tab is open,
// not silently oversold as something that works with the tab or browser
// closed - runs regardless of which internal dashboard tab (Dashboard vs
// Supplements) is currently selected, since the reminder is just as
// meaningful while looking at the other one.

import { loadSupplementTime, loadTakenOn, currentKlTime, currentKlDateKey, isReminderDue, type Supplement } from "./supplements.js";
import { resyncSupplementCardCheckbox } from "./supplement-card.js";

const CHECK_INTERVAL_MS = 20_000;

export interface ReminderTarget {
  supplement: Supplement;
  checkbox: HTMLInputElement;
}

let notificationsEnabled = false;

/** Explicit opt-in only - never requested automatically on page load or tab
 * switch (a real click handler should call this, since browsers require a
 * user gesture for the permission prompt anyway). Resolves false, with no
 * error, if Notifications aren't supported at all - that just means this
 * degrades to toast-only. */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === "undefined") return false;
  try {
    const result = await Notification.requestPermission();
    notificationsEnabled = result === "granted";
    return notificationsEnabled;
  } catch {
    return false;
  }
}

/** Test/diagnostic hook only - real callers drive this via the actual
 * requestNotificationPermission() flow. */
export function areNotificationsEnabled(): boolean {
  return notificationsEnabled;
}

function showToast(container: HTMLElement, supplementName: string): void {
  const toast = document.createElement("div");
  toast.className = "hk-reminder-toast";

  const msg = document.createElement("span");
  msg.textContent = `${supplementName} - time to take it.`;
  toast.appendChild(msg);

  const closeBtn = document.createElement("span");
  closeBtn.className = "hk-close";
  closeBtn.textContent = "×";
  closeBtn.tabIndex = 0;
  closeBtn.setAttribute("role", "button");
  closeBtn.setAttribute("aria-label", "Dismiss reminder");
  const dismiss = (): void => toast.remove();
  closeBtn.addEventListener("click", dismiss);
  closeBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      dismiss();
    }
  });
  toast.appendChild(closeBtn);

  container.appendChild(toast);
}

function showNotification(supplementName: string): void {
  if (!notificationsEnabled || typeof Notification === "undefined") return;
  try {
    new Notification("Human on Cloud", { body: `${supplementName} - time to take it.` });
  } catch {
    // Notification can throw in some contexts (e.g. an origin that only
    // permits it via a service worker) - the toast above already covers it
    // either way, so there's nothing else to do here.
  }
}

export interface ReminderController {
  stop: () => void;
}

/** Starts the shared clock. Immediately re-syncs every target's checkbox to
 * the real KL day, then re-checks every ~20s; fires a toast + optional
 * Notification for any supplement whose time has arrived and hasn't fired
 * yet today. Returns a stop function (same shape as clock.ts's
 * startLiveClock). */
export function startReminders(targets: ReminderTarget[], toastContainer: HTMLElement): ReminderController {
  let lastDateKey = currentKlDateKey(new Date());
  const firedToday = new Set<string>(); // supplement id - cleared on KL date rollover

  const tick = (): void => {
    const now = new Date();
    const todayKey = currentKlDateKey(now);
    const nowTime = currentKlTime(now);

    if (todayKey !== lastDateKey) {
      lastDateKey = todayKey;
      firedToday.clear();
    }

    for (const target of targets) {
      resyncSupplementCardCheckbox(target.supplement, target.checkbox, todayKey);

      const setTime = loadSupplementTime(target.supplement.id);
      const taken = loadTakenOn(target.supplement.id, todayKey);
      const due = isReminderDue(setTime, nowTime, taken);

      if (due && !firedToday.has(target.supplement.id)) {
        firedToday.add(target.supplement.id);
        showToast(toastContainer, target.supplement.name);
        showNotification(target.supplement.name);
      }
    }
  };

  tick();
  const id = setInterval(tick, CHECK_INTERVAL_MS);
  return { stop: () => clearInterval(id) };
}
