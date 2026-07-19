import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

const AVATAR_COLORS = ['#D9B36A', '#E0916F', '#6FB3E0', '#A98FE0', '#43C08D'];

// Auth holatini kuzatish (kirdi / chiqdi). Root.js shunga obuna bo'ladi.
export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

// users/{uid} hujjatini yaratadi (bo'lmasa) va qaytaradi
export async function ensureUserDoc(user, { name, birthYear } = {}) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      name: (name || user.displayName || '').trim(),
      email: user.email || '',
      birthYear: birthYear || null,
      photoColor: AVATAR_COLORS[Math.abs(hashCode(user.uid)) % AVATAR_COLORS.length],
      createdAt: serverTimestamp(),
    });
  }
  const fresh = await getDoc(ref);
  return { id: user.uid, ...fresh.data() };
}

export async function signUpEmail({ name, email, password, birthYear }) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name) {
    try { await updateProfile(cred.user, { displayName: name.trim() }); } catch (e) { /* muhim emas */ }
  }
  await ensureUserDoc(cred.user, { name, birthYear });
  return cred.user;
}

export async function signInEmail({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await ensureUserDoc(cred.user, {});
  return cred.user;
}

// Google id_token (expo-auth-session'dan kelgan) bilan Firebase'ga kirish
export async function signInWithGoogleIdToken(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);
  await ensureUserDoc(cred.user, {});
  return cred.user;
}

export async function signOutUser() {
  await signOut(auth);
}

// Firebase xato kodlarini o'zbekcha xabarga aylantiradi
export function mapAuthError(err) {
  const code = err && err.code ? err.code : '';
  switch (code) {
    case 'auth/invalid-email': return "Email manzili noto'g'ri";
    case 'auth/email-already-in-use': return 'Bu email allaqachon ro’yxatdan o’tgan';
    case 'auth/weak-password': return 'Parol juda oddiy (kamida 6 belgi)';
    case 'auth/missing-password': return 'Parolni kiriting';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'Email yoki parol noto’g’ri';
    case 'auth/too-many-requests': return 'Juda ko’p urinish. Birozdan keyin qayta urinib ko’ring';
    case 'auth/network-request-failed': return 'Internet aloqasi yo’q';
    case 'auth/operation-not-allowed': return 'Email/parol usuli Firebase’da yoqilmagan';
    default: return code ? ('Xatolik: ' + code) : 'Noma’lum xatolik';
  }
}

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}
