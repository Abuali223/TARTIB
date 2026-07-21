// TARTIB — Azon (ichki, ilova ochiqda). Namoz vaqti kirganda to'liq azon
// internetdan oqim orqali chalinadi. Ilova butunlay yopiq bo'lsa — bu ishlamaydi
// (u holda bildirishnoma tovushi / bundle qilingan azon ishlaydi).

import { Audio } from 'expo-av';

// Azon manbalari (birinchisi ishlamasa — keyingisi). Qurilmada oddiy internet
// orqali ochiladi. Fajr (bomdod) uchun alohida azon (as-salotu xayrun...).
const ADHAN_URLS = [
  'https://www.islamcan.com/audio/adhan/azan2.mp3',
  'https://www.islamcan.com/audio/adhan/azan1.mp3',
];
const FAJR_URLS = [
  'https://www.islamcan.com/audio/adhan/azan1.mp3',
];

let soundRef = null;
let playing = false;

export function isAdhanPlaying() { return playing; }

export async function stopAdhan() {
  playing = false;
  const s = soundRef; soundRef = null;
  if (s) { try { await s.stopAsync(); } catch (e) {} try { await s.unloadAsync(); } catch (e) {} }
}

// Azonni chalish. prayerKey — 'fajr' bo'lsa bomdod azoni. onEnd — tugagach.
export async function playAdhan(prayerKey, onEnd) {
  await stopAdhan();
  const urls = prayerKey === 'fajr' ? FAJR_URLS : ADHAN_URLS;
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
  } catch (e) { /* */ }
  for (const uri of urls) {
    try {
      playing = true;
      const { sound } = await Audio.Sound.createAsync(
        { uri }, { shouldPlay: true },
        (s) => {
          if (s.didJustFinish) { playing = false; soundRef = null; try { sound.unloadAsync(); } catch (e) {} if (onEnd) onEnd(); }
        },
      );
      soundRef = sound;
      return true;   // birinchi ishlagan manba bilan to'xtaymiz
    } catch (e) { /* keyingi manba */ }
  }
  playing = false;
  return false;
}
