// Ilova qulfi — PIN + barmoq izi/yuz (biometrika).
//
// PIN saqlash: yangi APK'da SecureStore (Android Keystore / iOS Keychain) —
// shifrlangan, oddiy o'qib bo'lmaydi. Har qurilmaga xos TASODIFIY tuz bilan
// hashlanadi (umumiy "rainbow table" hujumini yo'q qiladi).
// Eski APK'da (SecureStore yo'q) yoki eski PIN uchun — legacy AsyncStorage hash
// (statik tuz) ishlaydi va birinchi muvaffaqiyatli kirishда SecureStore'ga ko'chadi.

import * as Crypto from 'expo-crypto';

const LEGACY_SALT = 'tartib.v1.lock';
const K_SALT = 'tartib.pin.salt';
const K_HASH = 'tartib.pin.hash';

// SecureStore faqat native moduli bor bo'lsa yuklanadi (throw qilmaydi).
function store() {
  try {
    const { requireOptionalNativeModule } = require('expo-modules-core');
    if (!requireOptionalNativeModule('ExpoSecureStore')) return null;
    return require('expo-secure-store');
  } catch (e) {
    return null;
  }
}

async function sha(s) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s);
}
function randHex(n) {
  try {
    const b = Crypto.getRandomBytes(n);
    return Array.from(b).map((x) => x.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return String(Date.now()) + String(Math.random()).slice(2);
  }
}

export function secureAvailable() { return !!store(); }

// Yangi PIN'ni SecureStore'ga (tasodifiy tuz bilan) yozadi. false = modul yo'q.
export async function setSecurePin(pin) {
  const ss = store();
  if (!ss) return false;
  try {
    const salt = randHex(16);
    const hash = await sha(salt + ':' + pin);
    await ss.setItemAsync(K_SALT, salt);
    await ss.setItemAsync(K_HASH, hash);
    return true;
  } catch (e) {
    return false;
  }
}

export async function hasSecurePin() {
  const ss = store();
  if (!ss) return false;
  try { return !!(await ss.getItemAsync(K_HASH)); } catch (e) { return false; }
}

export async function verifySecurePin(pin) {
  const ss = store();
  if (!ss) return false;
  try {
    const salt = await ss.getItemAsync(K_SALT);
    const hash = await ss.getItemAsync(K_HASH);
    if (!salt || !hash) return false;
    return (await sha(salt + ':' + pin)) === hash;
  } catch (e) { return false; }
}

export async function clearSecurePin() {
  const ss = store();
  if (!ss) return;
  try { await ss.deleteItemAsync(K_SALT); await ss.deleteItemAsync(K_HASH); } catch (e) { /* noop */ }
}

// Legacy (eski statik-tuz) hash — eski APK va migratsiya uchun
export async function hashPin(pin) { return sha(LEGACY_SALT + ':' + pin); }
export async function verifyLegacyPin(pin, legacyHash) {
  if (!legacyHash) return false;
  return (await sha(LEGACY_SALT + ':' + pin)) === legacyHash;
}

// ————— Biometrika (barmoq izi/yuz) — native modul lazy —————
function getLA() {
  try {
    const { requireOptionalNativeModule } = require('expo-modules-core');
    if (!requireOptionalNativeModule('ExpoLocalAuthentication')) return null;
    return require('expo-local-authentication');
  } catch (e) { return null; }
}

export async function biometricAvailable() {
  const LA = getLA();
  if (!LA) return false;
  try {
    const has = await LA.hasHardwareAsync();
    const enrolled = await LA.isEnrolledAsync();
    return !!(has && enrolled);
  } catch (e) { return false; }
}

export async function biometricAuth(prompt = 'Kirish uchun tasdiqlang') {
  const LA = getLA();
  if (!LA) return false;
  try {
    const res = await LA.authenticateAsync({
      promptMessage: prompt,
      cancelLabel: 'Bekor qilish',
      disableDeviceFallback: false,
      fallbackLabel: 'PIN kiritish',
    });
    return !!res.success;
  } catch (e) { return false; }
}
