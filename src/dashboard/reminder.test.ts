/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  startReminders,
  requestNotificationPermission,
  areNotificationsEnabled,
  type ReminderTarget,
  type CountdownTarget,
} from "./reminder.js";
import { saveSupplementTime, saveTakenOn, currentKlDateKey, saveStartedAt, type Supplement } from "./supplements.js";
import { renderAcuteSupplementCard } from "./supplement-card.js";

const CREATINE: Supplement = {
  id: "creatine",
  name: "Creatine Monohydrate",
  info: "Saturates with consistent use - a continuous daily baseline, not a per-dose window.",
  effectProfile: "baseline",
};
const MAGNESIUM: Supplement = {
  id: "magnesium",
  name: "Magnesium Bisglycinate",
  info: "Daily baseline mineral - typically taken as ongoing support, not for a single-dose window.",
  effectProfile: "baseline",
};
const L_THEANINE: Supplement = {
  id: "l-theanine",
  name: "L-Theanine",
  info: "Acute, single-dose effect - commonly described as winding down within a few hours.",
  effectProfile: "acute",
  recommendedDurationMinutes: 150,
};

function makeTarget(supplement: Supplement, checked = false): ReminderTarget {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  return { supplement, checkbox };
}

function makeCountdownTarget(supplement: Supplement): CountdownTarget {
  return { supplement, elements: renderAcuteSupplementCard(supplement) };
}

describe("requestNotificationPermission", () => {
  const realNotification = (globalThis as { Notification?: unknown }).Notification;
  afterEach(() => {
    (globalThis as { Notification?: unknown }).Notification = realNotification;
  });

  it("resolves false, without throwing, when Notification isn't supported at all", async () => {
    delete (globalThis as { Notification?: unknown }).Notification;
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });

  it("resolves true and updates areNotificationsEnabled when the user grants permission", async () => {
    (globalThis as unknown as { Notification: unknown }).Notification = {
      requestPermission: () => Promise.resolve("granted"),
    };
    await expect(requestNotificationPermission()).resolves.toBe(true);
    expect(areNotificationsEnabled()).toBe(true);
  });

  it("resolves false when the user denies permission", async () => {
    (globalThis as unknown as { Notification: unknown }).Notification = {
      requestPermission: () => Promise.resolve("denied"),
    };
    await expect(requestNotificationPermission()).resolves.toBe(false);
    expect(areNotificationsEnabled()).toBe(false);
  });
});

describe("startReminders", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-03T00:00:00.000Z")); // 08:00 in KL
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(targets: ReminderTarget[], countdownTargets: CountdownTarget[] = []) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const controller = startReminders(targets, container, countdownTargets);
    return { container, controller };
  }

  it("re-syncs each target's checkbox to today's real saved state immediately on start", () => {
    saveTakenOn("creatine", currentKlDateKey(new Date()), true);
    const target = makeTarget(CREATINE, false); // stale on-screen state
    setup([target]);
    expect(target.checkbox.checked).toBe(true);
  });

  it("does not fire a reminder for a supplement with no time set", () => {
    const target = makeTarget(CREATINE);
    const { container } = setup([target]);
    expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(0);
  });

  it("does not fire a reminder before the set time has arrived", () => {
    saveSupplementTime("creatine", "09:00"); // current KL time is 08:00
    const target = makeTarget(CREATINE);
    const { container } = setup([target]);
    expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(0);
  });

  it("fires a toast reminder once the set time has arrived", () => {
    saveSupplementTime("creatine", "08:00"); // current KL time is 08:00 - due now
    const target = makeTarget(CREATINE);
    const { container } = setup([target]);
    const toasts = container.querySelectorAll(".hk-reminder-toast");
    expect(toasts.length).toBe(1);
    expect(toasts[0]?.textContent).toContain("Creatine Monohydrate");
  });

  it("does not fire a reminder for a supplement already saved as taken today", () => {
    saveSupplementTime("creatine", "08:00");
    saveTakenOn("creatine", currentKlDateKey(new Date()), true); // real source of truth, not just the DOM checkbox
    const target = makeTarget(CREATINE, true);
    const { container } = setup([target]);
    expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(0);
  });

  it("fires independently per supplement - one due, one not", () => {
    saveSupplementTime("creatine", "08:00"); // due
    saveSupplementTime("magnesium", "20:00"); // not due yet
    const creatineTarget = makeTarget(CREATINE);
    const magnesiumTarget = makeTarget(MAGNESIUM);
    const { container } = setup([creatineTarget, magnesiumTarget]);
    const toasts = container.querySelectorAll(".hk-reminder-toast");
    expect(toasts.length).toBe(1);
    expect(toasts[0]?.textContent).toContain("Creatine Monohydrate");
  });

  it("does not fire the same reminder twice on repeated ticks the same day", () => {
    saveSupplementTime("creatine", "08:00");
    const target = makeTarget(CREATINE);
    const { container } = setup([target]);
    expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(1);

    vi.advanceTimersByTime(20_000);
    vi.advanceTimersByTime(20_000);
    expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(1); // still just the one
  });

  it("stops firing/re-syncing entirely once stopped", () => {
    saveSupplementTime("creatine", "10:00"); // not due yet at 08:00
    const target = makeTarget(CREATINE);
    const { container, controller } = setup([target]);
    controller.stop();

    // Move the clock forward past 10:00 - without the ticker running, this
    // should never fire.
    vi.setSystemTime(new Date("2026-08-03T03:00:00.000Z")); // 11:00 in KL
    vi.advanceTimersByTime(20_000);
    expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(0);
  });

  it("a toast's close button dismisses it", () => {
    saveSupplementTime("creatine", "08:00");
    const target = makeTarget(CREATINE);
    const { container } = setup([target]);
    const toast = container.querySelector(".hk-reminder-toast")!;
    const closeBtn = toast.querySelector<HTMLElement>(".hk-close")!;
    closeBtn.dispatchEvent(new Event("click", { bubbles: true }));
    expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(0);
  });

  describe("countdown targets (Founder Override)", () => {
    it("updates a running countdown's displayed text immediately on start", () => {
      saveStartedAt("l-theanine", Date.now() - 10 * 60_000); // started 10 minutes ago
      const ct = makeCountdownTarget(L_THEANINE);
      setup([], [ct]);
      expect(ct.elements.countdownEl.textContent).toBe("2h 20m remaining"); // 150 - 10 = 140min
    });

    it("keeps updating the countdown text on later ticks", () => {
      saveStartedAt("l-theanine", Date.now());
      const ct = makeCountdownTarget(L_THEANINE);
      setup([], [ct]);
      expect(ct.elements.countdownEl.textContent).toBe("2h 30m remaining");

      vi.setSystemTime(new Date(Date.now() + 60 * 60_000)); // 1 hour later
      vi.advanceTimersByTime(20_000); // trigger the next tick
      expect(ct.elements.countdownEl.textContent).toBe("1h 30m remaining");
    });

    it("does not fire any toast for a countdown that hasn't been started", () => {
      const ct = makeCountdownTarget(L_THEANINE);
      const { container } = setup([], [ct]);
      expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(0);
    });

    it("fires a completion toast exactly once when a countdown has already crossed zero", () => {
      saveStartedAt("l-theanine", Date.now() - 999 * 60_000); // started way in the past - already finished
      const ct = makeCountdownTarget(L_THEANINE);
      const { container } = setup([], [ct]);
      const toasts = container.querySelectorAll(".hk-reminder-toast");
      expect(toasts.length).toBe(1);
      expect(toasts[0]?.textContent).toContain("L-Theanine");
      expect(ct.elements.countdownEl.textContent).toBe("Effect window ended");
    });

    it("does not fire the completion toast again on repeated ticks for the same run", () => {
      saveStartedAt("l-theanine", Date.now() - 999 * 60_000);
      const ct = makeCountdownTarget(L_THEANINE);
      const { container } = setup([], [ct]);
      expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(1);

      vi.advanceTimersByTime(20_000);
      vi.advanceTimersByTime(20_000);
      expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(1); // still just the one
    });

    it("fires a fresh completion toast for a new run started after an earlier one finished", () => {
      saveStartedAt("l-theanine", Date.now() - 999 * 60_000); // finished run #1
      const ct = makeCountdownTarget(L_THEANINE);
      const { container } = setup([], [ct]);
      expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(1);

      // Move the clock forward first so run #2 gets a genuinely different
      // startedAt timestamp from run #1 - otherwise both saves would
      // compute the identical value and correctly dedupe as "the same run".
      vi.setSystemTime(new Date(Date.now() + 60_000));
      saveStartedAt("l-theanine", Date.now() - 999 * 60_000); // run #2, also already finished
      vi.advanceTimersByTime(20_000);
      expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(2);
    });

    it("reminder targets and countdown targets fire independently in the same tick", () => {
      saveSupplementTime("creatine", "08:00"); // due
      saveStartedAt("l-theanine", Date.now() - 999 * 60_000); // also due (finished)
      const target = makeTarget(CREATINE);
      const ct = makeCountdownTarget(L_THEANINE);
      const { container } = setup([target], [ct]);
      expect(container.querySelectorAll(".hk-reminder-toast").length).toBe(2);
    });
  });
});
