import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from './firebaseConfig';

// Bitta marta ishga tushirish (Fast Refresh'da qayta chaqirilishi mumkin — himoyalangan)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// React Native'da sessiya AsyncStorage'da saqlanadi — ilova yopilsa ham kirilgan holatda qoladi
let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (e) {
  // allaqachon initializatsiya qilingan (Fast Refresh)
  auth = getAuth(app);
}

// RN tarmoqlarida barqarorlik uchun long-polling avtomatik aniqlanadi
const db = initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

export { app, auth, db };
export default app;
