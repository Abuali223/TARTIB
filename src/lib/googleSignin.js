// Google bilan kirish — RASMIY native kutubxona (@react-native-google-signin).
// expo-auth-session'ning browser-redirect oqimi SDK 54 standalone'da
// "invalid_request" berardi; native SDK bu muammoni yo'q qiladi.
//
// idToken'ni Web client ID audience bilan oladi (Firebase shuni kutadi),
// Android OAuth client (SHA-1) esa loyihada mavjudligi bilan avtomatik mos keladi.

import { GOOGLE_WEB_CLIENT_ID } from './googleAuth';

let mod = null;      // kutubxona (yoki false — native modul yo'q eski APK)
let configured = false;

function lib() {
  if (mod !== null) return mod;
  try { mod = require('@react-native-google-signin/google-signin'); }
  catch (e) { mod = false; }
  return mod;
}

// Native modul bormi (yangi APK)? Eski APK'da tugma bosilsa xatosiz xabar beramiz.
export function googleNativeAvailable() {
  const m = lib();
  return !!(m && m.GoogleSignin);
}

// Google oynasini ochib, Firebase uchun idToken qaytaradi.
// null = foydalanuvchi bekor qildi. Xato bo'lsa throw qiladi.
export async function googleSignInIdToken() {
  const m = lib();
  if (!m || !m.GoogleSignin) throw new Error('google-native-missing');
  const { GoogleSignin } = m;

  if (!configured) {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
    configured = true;
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();

  // v13+ shakli: { type: 'success'|'cancelled', data: { idToken, ... } }
  // eski shakl: { idToken, ... }
  if (res && res.type === 'cancelled') return null;
  const idToken = (res && res.data && res.data.idToken) || (res && res.idToken) || null;
  if (!idToken) throw new Error('no-idtoken');
  return idToken;
}
