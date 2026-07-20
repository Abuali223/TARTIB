// Eng yaqin masjidlar — OpenStreetMap (Overpass API) orqali. Bepul, API kalit
// shart emas. amenity=place_of_worship + religion=muslim bo'yicha qidiradi,
// masofani hisoblab (haversine) yaqindan uzoqqa tartiblaydi.

// Bir nechta Overpass zaxira serveri — biri ishlamasa/sekin bo'lsa, keyingisi.
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

// Bitta so'rovni vaqt chegarasi bilan bajaradi (osilib qolmasin)
async function postWithTimeout(url, body, ms = 20000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: ctrl.signal,
    });
  } finally { clearTimeout(timer); }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

// lat/lon atrofidan masjidlarni qaytaradi: [{ id, name, lat, lon, km }]
// radiusM — qidiruv radiusi (metr). Topilmasa chaqiruvchi radiusni oshirishi mumkin.
export async function fetchNearbyMosques(lat, lon, radiusM = 5000, limit = 25) {
  const q = `[out:json][timeout:20];(` +
    `node["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lon});` +
    `way["amenity"="place_of_worship"]["religion"="muslim"](around:${radiusM},${lat},${lon});` +
    `);out center ${limit * 4};`;

  const body = 'data=' + encodeURIComponent(q);
  let json = null, lastErr = null;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await postWithTimeout(url, body);
      if (!res.ok) { lastErr = new Error('overpass-' + res.status); continue; }
      json = await res.json();
      break;
    } catch (e) { lastErr = e; }
  }
  if (!json) throw lastErr || new Error('overpass-unreachable');

  const seen = new Set();
  const items = (json.elements || [])
    .map((e) => {
      const la = e.lat != null ? e.lat : (e.center && e.center.lat);
      const lo = e.lon != null ? e.lon : (e.center && e.center.lon);
      if (la == null || lo == null) return null;
      const tags = e.tags || {};
      const name = tags.name || tags['name:uz'] || tags['name:ru'] || 'Masjid';
      return { id: String(e.id), name, lat: la, lon: lo, km: haversineKm(lat, lon, la, lo) };
    })
    .filter(Boolean)
    .filter((m) => { const k = m.name + m.lat.toFixed(4); if (seen.has(k)) return false; seen.add(k); return true; })
    .sort((a, b) => a.km - b.km)
    .slice(0, limit);

  return items;
}

export function fmtDistance(km) {
  if (km < 1) return Math.round(km * 1000) + ' m';
  return km.toFixed(km < 10 ? 1 : 0) + ' km';
}

// Xaritada ochish uchun havola (Google Maps — barcha qurilmalarda ishlaydi)
export function mapUrl(m) {
  const label = encodeURIComponent(m.name || 'Masjid');
  return `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lon}&query_place_id=${label}`;
}
