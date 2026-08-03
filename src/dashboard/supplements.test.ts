/** @vitest-environment jsdom */
import { describe, it, expect, beforeEach } from "vitest";
import {
  SUPPLEMENTS,
  currentKlTime,
  currentKlDateKey,
  loadSupplementTime,
  saveSupplementTime,
  loadTakenOn,
  saveTakenOn,
  isReminderDue,
  loadEffectDurationMinutes,
  saveEffectDurationMinutes,
  loadStartedAt,
  saveStartedAt,
  clearStartedAt,
  remainingEffectMs,
  formatCountdown,
} from "./supplements.js";

describe("SUPPLEMENTS", () => {
  it("is exactly the 5 supplements from the spec, in order", () => {
    expect(SUPPLEMENTS.map((s) => s.name)).toEqual([
      "Creatine Monohydrate",
      "L-Theanine",
      "Magnesium Bisglycinate",
      "Omega-3",
      "Vitamin D3+K2",
    ]);
  });

  it("does not include Biotin or Iron - explicitly out per the spec", () => {
    const names = SUPPLEMENTS.map((s) => s.name.toLowerCase());
    expect(names.some((n) => n.includes("biotin"))).toBe(false);
    expect(names.some((n) => n.includes("iron"))).toBe(false);
  });

  it("has a unique, non-empty id for every supplement", () => {
    const ids = SUPPLEMENTS.map((s) => s.id);
    expect(ids.every((id) => id.length > 0)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every supplement a non-empty info blurb", () => {
    expect(SUPPLEMENTS.every((s) => s.info.length > 0)).toBe(true);
  });

  it("marks only L-Theanine as acute - the other four stay baseline (Founder Override scope)", () => {
    const acute = SUPPLEMENTS.filter((s) => s.effectProfile === "acute").map((s) => s.id);
    expect(acute).toEqual(["l-theanine"]);
    const baseline = SUPPLEMENTS.filter((s) => s.effectProfile === "baseline").map((s) => s.id);
    expect(baseline).toEqual(["creatine", "magnesium", "omega-3", "vitamin-d3-k2"]);
  });

  it("only the acute supplement has a recommendedDurationMinutes", () => {
    const lTheanine = SUPPLEMENTS.find((s) => s.id === "l-theanine")!;
    expect(lTheanine.recommendedDurationMinutes).toBe(150);
    for (const s of SUPPLEMENTS.filter((s) => s.effectProfile === "baseline")) {
      expect(s.recommendedDurationMinutes).toBeUndefined();
    }
  });
});

describe("currentKlTime", () => {
  it("converts a UTC instant to Asia/Kuala_Lumpur (UTC+8), not the test machine's local timezone", () => {
    // 2026-01-15T00:30:00Z + 8h = 08:30 in KL.
    expect(currentKlTime(new Date("2026-01-15T00:30:00.000Z"))).toBe("08:30");
  });

  it("rolls over to the next KL calendar day's early hours when UTC+8 crosses midnight", () => {
    // 2026-01-15T20:00:00Z + 8h = 2026-01-16 04:00 in KL.
    expect(currentKlTime(new Date("2026-01-15T20:00:00.000Z"))).toBe("04:00");
  });

  it("is zero-padded and 24-hour (matches <input type=\"time\">'s own value format)", () => {
    // 2026-08-02T04:00:00Z + 8h = 2026-08-02 12:00 in KL (noon).
    expect(currentKlTime(new Date("2026-08-02T04:00:00.000Z"))).toBe("12:00");
    // 2026-08-01T16:00:00Z + 8h = 2026-08-02 00:00 in KL (midnight).
    expect(currentKlTime(new Date("2026-08-01T16:00:00.000Z"))).toBe("00:00");
  });
});

describe("currentKlDateKey", () => {
  it("returns YYYY-MM-DD in Asia/Kuala_Lumpur", () => {
    expect(currentKlDateKey(new Date("2026-01-15T00:30:00.000Z"))).toBe("2026-01-15");
  });

  it("rolls to the next date once KL time crosses midnight, even though UTC hasn't yet", () => {
    // 2026-01-15T20:00:00Z is still Jan 15 in UTC, but 2026-01-16 04:00 in KL.
    expect(currentKlDateKey(new Date("2026-01-15T20:00:00.000Z"))).toBe("2026-01-16");
  });
});

describe("loadSupplementTime / saveSupplementTime", () => {
  beforeEach(() => localStorage.clear());

  it("returns an empty string when nothing has been set - no suggested default time", () => {
    expect(loadSupplementTime("creatine")).toBe("");
  });

  it("round-trips a saved time", () => {
    saveSupplementTime("creatine", "07:30");
    expect(loadSupplementTime("creatine")).toBe("07:30");
  });

  it("stores each supplement's time independently", () => {
    saveSupplementTime("creatine", "07:30");
    saveSupplementTime("magnesium", "21:00");
    expect(loadSupplementTime("creatine")).toBe("07:30");
    expect(loadSupplementTime("magnesium")).toBe("21:00");
  });
});

describe("loadTakenOn / saveTakenOn", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to false for a date nothing was ever saved for", () => {
    expect(loadTakenOn("creatine", "2026-08-03")).toBe(false);
  });

  it("round-trips taken=true for a specific date", () => {
    saveTakenOn("creatine", "2026-08-03", true);
    expect(loadTakenOn("creatine", "2026-08-03")).toBe(true);
  });

  it("keeps each date independent - checking off today doesn't affect other days", () => {
    saveTakenOn("creatine", "2026-08-03", true);
    expect(loadTakenOn("creatine", "2026-08-04")).toBe(false);
    expect(loadTakenOn("creatine", "2026-08-02")).toBe(false);
  });

  it("saving taken=false clears it back to the default (doesn't just store a literal false)", () => {
    saveTakenOn("creatine", "2026-08-03", true);
    saveTakenOn("creatine", "2026-08-03", false);
    expect(loadTakenOn("creatine", "2026-08-03")).toBe(false);
    expect(localStorage.getItem("hk-supplement-taken-creatine-2026-08-03")).toBeNull();
  });
});

describe("isReminderDue", () => {
  it("is never due if no time has been set", () => {
    expect(isReminderDue("", "08:00", false)).toBe(false);
  });

  it("is never due once already taken, regardless of time", () => {
    expect(isReminderDue("07:00", "12:00", true)).toBe(false);
  });

  it("is not due before the set time", () => {
    expect(isReminderDue("08:00", "07:59", false)).toBe(false);
  });

  it("is due exactly at the set time", () => {
    expect(isReminderDue("08:00", "08:00", false)).toBe(true);
  });

  it("stays due any time after the set time, until taken", () => {
    expect(isReminderDue("08:00", "23:59", false)).toBe(true);
  });
});

describe("loadEffectDurationMinutes / saveEffectDurationMinutes", () => {
  beforeEach(() => localStorage.clear());
  const lTheanine = SUPPLEMENTS.find((s) => s.id === "l-theanine")!;
  const creatine = SUPPLEMENTS.find((s) => s.id === "creatine")!;

  it("defaults to the supplement's recommendedDurationMinutes before anything is saved", () => {
    expect(loadEffectDurationMinutes(lTheanine)).toBe(150);
  });

  it("defaults to 0 for a supplement with no recommendedDurationMinutes", () => {
    expect(loadEffectDurationMinutes(creatine)).toBe(0);
  });

  it("round-trips a user-saved value, overriding the recommended default", () => {
    saveEffectDurationMinutes("l-theanine", 90);
    expect(loadEffectDurationMinutes(lTheanine)).toBe(90);
  });

  it("falls back to the recommended default for garbage or non-positive stored values", () => {
    localStorage.setItem("hk-supplement-duration-l-theanine", "not-a-number");
    expect(loadEffectDurationMinutes(lTheanine)).toBe(150);
    localStorage.setItem("hk-supplement-duration-l-theanine", "-10");
    expect(loadEffectDurationMinutes(lTheanine)).toBe(150);
  });
});

describe("loadStartedAt / saveStartedAt / clearStartedAt", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to null - no countdown running until Start is pressed", () => {
    expect(loadStartedAt("l-theanine")).toBeNull();
  });

  it("round-trips a saved start timestamp", () => {
    saveStartedAt("l-theanine", 1_700_000_000_000);
    expect(loadStartedAt("l-theanine")).toBe(1_700_000_000_000);
  });

  it("clearStartedAt resets it back to null", () => {
    saveStartedAt("l-theanine", 1_700_000_000_000);
    clearStartedAt("l-theanine");
    expect(loadStartedAt("l-theanine")).toBeNull();
  });

  it("keeps each supplement's started-at independent", () => {
    saveStartedAt("l-theanine", 1_700_000_000_000);
    expect(loadStartedAt("creatine")).toBeNull();
  });
});

describe("remainingEffectMs", () => {
  it("returns the full duration when just started", () => {
    expect(remainingEffectMs(1_000_000, 150, 1_000_000)).toBe(150 * 60_000);
  });

  it("counts down as time elapses", () => {
    const startedAt = 1_000_000;
    const oneHourLaterMs = startedAt + 60 * 60_000;
    expect(remainingEffectMs(startedAt, 150, oneHourLaterMs)).toBe(90 * 60_000); // 150min - 60min = 90min left
  });

  it("floors at 0 once the full duration has elapsed - never goes negative", () => {
    const startedAt = 1_000_000;
    const wayLaterMs = startedAt + 999 * 60_000;
    expect(remainingEffectMs(startedAt, 150, wayLaterMs)).toBe(0);
  });
});

describe("formatCountdown", () => {
  it("shows hours and minutes when an hour or more remains", () => {
    expect(formatCountdown(150 * 60_000)).toBe("2h 30m remaining");
  });

  it("shows just minutes when under an hour remains", () => {
    expect(formatCountdown(45 * 60_000)).toBe("45m remaining");
  });

  it("rounds up to the next minute rather than showing 0m while time is technically left", () => {
    expect(formatCountdown(30_000)).toBe("1m remaining"); // 30 seconds left
  });

  it("reads \"Effect window ended\" at exactly zero and below", () => {
    expect(formatCountdown(0)).toBe("Effect window ended");
    expect(formatCountdown(-5000)).toBe("Effect window ended");
  });
});
