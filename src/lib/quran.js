// TARTIB — Qur'on: matn (API + kesh), audio (qorilar), oflayn yuklash.
// Matn alquran.cloud API'dan olinadi va AsyncStorage'da keshlanadi (bir marta
// yuklangach oflayn o'qiladi). Audio everyayah.com'dan oqim yoki yuklab olinadi.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

const API = 'https://api.alquran.cloud/v1';

// Qorilar — everyayah.com papka nomlari (oyat-oyat mp3)
export const RECITERS = [
  { id: 'afasy', name: 'Mishary al-Afasy', folder: 'Alafasy_128kbps' },
  { id: 'ajamy', name: 'Ahmad al-Ajmiy', folder: 'Ahmed_ibn_Ali_al-Ajamy_128kbps' },
  { id: 'minshawi', name: 'Al-Minshawiy', folder: 'Minshawy_Murattal_128kbps' },
  { id: 'husary', name: 'Mahmud al-Husariy', folder: 'Husary_128kbps' },
  { id: 'sudais', name: 'Abdurrahmon as-Sudays', folder: 'Abdurrahmaan_As-Sudais_192kbps' },
  // O'zbek qori namunasi — to'liq surani `tools/quran-splitter` bilan oyatlarга bo'lib,
  // hosil bo'lgan SSSAAA.mp3 fayllarni hostingga qo'ying va `folder` ga to'liq URL bering:
  // { id: 'uz_sample', name: "O'zbek qori", folder: 'https://mening-saytim.uz/uzbek_qori' },
];

const pad = (x, w) => String(x).padStart(w, '0');

// O'zbekcha tarjima — Muhammad Sodiq Muhammad Yusuf (alquran.cloud edition)
const UZ = 'uz.sodik';

// ————— Matn (kesh bilan) — v2: tarjima bilan —————
async function cachedText(key, fetcher) {
  try { const s = await AsyncStorage.getItem('q2.' + key); if (s) return JSON.parse(s); } catch (e) { /* */ }
  const d = await fetcher();
  try { await AsyncStorage.setItem('q2.' + key, JSON.stringify(d)); } catch (e) { /* */ }
  return d;
}

export async function getSurahList() {
  return cachedText('list', async () => {
    const r = await fetch(`${API}/surah`);
    const j = await r.json();
    return (j.data || []).map(s => ({
      n: s.number, name: s.name, en: s.englishName, ayahs: s.numberOfAyahs, type: s.revelationType,
    }));
  });
}

export async function getSurah(n) {
  return cachedText('s' + n, async () => {
    const r = await fetch(`${API}/surah/${n}/editions/quran-uthmani,${UZ}`);
    const j = await r.json();
    const arr = j.data || [];
    const ar = arr.find(e => e.edition && e.edition.identifier === 'quran-uthmani') || arr[0] || {};
    const uz = arr.find(e => e.edition && e.edition.identifier === UZ);
    const uzA = (uz && uz.ayahs) || [];
    return {
      n: ar.number, name: ar.name, en: ar.englishName, type: ar.revelationType,
      ayahs: (ar.ayahs || []).map((a, i) => ({ n: a.numberInSurah, text: a.text, tr: (uzA[i] && uzA[i].text) || '', surah: ar.number })),
    };
  });
}

export async function getJuz(n) {
  return cachedText('j' + n, async () => {
    const r = await fetch(`${API}/juz/${n}/editions/quran-uthmani,${UZ}`);
    const j = await r.json();
    const arr = j.data || [];
    const ar = arr.find(e => e.edition && e.edition.identifier === 'quran-uthmani') || arr[0] || {};
    const uz = arr.find(e => e.edition && e.edition.identifier === UZ);
    const uzA = (uz && uz.ayahs) || [];
    return {
      ayahs: (ar.ayahs || []).map((a, i) => ({
        n: a.numberInSurah, text: a.text, tr: (uzA[i] && uzA[i].text) || '',
        surah: a.surah.number, surahName: a.surah.name,
      })),
    };
  });
}

// ————— Audio —————
// `folder` — everyayah.com papka nomi (masalan 'Husary_128kbps') YOKI to'liq URL
// (masalan 'https://mening-saytim.uz/uzbek_qori'). To'liq URL bo'lsa, oyat fayllari
// shu manzildan olinadi — o'zbek qorilarini (tools/quran-splitter bilan tayyorlangan)
// shu tarzda ulash mumkin. Fayl nomlashi bir xil: SSSAAA.mp3 (001001.mp3).
export function verseAudioUrl(folder, surah, ayah) {
  const name = `${pad(surah, 3)}${pad(ayah, 3)}.mp3`;
  if (/^https?:\/\//i.test(folder)) return `${String(folder).replace(/\/$/, '')}/${name}`;
  return `https://everyayah.com/data/${folder}/${name}`;
}

// Lokal (oflayn) papka kaliti — folder to'liq URL bo'lsa ham xavfsiz nomga aylantiramiz
function folderKey(folder) { return String(folder).replace(/[^a-zA-Z0-9_-]/g, '_'); }
function audioDir(folder) { return new Directory(Paths.document, 'quran-audio', folderKey(folder)); }
function verseFile(folder, surah, ayah) { return new File(audioDir(folder), `${pad(surah, 3)}${pad(ayah, 3)}.mp3`); }

// Oyat manbasi — oflayn (yuklangan) bo'lsa local uri, aks holda internet URL
export function verseSource(folder, surah, ayah) {
  try { const f = verseFile(folder, surah, ayah); if (f.exists) return f.uri; } catch (e) { /* */ }
  return verseAudioUrl(folder, surah, ayah);
}

// Butun sura/pora audiosini yuklab olish (oflayn). onProgress(done,total)
export async function downloadAyahs(folder, ayahList, onProgress) {
  const dir = audioDir(folder);
  try { if (!dir.exists) dir.create({ intermediates: true }); } catch (e) { /* */ }
  let done = 0;
  for (const a of ayahList) {
    try {
      const f = verseFile(folder, a.surah, a.n);
      if (!f.exists) await File.downloadFileAsync(verseAudioUrl(folder, a.surah, a.n), dir);
    } catch (e) { /* bitta oyat tushmasa — davom */ }
    done++;
    if (onProgress) onProgress(done, ayahList.length);
  }
}

// Yuklab olinganmi (taxminiy — birinchi va oxirgi oyat bilan)
export function isDownloaded(folder, ayahList) {
  if (!ayahList || !ayahList.length) return false;
  try {
    const probe = [ayahList[0], ayahList[ayahList.length - 1]];
    return probe.every(a => verseFile(folder, a.surah, a.n).exists);
  } catch (e) { return false; }
}
