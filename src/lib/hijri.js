// Offline hijri date via the tabular (civil/Kuwaiti) algorithm.
// Accurate to ±1 day, which is fine for display; no network needed.

const MONTHS_UZ = [
  'Muharram', 'Safar', "Rabi'ul-avval", "Rabi'ul-oxir", 'Jumadul-avval', 'Jumadul-oxir',
  'Rajab', "Sha'bon", 'Ramazon', 'Shavvol', "Zulqa'da", 'Zulhijja',
];

function div(a, b) { return Math.floor(a / b); }

export function toHijri(date = new Date()) {
  const day = date.getDate(), month = date.getMonth() + 1, year = date.getFullYear();
  let jd = div(1461 * (year + 4800 + div(month - 14, 12)), 4)
    + div(367 * (month - 2 - 12 * div(month - 14, 12)), 12)
    - div(3 * div(year + 4900 + div(month - 14, 12), 100), 4)
    + day - 32075;
  const l0 = jd - 1948440 + 10632;
  const n = div(l0 - 1, 10631);
  let l = l0 - 10631 * n + 354;
  const j = div(10985 - l, 5316) * div(50 * l, 17719) + div(l, 5670) * div(43 * l, 15238);
  l = l - div(30 - j, 15) * div(17719 * j, 50) - div(j, 16) * div(15238 * j, 43) + 29;
  const hm = div(24 * l, 709);
  const hd = l - div(709 * hm, 24);
  const hy = 30 * n + j - 30;
  return { day: hd, month: hm, year: hy, monthName: MONTHS_UZ[hm - 1] };
}

export function hijriLabel(date = new Date()) {
  const h = toHijri(date);
  return `${h.day} ${h.monthName} ${h.year}`;
}

export function hijriMonthLabel(date = new Date()) {
  const h = toHijri(date);
  return `${h.monthName} ${h.year}`;
}
