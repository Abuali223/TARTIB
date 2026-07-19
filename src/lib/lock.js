// Ilova qulfi — PIN (expo-crypto bilan hashlanadi) + barmoq izi/yuz (biometrika).
// PIN qismi sof JS — OTA'da ham ishlaydi. Biometrika esa native modul
// (expo-local-authentication) talab qiladi — u yangi APK'da faollashadi.
// Shu bois biometrikani "lazy require" bilan chaqiramiz: modul bo'lmasa,
// oddiygina false qaytadi va eski APK'ni buzmaydi.

import * as Crypto from 'expo-crypto';

const SALT = 'tartib.v1.lock';

// PIN'ni SHA-256 bilan hashlaydi (ochiq matn saqlanmaydi)
export async function hashPin(pin) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${SALT}:${pin}`);
}

export async function verifyPin(pin, hash) {
  if (!hash) return false;
  const h = await hashPin(pin);
  return h === hash;
}

// Qurilmada biometrika bor va sozlanganmi (barmoq izi/yuz)
export async function biometricAvailable() {
  try {
    const LA = require('expo-local-authentication');
    const has = await LA.hasHardwareAsync();
    const enrolled = await LA.isEnrolledAsync();
    return !!(has && enrolled);
  } catch (e) {
    return false; // modul yo'q (eski APK) yoki xato
  }
}

// Biometrika bilan tasdiqlash. success=true bo'lsa ochiladi.
export async function biometricAuth(prompt = 'Kirish uchun tasdiqlang') {
  try {
    const LA = require('expo-local-authentication');
    const res = await LA.authenticateAsync({
      promptMessage: prompt,
      cancelLabel: 'Bekor qilish',
      disableDeviceFallback: false,
      fallbackLabel: 'PIN kiritish',
    });
    return !!res.success;
  } catch (e) {
    return false;
  }
}
