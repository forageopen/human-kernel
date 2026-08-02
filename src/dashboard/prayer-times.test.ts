/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from "vitest";
import { loadPrayerData, nextAnchor, formatKlTime, renderPrayerCard, type PrayerAnchor, type PrayerData } from "./prayer-times.js";

function epoch(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

function mockMonthResponse(year: number, month: number, days: Record<number, Partial<RawDayShape>>) {
  return {
    year,
    month_number: month,
    prayers: Object.entries(days).map(([day, times]) => ({
      day: Number(day),
      imsak: 0, fajr: 0, syuruk: 0, dhuha: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0,
      ...times,
    })),
  };
}

interface RawDayShape {
  imsak: number; fajr: number; syuruk: number; dhuha: number;
  dhuhr: number; asr: number; maghrib: number; isha: number;
}

describe("nextAnchor", () => {
  it("returns the first anchor strictly after now", () => {
    const anchors: PrayerAnchor[] = [
      { name: "A", time: new Date("2026-08-02T01:00:00Z") },
      { name: "B", time: new Date("2026-08-02T05:00:00Z") },
      { name: "C", time: new Date("2026-08-02T10:00:00Z") },
    ];
    expect(nextAnchor(anchors, new Date("2026-08-02T02:00:00Z"))?.name).toBe("B");
  });

  it("returns null once every anchor has already passed", () => {
    const anchors: PrayerAnchor[] = [{ name: "A", time: new Date("2026-08-02T01:00:00Z") }];
    expect(nextAnchor(anchors, new Date("2026-08-02T12:00:00Z"))).toBeNull();
  });
});

describe("formatKlTime", () => {
  it("formats in Asia/Kuala_Lumpur regardless of the test machine's timezone", () => {
    // 2026-08-02T04:00:00Z + 8h = 12:00 PM in KL.
    expect(formatKlTime(new Date("2026-08-02T04:00:00.000Z"))).toBe("12:00 PM");
  });
});

describe("loadPrayerData", () => {
  const realFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it("fetches zone WLY01 and returns 8 real anchors plus derived Tahajud/Witr windows", async () => {
    const monthData = mockMonthResponse(2026, 8, {
      2: {
        imsak: epoch("2026-08-01T22:15:00Z"), fajr: epoch("2026-08-01T22:20:00Z"),
        syuruk: epoch("2026-08-01T23:15:00Z"), dhuha: epoch("2026-08-01T23:40:00Z"),
        dhuhr: epoch("2026-08-02T05:15:00Z"), asr: epoch("2026-08-02T09:00:00Z"),
        maghrib: epoch("2026-08-02T11:20:00Z"), isha: epoch("2026-08-02T12:35:00Z"),
      },
      3: {
        imsak: epoch("2026-08-02T22:15:00Z"), fajr: epoch("2026-08-02T22:20:00Z"),
        syuruk: 0, dhuha: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0,
      },
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(monthData),
    }) as unknown as typeof fetch;

    const now = new Date("2026-08-02T06:00:00.000Z");
    const data = await loadPrayerData(now);

    expect(data.anchors).toHaveLength(8);
    expect(data.anchors[0]?.name).toBe("Imsak");
    expect(data.tahajud.end.getTime()).toBe(data.witr.end.getTime()); // both end at tomorrow's Fajr
    expect(data.tahajud.start.getTime()).toBeGreaterThan(data.witr.start.getTime()); // Tahajud starts later (last third only)
    expect(globalThis.fetch).toHaveBeenCalledWith(expect.stringContaining("WLY01"));
  });

  it("fetches next month's data too when tomorrow crosses a month boundary", async () => {
    const augustData = mockMonthResponse(2026, 8, {
      31: {
        imsak: epoch("2026-08-30T22:15:00Z"), fajr: epoch("2026-08-30T22:20:00Z"),
        syuruk: 0, dhuha: 0, dhuhr: 0, asr: 0,
        maghrib: epoch("2026-08-31T11:20:00Z"), isha: epoch("2026-08-31T12:35:00Z"),
      },
    });
    const septemberData = mockMonthResponse(2026, 9, {
      1: {
        imsak: 0, fajr: epoch("2026-08-31T22:20:00Z"),
        syuruk: 0, dhuha: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0,
      },
    });

    globalThis.fetch = vi.fn((url: string) => {
      const monthArg = url.includes("month=9") ? septemberData : augustData;
      return Promise.resolve({ ok: true, json: () => Promise.resolve(monthArg) });
    }) as unknown as typeof fetch;

    const now = new Date("2026-08-31T06:00:00.000Z"); // Aug 31 KL
    const data = await loadPrayerData(now);
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(data.anchors).toHaveLength(8);
  });

  it("throws a clear error when the API responds with a non-OK status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(loadPrayerData(new Date("2026-08-02T06:00:00.000Z"))).rejects.toThrow();
  });

  it("throws rather than fabricating times when the expected day row is missing", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockMonthResponse(2026, 8, {})),
    }) as unknown as typeof fetch;
    await expect(loadPrayerData(new Date("2026-08-02T06:00:00.000Z"))).rejects.toThrow();
  });
});

describe("renderPrayerCard", () => {
  it("marks exactly one anchor row as 'next' and includes both voluntary windows", () => {
    const now = new Date("2026-08-02T06:00:00.000Z");
    const data: PrayerData = {
      anchors: [
        { name: "Imsak", time: new Date("2026-08-02T01:00:00Z") },
        { name: "Zohor", time: new Date("2026-08-02T08:00:00Z") },
      ],
      tahajud: { name: "Tahajud", start: new Date("2026-08-02T20:00:00Z"), end: new Date("2026-08-02T22:00:00Z") },
      witr: { name: "Witr", start: new Date("2026-08-02T13:00:00Z"), end: new Date("2026-08-02T22:00:00Z") },
    };
    const el = renderPrayerCard(data, now);
    const nextRows = el.querySelectorAll(".hk-prayer-row.next");
    expect(nextRows.length).toBe(1);
    expect(nextRows[0]?.textContent).toContain("Zohor");
    expect(el.querySelectorAll(".hk-prayer-row.voluntary").length).toBe(2);
  });
});
