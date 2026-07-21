// TARTIB — Qur'on: matn (API + kesh), audio (qorilar), oflayn yuklash.
// Matn alquran.cloud API'dan olinadi va AsyncStorage'da keshlanadi (bir marta
// yuklangach oflayn o'qiladi). Audio islamic.network CDN'dan oqim yoki yuklab olinadi
// (oyat-oyat, global oyat raqami bilan).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';

const API = 'https://api.alquran.cloud/v1';

// Qorilar — alquran.cloud audio edition ID'lari (islamic.network CDN, oyat-oyat)
export const RECITERS = [
  { id: 'afasy', name: 'Mishary al-Afasy', ed: 'ar.alafasy' },
  { id: 'ajamy', name: 'Ahmad al-Ajmiy', ed: 'ar.ahmedajamy' },
  { id: 'husary', name: 'Mahmud al-Husariy', ed: 'ar.husary' },
  { id: 'minshawi', name: 'Al-Minshawiy', ed: 'ar.minshawi' },
  { id: 'sudais', name: 'Abdurrahmon as-Sudays', ed: 'ar.abdurrahmaansudais' },
];

// O'zbekcha tarjima — Muhammad Sodiq Muhammad Yusuf (alquran.cloud edition)
const UZ = 'uz.sodik';

// Basmala matni (quran-uthmani). Suralar boshida 1-oyatga qo'shilib keladi —
// uni ajratib alohida ko'rsatamiz. Basmala doim 4 so'z: بسم / الله / الرحمن / الرحيم
function stripBasmala(surahNo, ayahs) {
  // Fotiha (1) — basmala aynan 1-oyat; Tavba (9) — basmalasiz. Ularga tegmaymiz.
  if (surahNo === 1 || surahNo === 9) return;
  if (!ayahs || !ayahs.length) return;
  const first = ayahs[0];
  const toks = (first.text || '').split(' ');
  // birinchi so'z "بِسۡمِ / بِسْمِ" bilan boshlansa va so'z soni yetarli bo'lsa —
  // dastlabki 4 so'z (basmala) olib tashlanadi
  if (toks.length > 4 && /^بِ?سۡ?ْ?مِ/.test(toks[0])) {
    first.text = toks.slice(4).join(' ');
  }
}

// ————— Matn (kesh bilan) — v3: tarjima + global oyat raqami (gn) + basmala ajratilgan —————
async function cachedText(key, fetcher) {
  try { const s = await AsyncStorage.getItem('q3.' + key); if (s) return JSON.parse(s); } catch (e) { /* */ }
  const d = await fetcher();
  try { await AsyncStorage.setItem('q3.' + key, JSON.stringify(d)); } catch (e) { /* */ }
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
    const ayahs = (ar.ayahs || []).map((a, i) => ({
      n: a.numberInSurah, gn: a.number, text: a.text,
      tr: (uzA[i] && uzA[i].text) || '', surah: ar.number,
    }));
    stripBasmala(ar.number, ayahs);
    return {
      n: ar.number, name: ar.name, en: ar.englishName, type: ar.revelationType,
      // basmala sarlavhasi: Fotiha (o'zida bor) va Tavba (yo'q)dan tashqari barcha suralarda
      bismillah: ar.number !== 1 && ar.number !== 9,
      ayahs,
    };
  });
}

export async function getJuz(n) {
  return cachedText('j' + n, async () => {
    // Pora uchun alquran.cloud faqat bitta edition endpointini qo'llaydi
    // (ko'p editionli /juz/.../editions/... yo'q). Shu bois ikkitasini alohida olamiz.
    const [rAr, rUz] = await Promise.all([
      fetch(`${API}/juz/${n}/quran-uthmani`).then(r => r.json()).catch(() => null),
      fetch(`${API}/juz/${n}/${UZ}`).then(r => r.json()).catch(() => null),
    ]);
    const ar = (rAr && rAr.data) || {};
    const arAyahs = ar.ayahs || [];
    if (!arAyahs.length) throw new Error('juz empty');
    // Tarjimani global oyat raqami bo'yicha moslashtiramiz (indeks emas — ishonchli)
    const uzMap = {};
    ((rUz && rUz.data && rUz.data.ayahs) || []).forEach(x => { uzMap[x.number] = x.text; });
    const ayahs = arAyahs.map((a) => ({
      n: a.numberInSurah, gn: a.number, text: a.text, tr: uzMap[a.number] || '',
      surah: a.surah.number, surahName: a.surah.name,
    }));
    // Pora ichida yangi sura boshlangan joyda 1-oyatdagi basmalani ajratamiz
    const bySurah = {};
    ayahs.forEach(a => { (bySurah[a.surah] = bySurah[a.surah] || []).push(a); });
    Object.keys(bySurah).forEach(sn => {
      const grp = bySurah[sn];
      if (grp[0] && grp[0].n === 1) stripBasmala(Number(sn), grp);
    });
    return { ayahs };
  });
}

// ————— Audio — islamic.network CDN, global oyat raqami (gn) bilan —————
export function verseAudioUrl(ed, gn) {
  return `https://cdn.islamic.network/quran/audio/128/${ed}/${gn}.mp3`;
}

function audioDir(ed) { return new Directory(Paths.document, 'quran-audio', ed.replace(/\./g, '_')); }
function verseFile(ed, gn) { return new File(audioDir(ed), `${gn}.mp3`); }

// Oyat manbasi — oflayn (yuklangan) bo'lsa local uri, aks holda internet URL
export function verseSource(ed, gn) {
  try { const f = verseFile(ed, gn); if (f.exists) return f.uri; } catch (e) { /* */ }
  return verseAudioUrl(ed, gn);
}

// Butun sura/pora audiosini yuklab olish (oflayn). onProgress(done,total)
export async function downloadAyahs(ed, ayahList, onProgress) {
  const dir = audioDir(ed);
  try { if (!dir.exists) dir.create({ intermediates: true }); } catch (e) { /* */ }
  let done = 0;
  for (const a of ayahList) {
    try {
      const f = verseFile(ed, a.gn);
      if (!f.exists) await File.downloadFileAsync(verseAudioUrl(ed, a.gn), dir);
    } catch (e) { /* bitta oyat tushmasa — davom */ }
    done++;
    if (onProgress) onProgress(done, ayahList.length);
  }
}

// Yuklab olinganmi (taxminiy — birinchi va oxirgi oyat bilan)
export function isDownloaded(ed, ayahList) {
  if (!ayahList || !ayahList.length) return false;
  try {
    const probe = [ayahList[0], ayahList[ayahList.length - 1]];
    return probe.every(a => verseFile(ed, a.gn).exists);
  } catch (e) { return false; }
}
