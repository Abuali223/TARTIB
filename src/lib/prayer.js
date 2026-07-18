import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla } from 'adhan';

// Andijon — default until GPS gives a real fix
export const DEFAULT_COORDS = { latitude: 40.7821, longitude: 72.3442 };
export const DEFAULT_CITY = 'Andijon';

const PRAYER_META = [
  { k: 'fajr', name: 'Bomdod', ar: 'الفجر' },
  { k: 'sunrise', name: 'Quyosh', ar: 'الشروق', info: true },
  { k: 'dhuhr', name: 'Peshin', ar: 'الظهر' },
  { k: 'asr', name: 'Asr', ar: 'العصر' },
  { k: 'maghrib', name: 'Shom', ar: 'المغرب' },
  { k: 'isha', name: 'Xufton', ar: 'العشاء' },
];

function params() {
  // Hanafi asr, Muslim World League angles — common for Uzbekistan
  const p = CalculationMethod.MuslimWorldLeague();
  p.madhab = Madhab.Hanafi;
  return p;
}

function timesFor(coords, date) {
  return new PrayerTimes(new Coordinates(coords.latitude, coords.longitude), date, params());
}

export function pad2(n) { return String(n).padStart(2, '0'); }

export function fmtClock(date, use24h = true) {
  let h = date.getHours();
  const m = pad2(date.getMinutes());
  if (!use24h) { const ap = h < 12 ? 'AM' : 'PM'; h = h % 12 || 12; return `${h}:${m} ${ap}`; }
  return `${pad2(h)}:${m}`;
}

// Today's prayer list: [{k, name, ar, info, date}]
export function prayerList(coords, date = new Date()) {
  const pt = timesFor(coords, date);
  return PRAYER_META.map(meta => ({ ...meta, date: pt[meta.k] }));
}

// Next prayer (sunrise excluded). Rolls over to tomorrow's Fajr after Isha.
export function nextPrayer(coords, now = new Date()) {
  const today = prayerList(coords, now).filter(p => !p.info);
  for (const p of today) { if (p.date > now) return p; }
  const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const t = prayerList(coords, tomorrow).filter(p => !p.info);
  return t[0];
}

// Currently active prayer period (sunrise excluded)
export function currentPrayer(coords, now = new Date()) {
  const today = prayerList(coords, now).filter(p => !p.info);
  let cur = null;
  for (const p of today) { if (p.date <= now) cur = p; }
  if (cur) return cur;
  // Before Fajr — still Isha time from yesterday
  return today[today.length - 1];
}

// Great-circle bearing to the Kaaba, degrees from true north
export function qiblaBearing(coords) {
  return Qibla(new Coordinates(coords.latitude, coords.longitude));
}
