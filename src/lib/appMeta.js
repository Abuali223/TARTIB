// Ilova haqida meta — ulashish uchun.
// APP_SHARE_URL — APK yuklab olish havolasi. Har yangi APK'da yangilanadi
// (OTA orqali ham o'zgartirsa bo'ladi). Play Market shart emas.
export const APP_SHARE_URL = 'https://expo.dev/accounts/abuali23s-team/projects/tartib/builds/00de213b-a237-4f64-94c7-a606b3f2c98f';

export const appShareMessage = (url = APP_SHARE_URL) =>
  `TARTIB — namoz vaqtlari, Qibla, zikr va reja ilovasi 🕌\n\nAndroid uchun yuklab oling:\n${url}`;
