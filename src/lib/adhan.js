// TARTIB — Azon (ichki, ilova ochiqda). Namoz vaqti kirganda to'liq azon
// chalinadi. Asosiy manba — APK ichiga joylangan azon fayli (oflayn, ishonchli).
// Fayl topilmasa (eski OTA) — internetdan oqim zaxira sifatida.

import { Audio } from 'expo-av';

// Bundle qilingan azon (assets/azan.m4a) — oflayn ishlaydi
let AZAN_ASSET = null;
try { AZAN_ASSET = require('../../assets/azan.m4a'); } catch (e) { AZAN_ASSET = null; }

// Zaxira — internetdan oqim (fayl bo'lmasa)
const ADHAN_URLS = [
  'https://www.islamcan.com/audio/adhan/azan2.mp3',
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

// Azonni chalish. onEnd — tugagach chaqiriladi.
export async function playAdhan(prayerKey, onEnd) {
  await stopAdhan();
  try {
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true });
  } catch (e) { /* */ }

  const onStatus = (s) => {
    if (s.didJustFinish) {
      playing = false; const cur = soundRef; soundRef = null;
      if (cur) { try { cur.unloadAsync(); } catch (e) {} }
      if (onEnd) onEnd();
    }
  };

  // 1) Bundle qilingan fayl (oflayn)
  if (AZAN_ASSET) {
    try {
      playing = true;
      const { sound } = await Audio.Sound.createAsync(AZAN_ASSET, { shouldPlay: true }, onStatus);
      soundRef = sound;
      return true;
    } catch (e) { /* zaxiraga o'tamiz */ }
  }

  // 2) Internetdan oqim (zaxira)
  for (const uri of ADHAN_URLS) {
    try {
      playing = true;
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true }, onStatus);
      soundRef = sound;
      return true;
    } catch (e) { /* keyingi manba */ }
  }
  playing = false;
  return false;
}
