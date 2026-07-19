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

// expo-local-authentication faqat native moduli MAVJUD bo'lsa yuklanadi.
// requireOptionalNativeModule null qaytaradi (throw QILMAYDI) — shu bois eski
// APK'da (modul yo'q) require umuman chaqirilmaydi va ilova yiqilmaydi.
function getLA() {
  try {
    const { requireOptionalNativeModule } = require('expo-modules-core');
    if (!requireOptionalNativeModule('ExpoLocalAuthentication')) return null;
    return require('expo-local-authentication');
  } catch (e) {
    return null;
  }
}

// Qurilmada biometrika bor va sozlanganmi (barmoq izi/yuz)
export async function biometricAvailable() {
  const LA = getLA();
  if (!LA) return false;
  try {
    const has = await LA.hasHardwareAsync();
    const enrolled = await LA.isEnrolledAsync();
    return !!(has && enrolled);
  } catch (e) {
    return false;
  }
}

// Biometrika bilan tasdiqlash. success=true bo'lsa ochiladi.
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
  } catch (e) {
    return false;
  }
}
