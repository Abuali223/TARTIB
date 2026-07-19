// Google Sign-In konfiguratsiyasi (expo-auth-session orqali).
//
// QANDAY YOQILADI (bir marta, kompyuterda qulayroq):
//   1. Firebase Console → Authentication → Sign-in method → Google → Enable.
//      (Shu paytda Firebase avtomatik "Web client" OAuth ID yaratadi.)
//   2. Google Cloud Console → APIs & Services → Credentials:
//        • "Web client (auto created by Google Service)" → Client ID ni ko'chiring
//          → pastdagi WEB_CLIENT_ID ga qo'ying.
//        • "Create Credentials → OAuth client ID → Android":
//            - Package name: uz.tartib.app
//            - SHA-1: EAS build kaliti (terminalda: `eas credentials`
//              → Android → Keystore → SHA1 Fingerprint) dan oling.
//          → ANDROID_CLIENT_ID ga qo'ying.
//   3. Client ID'lar MAXFIY EMAS — ularni shu faylga yozib, OTA bilan yuborsa bo'ladi.
//
// Bularsiz "Google bilan kirish" tugmasi ko'rinadi, lekin bosilganda "sozlanmagan"
// deb ogohlantiradi. Email/parol usuli esa hozir to'liq ishlaydi.

export const GOOGLE_WEB_CLIENT_ID = '236709813792-i3kmaei5oevjqhcn62adqkjf30msreff.apps.googleusercontent.com';
export const GOOGLE_ANDROID_CLIENT_ID = '';  // ...apps.googleusercontent.com (ixtiyoriy — standalone APK uchun)
export const GOOGLE_IOS_CLIENT_ID = '';      // ...apps.googleusercontent.com (ixtiyoriy)

// Kamida Web yoki Android client ID bo'lsa — Google yoqilgan hisoblanadi.
export const googleConfigured = !!(GOOGLE_WEB_CLIENT_ID || GOOGLE_ANDROID_CLIENT_ID);

// expo-auth-session Google provideriga beriladigan config
export const googleAuthConfig = {
  webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
  androidClientId: GOOGLE_ANDROID_CLIENT_ID || undefined,
  iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
};
