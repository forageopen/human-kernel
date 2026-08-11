// Real prayer times for Kuala Lumpur / Putrajaya (JAKIM zone WLY01), fetched
// live from api.waktusolat.app - a free public API serving JAKIM's (Jabatan
// Kemajuan Islam Malaysia) own official e-Solat data (2026-08-02, direct
// request: "Upcoming prayer (tahajud, fajar, subuh, dhuha, zohor, asar,
// maghrib, isyak, witr)"). Verified live before use (see chat) - this is a
// real, working, official-data endpoint, not invented.
//
// The five obligatory prayers plus Imsak/Syuruk/Dhuha are JAKIM-published
// exact instants for the day. Tahajud and Witr are NOT separately published
// fixed times - they are voluntary night prayers tied to a WINDOW, not a
// single moment - so those two are computed here as real, clearly-labeled
// ranges derived from the same real Maghrib/Fajr anchors, never presented as
// if JAKIM published an exact instant for them:
//   - Witr:    tonight's Isha through tomorrow's Fajr (valid any time in
//              that span; most commonly prayed right after Isha or last
//              thing before sleep).
//   - Tahajud: the last third of the night specifically - from
//              (tomorrow's Fajr - (tomorrow's Fajr - tonight's Maghrib) / 3)
//              through tomorrow's Fajr.
//
// The API's own FAQ asks integrators to cache aggressively ("cache
// responses for at least 24 hours... make sure it doesn't call the API on
// every tick") - see startPrayerCard below, which fetches over the network
// at most once per calendar day and just re-renders the already-fetched
// data every tick to update the "next prayer" highlight.

import { KL_TIMEZONE } from "./kl-time.js";

const ZONE = "WLY01"; // Kuala Lumpur / Putrajaya
const API_BASE = "https://api.waktusolat.app/v2/solat";

interface RawDay {
  day: number;
  imsak: number;
  fajr: number;
  syuruk: number;
  dhuha: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

interface RawMonth {
  year: number;
  month_number: number;
  prayers: RawDay[];
}

export interface PrayerAnchor {
  name: string;
  time: Date;
}

export interface PrayerWindow {
  name: string;
  start: Date;
  end: Date;
}

export interface PrayerData {
  anchors: PrayerAnchor[]; // real JAKIM-published instants, chronological
  tahajud: PrayerWindow;
  witr: PrayerWindow;
}

async function fetchMonth(year: number, month: number): Promise<RawMonth> {
  const res = await fetch(`${API_BASE}/${ZONE}?year=${year}&month=${month}`);
  if (!res.ok) throw new Error(`Waktu Solat API responded ${res.status}`);
  return (await res.json()) as RawMonth;
}

function findDay(month: RawMonth, day: number): RawDay | undefined {
  return month.prayers.find((p) => p.day === day);
}

/** Fetches real prayer data for `now`'s calendar date (KL zone WLY01),
 * including tomorrow's Fajr (needed for the Tahajud/Witr window, which runs
 * past midnight) - fetching next month too if tomorrow crosses a month
 * boundary. Throws rather than silently returning fabricated times if the
 * API is unreachable or the expected day rows aren't present. */
export async function loadPrayerData(now: Date = new Date()): Promise<PrayerData> {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const needsNextMonth = tomorrow.getMonth() + 1 !== month || tomorrow.getFullYear() !== year;

  const thisMonth = await fetchMonth(year, month);
  const nextMonthData = needsNextMonth ? await fetchMonth(tomorrow.getFullYear(), tomorrow.getMonth() + 1) : thisMonth;

  const todayRow = findDay(thisMonth, day);
  const tomorrowRow = findDay(nextMonthData, tomorrow.getDate());
  if (!todayRow || !tomorrowRow) {
    throw new Error("Waktu Solat API did not return the expected day rows");
  }

  const toDate = (epochSeconds: number): Date => new Date(epochSeconds * 1000);

  const anchors: PrayerAnchor[] = [
    { name: "Imsak", time: toDate(todayRow.imsak) },
    { name: "Subuh (Fajr)", time: toDate(todayRow.fajr) },
    { name: "Syuruk (Sunrise)", time: toDate(todayRow.syuruk) },
    { name: "Dhuha", time: toDate(todayRow.dhuha) },
    { name: "Zohor", time: toDate(todayRow.dhuhr) },
    { name: "Asar", time: toDate(todayRow.asr) },
    { name: "Maghrib", time: toDate(todayRow.maghrib) },
    { name: "Isyak", time: toDate(todayRow.isha) },
  ];

  const maghribTonight = toDate(todayRow.maghrib);
  const fajrTomorrow = toDate(tomorrowRow.fajr);
  const ishaTonight = toDate(todayRow.isha);

  const nightMs = fajrTomorrow.getTime() - maghribTonight.getTime();
  const lastThirdStart = new Date(fajrTomorrow.getTime() - nightMs / 3);

  return {
    anchors,
    tahajud: { name: "Tahajud", start: lastThirdStart, end: fajrTomorrow },
    witr: { name: "Witr", start: ishaTonight, end: fajrTomorrow },
  };
}

/** The first anchor strictly after `now` - null once everything today has
 * passed (caller decides how to present that; this stays pure/simple). */
export function nextAnchor(anchors: PrayerAnchor[], now: Date): PrayerAnchor | null {
  return anchors.find((a) => a.time.getTime() > now.getTime()) ?? null;
}

export function formatKlTime(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: KL_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
  }).format(d);
}

export function renderPrayerCard(data: PrayerData, now: Date): HTMLElement {
  const wrap = document.createElement("div");

  const list = document.createElement("div");
  list.className = "hk-prayer-list";

  const next = nextAnchor(data.anchors, now);
  for (const a of data.anchors) {
    const row = document.createElement("div");
    row.className = "hk-prayer-row" + (next && a.name === next.name ? " next" : "");
    row.innerHTML = `<span class="hk-prayer-name">${a.name}</span><span class="hk-prayer-time">${formatKlTime(a.time)}</span>`;
    list.appendChild(row);
  }

  const witrRow = document.createElement("div");
  witrRow.className = "hk-prayer-row voluntary";
  witrRow.innerHTML = `<span class="hk-prayer-name">Witr</span><span class="hk-prayer-time">${formatKlTime(data.witr.start)}–${formatKlTime(data.witr.end)}</span>`;
  list.appendChild(witrRow);

  const tahajudRow = document.createElement("div");
  tahajudRow.className = "hk-prayer-row voluntary";
  tahajudRow.innerHTML = `<span class="hk-prayer-name">Tahajud</span><span class="hk-prayer-time">${formatKlTime(data.tahajud.start)}–${formatKlTime(data.tahajud.end)}</span>`;
  list.appendChild(tahajudRow);

  wrap.appendChild(list);

  const note = document.createElement("div");
  note.className = "hk-prayer-note";
  note.textContent = "Kuala Lumpur / Putrajaya, from JAKIM's official prayer time data. Witr and Tahajud are shown as recommended windows, not fixed times.";
  wrap.appendChild(note);

  return wrap;
}

export function renderPrayerError(message: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "hk-muted";
  wrap.textContent = message;
  return wrap;
}

/** Thin, timer-owning wrapper (same split pattern as clock.ts/charts.ts):
 * fetches once per calendar day (respecting the API's own caching
 * guidance), then just re-renders on each tick using the already-fetched
 * data to keep the "next prayer" highlight current. Returns a stop
 * function. */
export function startPrayerCard(container: HTMLElement, tickMs = 30000): () => void {
  let data: PrayerData | null = null;
  let loadedForDate = "";
  let stopped = false;

  const todayKey = (d: Date): string => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

  async function ensureLoaded(): Promise<void> {
    const now = new Date();
    const key = todayKey(now);
    if (data && loadedForDate === key) return;
    try {
      data = await loadPrayerData(now);
      loadedForDate = key;
    } catch {
      data = null;
    }
  }

  async function tick(): Promise<void> {
    await ensureLoaded();
    if (stopped) return;
    container.innerHTML = "";
    if (data) {
      container.appendChild(renderPrayerCard(data, new Date()));
    } else {
      container.appendChild(renderPrayerError("Prayer times aren't available right now - check your connection and reopen this card."));
    }
  }

  void tick();
  const id = setInterval(() => {
    void tick();
  }, tickMs);

  return () => {
    stopped = true;
    clearInterval(id);
  };
}
