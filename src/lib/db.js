// TARTIB — Firestore ma'lumot xizmati (jamoa: makon, a'zolik, vazifa).
// Shaxsiy ma'lumot (amal/odat/tasbeh) lokal qoladi; bu modul faqat jamoa qismini sinxronlaydi.

import {
  collection, query, where, limit, onSnapshot,
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { db } from './firebase';
import { CAP, defaultOwnerRole, makeJoinCode, permissionsFor, roleOptionsFor } from './roles';

const membershipId = (wid, uid) => `${wid}_${uid}`;

// Kriptografik tasodifiy 32-bit son (ID/kod urug'i uchun — bashorat qilib bo'lmaydi)
function randSeed() {
  try {
    const b = Crypto.getRandomBytes(4);
    return ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
  } catch (e) {
    return Math.floor(Math.random() * 0xffffffff);
  }
}

// Har makon turi uchun standart (oddiy a'zo) rol — qo'shilganda beriladi
export function defaultMemberRole(type) {
  return type === 'talim' ? 'Talaba' : type === 'ishxona' ? 'Xodim' : 'Farzand';
}

// ————— Yozish —————

// Yangi makon + egaga a'zolik.
// Ketma-ket yoziladi (batch emas): avval makon, keyin joinCodes, keyin egа a'zoligi —
// shunda a'zolik qoidasi isOwner() ni tekshira oladi (makon allaqachon mavjud).
// ID'lar Firestore avto-ID (to'qnashuv yo'q); kod kriptografik tasodifiy.
export async function createWorkspace(uid, { type, name }) {
  const wid = doc(collection(db, 'workspaces')).id;   // avto-ID, to'qnashmaydi
  const code = makeJoinCode(type, randSeed());        // bashoratsiz kod
  const role = defaultOwnerRole(type);
  await setDoc(doc(db, 'workspaces', wid), {
    type, name: name.trim(), ownerUserId: uid, code, createdAt: serverTimestamp(),
  });
  // Kod → makon xaritasi (faqat aniq kodni bilgan get() qiladi; ro'yxatlab bo'lmaydi)
  await setDoc(doc(db, 'joinCodes', code), { workspaceId: wid, type });
  await setDoc(doc(db, 'memberships', membershipId(wid, uid)), {
    workspaceId: wid, userId: uid, role,
    permissions: permissionsFor(type, role, { isOwner: true }),
    status: 'active', group: null, restricted: false, joinCode: code, createdAt: serverTimestamp(),
  });
  return { wid, code };
}

// Self-heal: eski makonlarda (joinCodes xaritasi yozila boshlashidan oldin
// yaratilgan) kod→makon hujjati bo'lmasligi mumkin — shunda "Bunday kod topilmadi"
// chiqadi. Ega makonini ochganda yetishmayotgan xaritani yozib qo'yadi.
// FAQAT ega chaqirishi kerak (qoida: create if isOwner). Xato bo'lsa jim o'tadi.
export async function ensureJoinCode(ws) {
  if (!ws || !ws.code || !ws.id) return;
  try {
    const ref = doc(db, 'joinCodes', ws.code);
    const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, { workspaceId: ws.id, type: ws.type });
  } catch (e) { /* ega emas yoki tarmoq — jimgina */ }
}

// Kod bilan qo'shilish — joinCodes orqali (makonni to'g'ridan-to'g'ri o'qimaydi).
export async function joinByCode(uid, code, { restricted = false } = {}) {
  const clean = (code || '').replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  if (!clean) throw new Error('empty-code');
  const jc = await getDoc(doc(db, 'joinCodes', clean));
  if (!jc.exists()) { const e = new Error('not-found'); e.code = 'ws/not-found'; throw e; }
  const { workspaceId: wid, type } = jc.data();
  const mid = membershipId(wid, uid);
  // A'zolikni tekshirish. Hujjat MAVJUD bo'lmasa, qoida uni o'qishga ruxsat
  // bermasligi mumkin (permission-denied) — bu holatda "a'zo emas" deb qabul
  // qilamiz va davom etamiz. Faqat o'qib bo'lgan va MAVJUD bo'lsa — allaqachon a'zo.
  try {
    const existing = await getDoc(doc(db, 'memberships', mid));
    if (existing.exists()) { const e = new Error('already'); e.code = 'ws/already-member'; throw e; }
  } catch (e) {
    if (e && e.code === 'ws/already-member') throw e;   // haqiqiy "allaqachon a'zo"
    // aks holda (permission-denied va h.k.) — a'zo emas, davom etamiz
  }
  const role = defaultMemberRole(type);
  await setDoc(doc(db, 'memberships', mid), {
    workspaceId: wid, userId: uid, role,
    permissions: permissionsFor(type, role, { restricted }),  // qo'shiluvchi = faqat RECEIVE_TASKS
    status: 'active', group: null, restricted, joinCode: clean, createdAt: serverTimestamp(),
  });
  return { id: wid, type };
}

export async function updateMemberRole(ws, userId, role) {
  await updateDoc(doc(db, 'memberships', membershipId(ws.id, userId)), {
    role,
    permissions: permissionsFor(ws.type, role, { isOwner: ws.ownerUserId === userId }),
  });
}

export async function removeMember(wid, userId) {
  await updateDoc(doc(db, 'memberships', membershipId(wid, userId)), { status: 'removed' });
}

export async function leaveWorkspace(wid, uid) {
  await deleteDoc(doc(db, 'memberships', membershipId(wid, uid)));
}

// Makonni butunlay o'chirish (FAQAT ega). Avval vazifa va a'zoliklar, keyin
// makon hujjati (qoidalar isOwner() ni tekshira olishi uchun makon oxirida).
export async function deleteWorkspace(wid) {
  try {
    const ts = await getDocs(query(collection(db, 'tasks'), where('workspaceId', '==', wid)));
    for (const d of ts.docs) { try { await deleteDoc(d.ref); } catch (e) { /* davom */ } }
  } catch (e) { /* ruxsat/tarmoq */ }
  try {
    const ms = await getDocs(query(collection(db, 'memberships'), where('workspaceId', '==', wid)));
    for (const d of ms.docs) { try { await deleteDoc(d.ref); } catch (e) { /* davom */ } }
  } catch (e) { /* ruxsat/tarmoq */ }
  await deleteDoc(doc(db, 'workspaces', wid));
}

export async function addTask(uid, { workspaceId, assigneeUserId, title, desc, cat, due, type }) {
  const tid = doc(collection(db, 'tasks')).id;   // avto-ID, to'qnashmaydi
  await setDoc(doc(db, 'tasks', tid), {
    workspaceId, assignerUserId: uid, assigneeUserId,
    title, desc, cat, due, type, status: 'yuborildi', createdAt: serverTimestamp(),
  });
  return tid;
}

export async function setTaskStatus(tid, status) {
  await updateDoc(doc(db, 'tasks', tid), { status });
}

// ————— O'qish (realtime) —————
// Har bir subscribe funksiya unsubscribe qaytaradi.

export function subscribeMyMemberships(uid, cb) {
  return onSnapshot(
    query(collection(db, 'memberships'), where('userId', '==', uid), where('status', '==', 'active')),
    (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => cb(null, err),
  );
}

export function subscribeWorkspace(wid, cb) {
  return onSnapshot(doc(db, 'workspaces', wid),
    (d) => cb(d.exists() ? { id: d.id, ...d.data() } : null),
    (err) => cb(null, err),
  );
}

export function subscribeWorkspaceMembers(wid, cb) {
  return onSnapshot(
    query(collection(db, 'memberships'), where('workspaceId', '==', wid), where('status', '==', 'active')),
    (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => cb(null, err),
  );
}

export function subscribeWorkspaceTasks(wid, cb) {
  return onSnapshot(
    query(collection(db, 'tasks'), where('workspaceId', '==', wid)),
    (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => cb(null, err),
  );
}

export function subscribeInbox(uid, cb) {
  return onSnapshot(
    query(collection(db, 'tasks'), where('assigneeUserId', '==', uid)),
    (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => cb(null, err),
  );
}

const userCache = new Map();
export async function fetchUser(uid) {
  if (userCache.has(uid)) return userCache.get(uid);
  try {
    const d = await getDoc(doc(db, 'users', uid));
    const u = d.exists() ? { id: uid, ...d.data() } : { id: uid, name: 'Foydalanuvchi' };
    userCache.set(uid, u);
    return u;
  } catch (e) {
    return { id: uid, name: 'Foydalanuvchi' };
  }
}

export { roleOptionsFor };
