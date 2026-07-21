// Native modul mavjudligini xavfsiz tekshirish — eski APK'ga OTA kelганда
// kamera bo'lmasa ilova qulamasin (tugma ko'rsatilmaydi, skaner ochilmaydi).

export function cameraAvailable() {
  try {
    const { requireOptionalNativeModule } = require('expo-modules-core');
    return !!requireOptionalNativeModule('ExpoCamera');
  } catch (e) {
    return false;
  }
}

// Qur'on (audio) — expo-av native moduli bor bo'lsagina (yangi APK). Eski APK'da
// tugma ko'rsatilmaydi, overlay ochilmaydi (import qulashiga yo'l qo'ymaymiz).
export function quranAvailable() {
  try {
    const { requireOptionalNativeModule } = require('expo-modules-core');
    return !!requireOptionalNativeModule('ExponentAV');
  } catch (e) {
    return false;
  }
}

// Ilova versiyasi + build raqami (masalan "v1.0 (7)"). Eski APK'da (native
// modul yo'q) faqat "v1.0" qaytadi — OTA'da qulamaydi.
export function appVersionLabel() {
  try {
    const A = require('expo-application');
    const v = A.nativeApplicationVersion || '1.0';
    const b = A.nativeBuildVersion;
    return b ? `v${v} (${b})` : `v${v}`;
  } catch (e) {
    return 'v1.0';
  }
}

// QR/havoladan taklif kodini ajratadi. FAQAT "…join/OILA-XXXX" ko'rinishini
// qabul qiladi — begona QR (Wi-Fi, veb-havola) rad etiladi (bo'sh qaytadi),
// shunda foydalanuvchi chalg'ituvchi xato o'rniga "QR o'qilmadi" oladi.
export function parseJoinCode(raw) {
  const m = String(raw || '').match(/join\/([A-Za-z0-9-]+)/i);
  if (!m) return '';
  return m[1].replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
}
