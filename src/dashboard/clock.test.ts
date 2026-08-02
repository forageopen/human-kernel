/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from "vitest";
import { formatKlDateTime, startLiveClock } from "./clock.js";

describe("formatKlDateTime", () => {
  it("converts a UTC instant to Asia/Kuala_Lumpur (UTC+8), not the test machine's local timezone", () => {
    // 2026-01-15T00:30:00Z + 8h = 2026-01-15 08:30:00 in KL = 8:30:00 AM.
    expect(formatKlDateTime(new Date("2026-01-15T00:30:00.000Z"))).toBe("January 15, Q1, 2026 · 8:30:00 AM");
  });

  it("rolls over to the next KL calendar day when UTC+8 crosses midnight", () => {
    // 2026-01-15T20:00:00Z + 8h = 2026-01-16 04:00:00 in KL - a different day
    // from the UTC date, which is exactly the bug a naive local-Date version
    // of this would get wrong for anyone not already in +8.
    expect(formatKlDateTime(new Date("2026-01-15T20:00:00.000Z"))).toBe("January 16, Q1, 2026 · 4:00:00 AM");
  });

  it("computes the correct quarter at each quarter boundary", () => {
    // 04:00 UTC -> 12:00 KL same day (well clear of the +8h day-rollover
    // that a 20:00 UTC instant would hit - that's a different, deliberate
    // test above, not something to also trip over here by accident).
    expect(formatKlDateTime(new Date("2026-03-31T04:00:00.000Z"))).toContain(", Q1, ");
    expect(formatKlDateTime(new Date("2026-04-01T00:00:00.000Z"))).toContain(", Q2, ");
    expect(formatKlDateTime(new Date("2026-06-30T04:00:00.000Z"))).toContain(", Q2, ");
    expect(formatKlDateTime(new Date("2026-07-01T00:00:00.000Z"))).toContain(", Q3, ");
    expect(formatKlDateTime(new Date("2026-09-30T04:00:00.000Z"))).toContain(", Q3, ");
    expect(formatKlDateTime(new Date("2026-10-01T00:00:00.000Z"))).toContain(", Q4, ");
    expect(formatKlDateTime(new Date("2026-12-31T04:00:00.000Z"))).toContain(", Q4, ");
  });

  it("shows midnight as 12 AM, not 0 AM (hourCycle h12, not hour12:true)", () => {
    // 2026-08-01T16:00:00Z + 8h = 2026-08-02 00:00:00 in KL - the exact
    // instant a naive 12-hour formatter could render as "0:00:00 AM".
    expect(formatKlDateTime(new Date("2026-08-01T16:00:00.000Z"))).toBe("August 2, Q3, 2026 · 12:00:00 AM");
  });

  it("shows noon as 12 PM, not 0 PM or 12 AM", () => {
    // 2026-08-02T04:00:00Z + 8h = 2026-08-02 12:00:00 in KL.
    expect(formatKlDateTime(new Date("2026-08-02T04:00:00.000Z"))).toBe("August 2, Q3, 2026 · 12:00:00 PM");
  });
});

describe("startLiveClock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sets the initial text immediately, without waiting for the first tick", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02T04:00:00.000Z")); // 2026-08-02 12:00:00 PM KL
    const el = document.createElement("div");
    startLiveClock(el);
    expect(el.textContent).toBe("August 2, Q3, 2026 · 12:00:00 PM");
  });

  it("updates every interval tick", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02T04:00:00.000Z"));
    const el = document.createElement("div");
    startLiveClock(el);

    // Fake timers advance the mocked clock itself - no separate setSystemTime
    // call needed (that would double-advance: once manually, once via this).
    vi.advanceTimersByTime(1000);
    expect(el.textContent).toBe("August 2, Q3, 2026 · 12:00:01 PM");
  });

  it("the returned stop function halts further ticks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-02T04:00:00.000Z"));
    const el = document.createElement("div");
    const stop = startLiveClock(el);
    stop();

    vi.advanceTimersByTime(5000);
    expect(el.textContent).toBe("August 2, Q3, 2026 · 12:00:00 PM"); // unchanged
  });
});
