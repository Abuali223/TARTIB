// TARTIB — Firestore ma'lumot xizmati (jamoa: makon, a'zolik, vazifa).
// Shaxsiy ma'lumot (amal/odat/tasbeh) lokal qoladi; bu modul faqat jamoa qismini sinxronlaydi.

import {
  collection, query, where, limit, onSnapshot,
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { CAP, defaultOwnerRole, makeJoinCode, permissionsFor, roleOptionsFor } from './roles';

const membershipId = (wid, uid) => `${wid}_${uid}`;

// Har makon turi uchun standart (oddiy a'zo) rol — qo'shilganda beriladi
export function defaultMemberRole(type) {
  return type === 'talim' ? 'Talaba' : type === 'ishxona' ? 'Xodim' : 'Farzand';
}

// ————— Yozish —————

// Yangi makon + egaga a'zolik (bitta batch'da)
export async function createWorkspace(uid, { type, name }) {
  const wid = 'w' + Date.now();
  const code = makeJoinCode(type, Date.now());
  const role = defaultOwnerRole(type);
  const batch = writeBatch(db);
  batch.set(doc(db, 'workspaces', wid), {
    type, name: name.trim(), ownerUserId: uid, code, createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'memberships', membershipId(wid, uid)), {
    workspaceId: wid, userId: uid, role,
    permissions: permissionsFor(type, role, { isOwner: true }),
    status: 'active', group: null, restricted: false, createdAt: serverTimestamp(),
  });
  await batch.commit();
  return { wid, code };
}

// Kod bilan qo'shilish
export async function joinByCode(uid, code, { restricted = false } = {}) {
  const clean = (code || '').trim().toUpperCase();
  if (!clean) throw new Error('empty-code');
  const snap = await getDocs(query(collection(db, 'workspaces'), where('code', '==', clean), limit(1)));
  if (snap.empty) { const e = new Error('not-found'); e.code = 'ws/not-found'; throw e; }
  const ws = { id: snap.docs[0].id, ...snap.docs[0].data() };
  const mid = membershipId(ws.id, uid);
  const existing = await getDoc(doc(db, 'memberships', mid));
  if (existing.exists()) { const e = new Error('already'); e.code = 'ws/already-member'; throw e; }
  const role = defaultMemberRole(ws.type);
  await setDoc(doc(db, 'memberships', mid), {
    workspaceId: ws.id, userId: uid, role,
    permissions: permissionsFor(ws.type, role, { restricted }),
    status: 'active', group: null, restricted, createdAt: serverTimestamp(),
  });
  return ws;
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

export async function addTask(uid, { workspaceId, assigneeUserId, title, desc, cat, due, type }) {
  const tid = 'k' + Date.now();
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
