/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { startReminders, requestNotificationPermission, areNotificationsEnabled, type ReminderTarget } from "./reminder.js";
import { saveSupplementTime, saveTakenOn, currentKlDateKey, type Supplement } from "./supplements.js";

const CREATINE: Supplement = { id: "creatine", name: "Creatine Monohydrate" };
const MAGNESIUM: Supplement = { id: "magnesium", name: "Magnesium Bisglycinate" };

function makeTarget(supplement: Supplement, checked = false): ReminderTarget {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = checked;
  return { supplement, checkbox };
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

  function setup(targets: ReminderTarget[]) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const controller = startReminders(targets, container);
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
});
