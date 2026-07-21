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
];

const pad = (x, w) => String(x).padStart(w, '0');

// ————— Matn (kesh bilan) —————
async function cachedText(key, fetcher) {
  try { const s = await AsyncStorage.getItem('q.' + key); if (s) return JSON.parse(s); } catch (e) { /* */ }
  const d = await fetcher();
  try { await AsyncStorage.setItem('q.' + key, JSON.stringify(d)); } catch (e) { /* */ }
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
    const r = await fetch(`${API}/surah/${n}/quran-uthmani`);
    const j = await r.json();
    const d = j.data || {};
    return {
      n: d.number, name: d.name, en: d.englishName, type: d.revelationType,
      ayahs: (d.ayahs || []).map(a => ({ n: a.numberInSurah, text: a.text, surah: d.number })),
    };
  });
}

export async function getJuz(n) {
  return cachedText('j' + n, async () => {
    const r = await fetch(`${API}/juz/${n}/quran-uthmani`);
    const j = await r.json();
    const d = j.data || {};
    return {
      ayahs: (d.ayahs || []).map(a => ({
        n: a.numberInSurah, text: a.text, surah: a.surah.number, surahName: a.surah.name,
      })),
    };
  });
}

// ————— Audio —————
export function verseAudioUrl(folder, surah, ayah) {
  return `https://everyayah.com/data/${folder}/${pad(surah, 3)}${pad(ayah, 3)}.mp3`;
}

function audioDir(folder) { return new Directory(Paths.document, 'quran-audio', folder); }
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
