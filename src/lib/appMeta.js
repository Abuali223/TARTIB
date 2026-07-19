// Ilova haqida meta — ulashish uchun.
// APP_SHARE_URL — APK yuklab olish havolasi. Har yangi APK'da yangilanadi
// (OTA orqali ham o'zgartirsa bo'ladi). Play Market shart emas.
export const APP_SHARE_URL = 'https://expo.dev/accounts/abuali23s-team/projects/tartib/builds/8b38425e-5679-4052-ba92-d2ee183238cd';

export const appShareMessage = (url = APP_SHARE_URL) =>
  `TARTIB — namoz vaqtlari, Qibla, zikr va reja ilovasi 🕌\n\nAndroid uchun yuklab oling:\n${url}`;
