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

// QR/havoladan taklif kodini ajratadi. FAQAT "…join/OILA-XXXX" ko'rinishini
// qabul qiladi — begona QR (Wi-Fi, veb-havola) rad etiladi (bo'sh qaytadi),
// shunda foydalanuvchi chalg'ituvchi xato o'rniga "QR o'qilmadi" oladi.
export function parseJoinCode(raw) {
  const m = String(raw || '').match(/join\/([A-Za-z0-9-]+)/i);
  if (!m) return '';
  return m[1].replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
}
