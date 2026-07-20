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

// QR/matn'dan taklif kodini ajratib oladi: "tartib://join/OILA-XXXX" yoki xom kod.
export function parseJoinCode(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/join\/([A-Za-z0-9-]+)/i);
  const code = (m ? m[1] : s).replace(/\s+/g, '').toUpperCase();
  return code;
}
