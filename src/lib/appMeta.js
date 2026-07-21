// Ilova haqida meta — ulashish uchun.
// APP_SHARE_URL — APK yuklab olish havolasi. Har yangi APK'da yangilanadi
// (OTA orqali ham o'zgartirsa bo'ladi). Play Market shart emas.
export const APP_SHARE_URL = 'https://expo.dev/accounts/abuali23s-team/projects/tartib/builds/7573b903-243d-42b0-8345-aeab437054d5';

export const appShareMessage = (url = APP_SHARE_URL) =>
  `TARTIB — namoz vaqtlari, Qibla, zikr va reja ilovasi 🕌\n\nAndroid uchun yuklab oling:\n${url}`;
