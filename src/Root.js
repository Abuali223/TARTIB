import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { C, F } from './theme';
import { DEFAULT_CITY, DEFAULT_COORDS, fmtClock, nextPrayer, currentPrayer, pad2, prayerList, qiblaBearing } from './lib/prayer';
import { hijriLabel, hijriMonthLabel } from './lib/hijri';
import { loadState, saveState, todayKey } from './lib/storage';
import { ensureUserDoc, mapAuthError, signInEmail, signOutUser, signUpEmail, watchAuth } from './lib/auth';
import { CAP, WS_TYPES, defaultOwnerRole, isManagerPerms, isMinorAge, makeJoinCode, permissionsFor, roleOptionsFor } from './lib/roles';
import { buildSeed } from './lib/seed';
import Onboarding from './screens/Onboarding';
import Bugun from './screens/Bugun';
import Namoz from './screens/Namoz';
import Reja from './screens/Reja';
import Jamoa from './screens/Jamoa';
import Profil from './screens/Profil';
import TabBar from './components/TabBar';
import TasbehOverlay from './overlays/Tasbeh';
import QiblaOverlay from './overlays/QiblaOverlay';
import StatsOverlay from './overlays/Stats';
import HabitsOverlay from './overlays/Habits';
import SettingsOverlay from './overlays/Settings';
import MemberOverlay from './overlays/Member';
import TaskOverlay from './overlays/Task';
import AssignOverlay from './overlays/Assign';
import AddMemberOverlay from './overlays/AddMember';
import WorkspaceSheet from './overlays/Workspace';

const USE_24H = true;
const SHOW_SECONDS = true;
const CURRENT = 'me'; // joriy foydalanuvchi id (M4'da fbUser.uid bo'ladi)
const AVATAR_COLORS = ['#E0916F', '#6FB3E0', '#A98FE0', '#43C08D', '#D9B36A'];

// AsyncStorage'ga saqlanadigan qism. Auth/hisob Firebase'da.
const PERSIST_KEYS = [
  'activeWorkspaceId', 'settings', 'amals', 'amalsDate', 'habits',
  'users', 'workspaces', 'memberships', 'tasks', 'seeded',
  'tasbehCount', 'tasbehTarget', 'dhikrIdx',
];

export const STATUS_META = {
  yuborildi: { label: 'Yuborildi', color: C.gold, bg: 'rgba(217,179,106,0.15)' },
  qabul: { label: 'Qabul qilindi', color: C.blue, bg: 'rgba(111,179,224,0.15)' },
  bajarilmoqda: { label: 'Bajarilmoqda', color: C.amber, bg: 'rgba(232,180,95,0.15)' },
  bajarildi: { label: 'Bajarildi', color: C.emerald, bg: 'rgba(67,192,141,0.16)' },
  rad: { label: 'Rad etildi', color: C.red, bg: 'rgba(224,120,95,0.15)' },
};

const DHIKRS = [
  { name: 'SubhanAllah', ar: 'سُبْحَانَ اللّٰه', tr: 'Subhaanalloh' },
  { name: 'Alhamdulillah', ar: 'اَلْحَمْدُ لِلّٰه', tr: 'Alhamdulillah' },
  { name: 'Allohu Akbar', ar: 'اَللّٰهُ أَكْبَر', tr: 'Allohu akbar' },
];

const emptySeed = { users: [], workspaces: [], memberships: [], tasks: [], seeded: false };

export default class Root extends React.Component {
  state = {
    hydrated: false,
    // Firebase auth
    authReady: false, fbUser: null, userDoc: null,
    authMode: 'signup', authForm: { name: '', email: '', password: '', birthYear: '' }, authBusy: false,
    // navigatsiya
    activeWorkspaceId: null, // null => Shaxsiy
    tab: 'bugun', overlay: null,
    now: Date.now(),
    coords: DEFAULT_COORDS, cityName: DEFAULT_CITY, locStatus: 'default',
    selMember: null, selTask: null, selDay: new Date().getDate(),
    tasbehCount: 0, tasbehTarget: 33, dhikrIdx: 0,
    settings: { namoz: true, azon: true, zikr: false, jamoa: true },
    draft: { assigneeId: null, title: '', category: 'Namoz', due: 'Bugun', type: 'vazifa' },
    newM: { name: '', role: '', detail: '' },
    wsDraft: { type: 'oila', name: '' },
    flash: null,
    amalsDate: todayKey(),
    // yangi model (seed'dan yoki bo'sh)
    ...emptySeed,
    amals: [
      { id: 'a1', name: 'Bomdod namozi', sub: 'Jamoat bilan', done: false, ar: 'الفجر' },
      { id: 'a2', name: "Qur'on tilovati", sub: 'Kamida 10 daqiqa', done: false, ar: '' },
      { id: 'a3', name: 'Ertalabki zikr', sub: '33 marta tasbeh', done: false, ar: '' },
      { id: 'a4', name: 'Sadaqa', sub: "Kichik bo'lsa ham", done: false, ar: '' },
      { id: 'a5', name: "Ota-onani yo'qlash", sub: "Qo'ng'iroq yoki tashrif", done: false, ar: '' },
      { id: 'a6', name: 'Kitob mutolaasi', sub: '30 daqiqa', done: false, ar: '' },
    ],
    habits: [
      { id: 'h1', name: "Bomdodni qazosiz o'qish", streak: 12, week: [true, true, true, true, true, true, false] },
      { id: 'h2', name: "Har kuni Qur'on", streak: 7, week: [true, true, true, true, true, true, false] },
      { id: 'h3', name: "Erta uyg'onish", streak: 4, week: [true, false, true, true, true, true, false] },
      { id: 'h4', name: 'Kunlik sadaqa', streak: 21, week: [true, true, true, true, true, true, false] },
      { id: 'h5', name: 'Jismoniy mashq', streak: 2, week: [false, false, true, false, true, true, false] },
    ],
  };

  async componentDidMount() {
    this._t = setInterval(() => this.setState({ now: Date.now() }), 1000);
    const saved = await loadState();
    if (saved) {
      const patch = {};
      for (const k of PERSIST_KEYS) if (saved[k] !== undefined) patch[k] = saved[k];
      if (patch.amals && saved.amalsDate !== todayKey()) {
        patch.amals = patch.amals.map(a => ({ ...a, done: false }));
        patch.amalsDate = todayKey();
      }
      // Birinchi ishga tushirish — namunaviy makonlarni ekish
      if (!patch.seeded) Object.assign(patch, buildSeed());
      this.setState({ ...patch, hydrated: true });
    } else {
      this.setState({ ...buildSeed(), hydrated: true });
    }
    this.locate();
    this._unsubAuth = watchAuth(async (user) => {
      if (user) {
        let userDoc = null;
        try { userDoc = await ensureUserDoc(user, {}); } catch (e) { /* offline */ }
        this.setState({ fbUser: { uid: user.uid, email: user.email, displayName: user.displayName }, userDoc, authReady: true });
      } else {
        this.setState({ fbUser: null, userDoc: null, authReady: true });
      }
    });
  }

  componentWillUnmount() { clearInterval(this._t); clearTimeout(this._ft); clearTimeout(this._st); if (this._unsubAuth) this._unsubAuth(); }

  componentDidUpdate(_, prev) {
    if (!this.state.hydrated) return;
    for (const k of PERSIST_KEYS) {
      if (prev[k] !== this.state[k]) { this.schedulePersist(); break; }
    }
  }

  schedulePersist() {
    clearTimeout(this._st);
    this._st = setTimeout(() => {
      const slice = {};
      for (const k of PERSIST_KEYS) slice[k] = this.state[k];
      saveState(slice);
    }, 400);
  }

  locate = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { this.setState({ locStatus: 'denied' }); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      this.setState({ coords, locStatus: 'granted' });
      try {
        const geos = await Location.reverseGeocodeAsync(coords);
        const g = geos && geos[0];
        const city = g && (g.city || g.subregion || g.region);
        if (city) this.setState({ cityName: city });
      } catch (e) { /* geocoder unavailable */ }
    } catch (e) {
      this.setState({ locStatus: 'denied' });
    }
  };

  // ————— helpers —————
  activeWs() { return this.state.activeWorkspaceId ? this.state.workspaces.find(w => w.id === this.state.activeWorkspaceId) : null; }
  myMembership(wsId) { return this.state.memberships.find(m => m.workspaceId === wsId && m.userId === CURRENT && m.status === 'active'); }
  canIn(ws, cap) {
    if (!ws) return false;
    if (ws.ownerUserId === CURRENT) return true;
    const mem = this.myMembership(ws.id);
    return !!mem && mem.permissions.includes(cap);
  }

  // ————— auth —————
  setAuthMode = (m) => this.setState({ authMode: m });
  onAuthField = (k, v) => this.setState(s => ({ authForm: { ...s.authForm, [k]: k === 'birthYear' ? (v + '').replace(/[^0-9]/g, '').slice(0, 4) : v } }));
  submitAuth = async () => {
    const { authMode, authForm, authBusy } = this.state;
    if (authBusy) return;
    const email = (authForm.email || '').trim();
    const password = authForm.password || '';
    if (!email || !password) { this.flash('Email va parolni kiriting'); return; }
    if (authMode === 'signup' && !(authForm.name || '').trim()) { this.flash('Ismingizni kiriting'); return; }
    this.setState({ authBusy: true });
    try {
      if (authMode === 'signup') {
        const by = parseInt(authForm.birthYear, 10);
        await signUpEmail({ name: authForm.name, email, password, birthYear: Number.isFinite(by) ? by : null });
        this.flash('Xush kelibsiz!');
      } else {
        await signInEmail({ email, password });
      }
      this.setState({ authForm: { name: '', email: '', password: '', birthYear: '' } });
    } catch (e) {
      this.flash(mapAuthError(e));
    } finally {
      this.setState({ authBusy: false });
    }
  };
  logout = async () => {
    this.setState({ overlay: null, tab: 'bugun' });
    try { await signOutUser(); } catch (e) { this.flash(mapAuthError(e)); }
  };

  // ————— navigatsiya —————
  go = (tab) => { this.setState({ tab, overlay: null }); this._scroll?.scrollTo({ y: 0, animated: false }); };
  openOv = (name) => this.setState({ overlay: name });
  closeOv = () => this.setState({ overlay: null, selMember: null, selTask: null });
  setScroll = (el) => { this._scroll = el; };
  setActiveWorkspace = (id) => { this.setState({ activeWorkspaceId: id, overlay: null, tab: id ? 'jamoa' : 'bugun' }); this._scroll?.scrollTo({ y: 0, animated: false }); };

  // ————— makon yaratish —————
  pickWsType = (t) => this.setState(s => ({ wsDraft: { ...s.wsDraft, type: t } }));
  onWsName = (v) => this.setState(s => ({ wsDraft: { ...s.wsDraft, name: v } }));
  createWorkspace = () => {
    const { type, name } = this.state.wsDraft;
    if (!name.trim()) { this.flash('Makon nomini kiriting'); return; }
    const id = 'w' + Date.now();
    const role = defaultOwnerRole(type);
    this.setState(s => ({
      workspaces: [...s.workspaces, { id, type, name: name.trim(), ownerUserId: CURRENT, code: makeJoinCode(type, Date.now()) }],
      memberships: [...s.memberships, { id: 'mem_' + id + '_me', workspaceId: id, userId: CURRENT, role, permissions: permissionsFor(type, role, { isOwner: true }), status: 'active', group: null, restricted: false }],
      activeWorkspaceId: id, wsDraft: { type: 'oila', name: '' }, overlay: null, tab: 'jamoa',
    }));
    this.flash('Makon yaratildi ✓');
  };

  // ————— a'zolar —————
  setMemberRole = (wsId, userId, role) => this.setState(s => {
    const ws = s.workspaces.find(w => w.id === wsId);
    if (!ws) return null;
    return {
      memberships: s.memberships.map(m => (m.workspaceId === wsId && m.userId === userId)
        ? { ...m, role, permissions: permissionsFor(ws.type, role, { isOwner: ws.ownerUserId === userId, restricted: m.restricted }) }
        : m),
    };
  });
  pickNMRole = (r) => this.setState(s => ({ newM: { ...s.newM, role: r } }));
  onNMDetail = (v) => this.setState(s => ({ newM: { ...s.newM, detail: v } }));
  onNMName = (v) => this.setState(s => ({ newM: { ...s.newM, name: v } }));
  addMember = () => {
    const ws = this.activeWs();
    if (!ws) { this.flash('Avval makon tanlang'); return; }
    if (!this.canIn(ws, CAP.MANAGE_MEMBERS)) { this.flash("A'zo qo'shishga ruxsat yo'q"); return; }
    const n = this.state.newM;
    if (!n.name.trim()) { this.flash('Ism kiriting'); return; }
    if (!n.role) { this.flash('Rolni tanlang'); return; }
    const uid = 'u' + Date.now();
    this.setState(s => ({
      users: [...s.users, { id: uid, name: n.name.trim(), color: AVATAR_COLORS[s.users.length % AVATAR_COLORS.length], online: false }],
      memberships: [...s.memberships, { id: 'mem_' + ws.id + '_' + uid, workspaceId: ws.id, userId: uid, role: n.role, permissions: permissionsFor(ws.type, n.role, {}), status: 'active', group: n.detail || null, restricted: false }],
      newM: { name: '', role: '', detail: '' }, overlay: null,
    }));
    this.flash("A'zo qo'shildi ✓");
  };

  // ————— vazifalar —————
  selectMember = (id) => this.setState({ selMember: id, overlay: 'member' });
  selectTask = (id) => this.setState({ selTask: id, overlay: 'task' });
  selectDay = (d) => this.setState({ selDay: d });
  setStatus = (id, status) => this.setState(s => {
    const t = s.tasks.find(x => x.id === id);
    if (!t) return null;
    const isAssignee = t.assigneeUserId === CURRENT;
    const ws = s.workspaces.find(w => w.id === t.workspaceId);
    const canBoard = ws && (ws.ownerUserId === CURRENT || (this.myMembership(ws.id) || {}).permissions?.includes(CAP.VIEW_BOARD));
    // Ruxsat tekshiruvi: mas'ul o'z vazifasini, manager qayta ochadi
    if (['qabul', 'rad', 'bajarilmoqda', 'bajarildi'].includes(status) && !isAssignee) return null;
    if (status === 'yuborildi' && !(t.assignerUserId === CURRENT || canBoard)) return null;
    return { tasks: s.tasks.map(x => x.id === id ? { ...x, status } : x) };
  });
  toggleSetting = (k) => this.setState(s => ({ settings: { ...s.settings, [k]: !s.settings[k] } }));
  onDraftTitle = (v) => this.setState(s => ({ draft: { ...s.draft, title: v } }));
  pickAssignee = (id) => this.setState(s => ({ draft: { ...s.draft, assigneeId: id } }));
  pickCat = (c) => this.setState(s => ({ draft: { ...s.draft, category: c } }));
  pickDue = (d) => this.setState(s => ({ draft: { ...s.draft, due: d } }));
  pickType = (t) => this.setState(s => ({ draft: { ...s.draft, type: t } }));
  submitAssign = () => {
    const ws = this.activeWs();
    if (!ws) { this.flash('Avval makon tanlang'); return; }
    if (!this.canIn(ws, CAP.ASSIGN_TASKS)) { this.flash("Vazifa yuborishga ruxsat yo'q"); return; }
    const d = this.state.draft;
    if (!d.assigneeId || !d.title.trim()) { this.flash("A'zo va nomni kiriting"); return; }
    const id = 'k' + Date.now();
    const isR = d.type === 'eslatma';
    this.setState(s => ({
      tasks: [{ id, workspaceId: ws.id, assignerUserId: CURRENT, assigneeUserId: d.assigneeId, title: d.title.trim(), desc: d.category + (isR ? " bo'yicha eslatma." : " yo'nalishidagi vazifa.") + ' Muddat: ' + d.due + '.', status: 'yuborildi', due: d.due, cat: d.category, type: d.type }, ...s.tasks],
      draft: { assigneeId: null, title: '', category: 'Namoz', due: 'Bugun', type: 'vazifa' },
      overlay: null, tab: 'jamoa',
    }));
    this.flash(isR ? 'Eslatma yuborildi ✓' : 'Vazifa yuborildi ✓');
  };

  // ————— personal —————
  toggleAmal = (id) => this.setState(s => ({ amals: s.amals.map(a => a.id === id ? { ...a, done: !a.done } : a), amalsDate: todayKey() }));
  toggleHabit = (id) => this.setState(s => ({ habits: s.habits.map(h => { if (h.id !== id) return h; const w = h.week.slice(); const nd = !w[6]; w[6] = nd; return { ...h, week: w, streak: nd ? h.streak + 1 : Math.max(0, h.streak - 1) }; }) }));
  tasbehTap = () => this.setState(s => ({ tasbehCount: s.tasbehCount + 1 }));
  tasbehReset = () => this.setState({ tasbehCount: 0 });
  setDhikr = (i) => this.setState({ dhikrIdx: i, tasbehCount: 0 });
  setTarget = (n) => this.setState({ tasbehTarget: n });
  flash = (msg) => { this.setState({ flash: msg }); clearTimeout(this._ft); this._ft = setTimeout(() => this.setState({ flash: null }), 2200); };

  // ————— derived values for screens —————
  vals() {
    const S = this.state;
    const now = new Date(S.now);
    const coords = S.coords;
    const wd = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const mo = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    const gregDate = now.getDate() + ' ' + mo[now.getMonth()] + ' · ' + wd[now.getDay()];
    const h = now.getHours();
    const greet = h >= 5 && h < 11 ? 'Xayrli tong' : h >= 11 && h < 17 ? 'Xayrli kun' : h >= 17 && h < 22 ? 'Xayrli kech' : 'Xayrli tun';

    // Namoz vaqtlari
    const list = prayerList(coords, now);
    const nextP = nextPrayer(coords, now);
    const curP = currentPrayer(coords, now);
    const diff = Math.max(0, nextP.date - now);
    const dh = Math.floor(diff / 3600000), dm = Math.floor(diff % 3600000 / 60000), ds = Math.floor(diff % 60000 / 1000);
    const countdown = SHOW_SECONDS ? `${pad2(dh)}:${pad2(dm)}:${pad2(ds)}` : `${dh} soat ${dm} daq`;
    const prayers = list.map(p => ({
      name: p.name, ar: p.ar, info: !!p.info, time: fmtClock(p.date, USE_24H),
      passed: p.date <= now, isNext: !p.info && p.k === nextP.k && nextP.date.getDate() === now.getDate(),
    }));

    const amals = S.amals.map(a => ({ ...a, onToggle: () => this.toggleAmal(a.id) }));
    if (amals[0]) amals[0] = { ...amals[0], sub: fmtClock(list[0].date, USE_24H) + ' · jamoat bilan' };
    const goalDone = S.amals.filter(a => a.done).length, goalTotal = S.amals.length;
    const goalPct = goalTotal ? Math.round(goalDone / goalTotal * 100) : 0;

    // ——— hisob / foydalanuvchi ———
    const booted = !!S.fbUser;
    const ud = S.userDoc || {};
    const isChild = isMinorAge(ud.birthYear, now);
    const accName = (ud.name || (S.fbUser && S.fbUser.displayName) || 'Foydalanuvchi').trim() || 'Foydalanuvchi';
    const acc = { name: accName, email: ud.email || (S.fbUser && S.fbUser.email) || '', birthYear: ud.birthYear || null, isChild };
    const first = accName.split(' ')[0], last = accName.split(' ').slice(1).join(' ');
    const meUser = { id: CURRENT, name: accName, color: ud.photoColor || C.gold };
    const userById = id => id === CURRENT ? meUser : (S.users.find(u => u.id === id) || { id, name: id, color: C.gold });

    // ——— faol makon ———
    const activeWs = S.activeWorkspaceId ? S.workspaces.find(w => w.id === S.activeWorkspaceId) : null;
    const isShaxsiy = !activeWs;
    const wsType = activeWs ? activeWs.type : 'shaxsiy';
    const myMem = activeWs ? S.memberships.find(m => m.workspaceId === activeWs.id && m.userId === CURRENT && m.status === 'active') : null;
    const isOwner = !!activeWs && activeWs.ownerUserId === CURRENT;
    const can = (cap) => isOwner || (!!myMem && myMem.permissions.includes(cap));
    const canManage = !!activeWs && (isOwner || can(CAP.VIEW_BOARD));
    const isChildTeam = !!activeWs && !isOwner && !can(CAP.VIEW_BOARD); // cheklangan a'zo ko'rinishi

    const modeLabel = activeWs ? activeWs.name : 'Shaxsiy';
    const roleLabel = activeWs ? WS_TYPES[wsType].label : 'Shaxsiy';
    const membersLabel = activeWs ? WS_TYPES[wsType].membersLabel : "A'zolar";
    const jamoaSub = activeWs ? WS_TYPES[wsType].sub : 'Shaxsiy makon';

    const wsTasks = activeWs ? S.tasks.filter(t => t.workspaceId === activeWs.id) : [];
    const memTasksOf = uid => wsTasks.filter(t => t.assigneeUserId === uid);
    const wsMemberships = activeWs ? S.memberships.filter(m => m.workspaceId === activeWs.id && m.userId !== CURRENT && m.status === 'active') : [];

    const members = wsMemberships.map(mem => {
      const u = userById(mem.userId);
      const ts = memTasksOf(mem.userId), done = ts.filter(t => t.status === 'bajarildi').length, pct = ts.length ? Math.round(done / ts.length * 100) : 0;
      return {
        id: u.id, name: u.name, initial: (u.name || '?')[0], color: u.color, online: !!u.online,
        role: mem.role, isMgr: isManagerPerms(mem.permissions),
        label: (wsType === 'talim' && mem.group) ? (mem.role + ' · ' + mem.group) : mem.role,
        doneCount: done, totalCount: ts.length, pct, onOpen: () => this.selectMember(mem.userId),
      };
    });

    // Board — faol makonda men bergan vazifalar
    const managed = activeWs ? wsTasks.filter(t => t.assignerUserId === CURRENT) : [];
    const board = {
      send: managed.filter(t => t.status === 'yuborildi').length,
      prog: managed.filter(t => t.status === 'qabul' || t.status === 'bajarilmoqda').length,
      done: managed.filter(t => t.status === 'bajarildi').length,
    };
    board.total = managed.length;
    board.pct = board.total ? Math.round(board.done / board.total * 100) : 0;

    const wsNameOf = wid => (S.workspaces.find(w => w.id === wid) || {}).name || '';
    const taskCard = t => {
      const assignee = userById(t.assigneeUserId);
      return {
        id: t.id, title: t.title, cat: t.cat, due: t.due,
        statusMeta: STATUS_META[t.status] || STATUS_META.yuborildi,
        type: t.type, isReminder: t.type === 'eslatma',
        assigneeName: assignee.name, assigneeInitial: (assignee.name || '?')[0], assigneeColor: assignee.color,
        wsLabel: wsNameOf(t.workspaceId),
        onOpen: () => this.selectTask(t.id),
      };
    };
    const jamoaTasks = managed.map(taskCard);

    // Global inbox — barcha makonlardan menga berilgan vazifalar
    const myAll = S.tasks.filter(t => t.assigneeUserId === CURRENT);
    const myTotal = myAll.length;
    const myDone = myAll.filter(t => t.status === 'bajarildi').length;
    const myPct = myTotal ? Math.round(myDone / myTotal * 100) : 0;
    const myTasks = myAll.map(t => {
      const isR = t.type === 'eslatma';
      const assigner = userById(t.assignerUserId);
      return {
        id: t.id, title: t.title, desc: t.desc, cat: t.cat, due: t.due, type: t.type,
        statusMeta: STATUS_META[t.status] || STATUS_META.yuborildi,
        assignerName: t.assignerUserId === CURRENT ? 'Men' : assigner.name,
        wsLabel: wsNameOf(t.workspaceId),
        isReminder: isR, notDone: t.status !== 'bajarildi',
        isPending: !isR && t.status === 'yuborildi', canStart: !isR && t.status === 'qabul', canComplete: !isR && t.status === 'bajarilmoqda',
        onOpen: () => this.selectTask(t.id),
        onAccept: () => this.setStatus(t.id, 'qabul'), onReject: () => this.setStatus(t.id, 'rad'),
        onStart: () => this.setStatus(t.id, 'bajarilmoqda'), onComplete: () => this.setStatus(t.id, 'bajarildi'),
      };
    });

    // Tanlangan a'zo
    let selMemberObj = null;
    if (S.selMember && activeWs) {
      const mem = S.memberships.find(m => m.workspaceId === activeWs.id && m.userId === S.selMember && m.status === 'active');
      if (mem) {
        const u = userById(mem.userId);
        const ts = memTasksOf(mem.userId), done = ts.filter(t => t.status === 'bajarildi').length, tot = ts.length;
        selMemberObj = {
          name: u.name, initial: (u.name || '?')[0], color: u.color, role: mem.role,
          label: (wsType === 'talim' && mem.group) ? (mem.role + ' · ' + mem.group) : mem.role,
          doneCount: done, totalCount: tot, pct: tot ? Math.round(done / tot * 100) : 0,
          roleChips: roleOptionsFor(wsType).map(r => ({ name: r, active: r === mem.role, onPick: () => this.setMemberRole(activeWs.id, u.id, r) })),
          tasks: ts.map(taskCard),
          onAssign: () => this.setState(s => ({ draft: { ...s.draft, assigneeId: u.id }, overlay: 'assign' })),
        };
      }
    }

    // Tanlangan vazifa
    let selTaskObj = null;
    if (S.selTask) {
      const t = S.tasks.find(x => x.id === S.selTask);
      if (t) {
        const isR = t.type === 'eslatma';
        const isAssignee = t.assigneeUserId === CURRENT;
        const tws = S.workspaces.find(w => w.id === t.workspaceId);
        const canBoard = !!tws && (tws.ownerUserId === CURRENT || ((this.myMembership(tws.id) || {}).permissions || []).includes(CAP.VIEW_BOARD));
        const isManagerOfTask = t.assignerUserId === CURRENT || canBoard;
        const assignee = userById(t.assigneeUserId), assigner = userById(t.assignerUserId);
        selTaskObj = {
          title: t.title, desc: t.desc, due: t.due, cat: t.cat, type: t.type,
          statusMeta: STATUS_META[t.status] || STATUS_META.yuborildi,
          assigneeName: assignee.name, assigneeInitial: (assignee.name || '?')[0], assigneeColor: assignee.color,
          assignerName: t.assignerUserId === CURRENT ? 'Men (siz)' : assigner.name,
          isReminder: isR, reminderPending: isR && isAssignee && t.status !== 'bajarildi',
          canAccept: !isR && isAssignee && t.status === 'yuborildi',
          canStart: !isR && isAssignee && t.status === 'qabul',
          canComplete: !isR && isAssignee && t.status === 'bajarilmoqda',
          isFinal: (t.status === 'bajarildi' || t.status === 'rad') && isManagerOfTask,
          onAccept: () => this.setStatus(t.id, 'qabul'), onReject: () => this.setStatus(t.id, 'rad'),
          onStart: () => this.setStatus(t.id, 'bajarilmoqda'), onComplete: () => this.setStatus(t.id, 'bajarildi'),
          onReopen: () => this.setStatus(t.id, 'yuborildi'), onAck: () => this.setStatus(t.id, 'bajarildi'),
        };
      }
    }

    // Kalendar
    const daysUz = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    const y = now.getFullYear(), mIdx = now.getMonth();
    const firstDow = (new Date(y, mIdx, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(y, mIdx + 1, 0).getDate();
    const taskDays = [3, 7, 12, 15, 21, 26];
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push({ blank: true, key: 'b' + i });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ blank: false, key: 'd' + d, num: d, selected: d === S.selDay, today: d === now.getDate(), hasTask: taskDays.indexOf(d) >= 0, onSelect: () => this.selectDay(d) });
    }
    const monthLabel = hijriMonthLabel(now) + ' · ' + mo[mIdx];

    const pt = k => fmtClock(list.find(p => p.k === k).date, USE_24H);
    const passedK = k => list.find(p => p.k === k).date <= now;
    const timeline = [
      { time: pt('fajr'), title: 'Bomdod namozi', type: 'Namoz', color: C.emerald, done: passedK('fajr') },
      { time: '07:00', title: "Ertalabki zikr va Qur'on", type: 'Ibodat', color: C.gold, done: h >= 7 },
      { time: '09:30', title: "Ish / o'qish", type: 'Reja', color: C.blue, done: false },
      { time: pt('dhuhr'), title: 'Peshin namozi', type: 'Namoz', color: C.gold, done: passedK('dhuhr') },
      { time: pt('asr'), title: 'Asr namozi', type: 'Namoz', color: C.sageDim, done: passedK('asr') },
      { time: '20:00', title: 'Oila bilan kechki taom', type: 'Oila', color: C.purple, done: false },
      { time: pt('isha'), title: 'Xufton + kunlik hisob', type: 'Namoz', color: C.sageDim, done: passedK('isha') },
    ];

    const habits = S.habits.map(hb => ({ ...hb, today: hb.week[6], onToggleToday: () => this.toggleHabit(hb.id), weekCells: hb.week.map((v, i) => ({ letter: daysUz[i], on: v })) }));

    const pw = [{ d: 'Du', p: 100 }, { d: 'Se', p: 100 }, { d: 'Ch', p: 80 }, { d: 'Pa', p: 100 }, { d: 'Ju', p: 100 }, { d: 'Sh', p: 60 }, { d: 'Ya', p: 40 }];
    const prayerWeek = pw.map(x => ({ ...x, color: x.p >= 100 ? C.emerald : x.p >= 60 ? C.gold : C.red }));
    const overallPct = 83;
    const leaderboard = members.slice().sort((a, b) => b.pct - a.pct).map((m, i) => ({ ...m, rank: i + 1 }));

    const dh0 = DHIKRS[S.dhikrIdx];
    const tasbeh = {
      count: S.tasbehCount, target: S.tasbehTarget,
      rounds: Math.floor(S.tasbehCount / S.tasbehTarget),
      progress: (S.tasbehCount % S.tasbehTarget) / S.tasbehTarget,
      ar: dh0.ar, tr: dh0.tr, onTap: this.tasbehTap, onReset: this.tasbehReset,
      dhikrs: DHIKRS.map((d, i) => ({ name: d.name, active: i === S.dhikrIdx, onPick: () => this.setDhikr(i) })),
      targets: [33, 99, 100].map(n => ({ n, active: n === S.tasbehTarget, onPick: () => this.setTarget(n) })),
    };

    const qibla = { bearing: Math.round(qiblaBearing(coords)), cityName: S.cityName, locStatus: S.locStatus };

    const cats = ['Namoz', "Qur'on", 'Dars', 'Imtihon', 'Ish', 'Sadaqa'];
    const dues = ['Bugun', 'Ertaga', 'Bu hafta', 'Juma'];
    const assignMembers = members.map(m => ({ id: m.id, name: m.name, color: m.color, active: S.draft.assigneeId === m.id, onPick: () => this.pickAssignee(m.id) }));
    const catChips = cats.map(c => ({ name: c, active: S.draft.category === c, onPick: () => this.pickCat(c) }));
    const dueChips = dues.map(d => ({ name: d, active: S.draft.due === d, onPick: () => this.pickDue(d) }));
    const typeChips = [{ k: 'vazifa', name: 'Vazifa' }, { k: 'eslatma', name: 'Eslatma' }].map(x => ({ ...x, active: S.draft.type === x.k, onPick: () => this.pickType(x.k) }));

    // Makon almashtirish varag'i uchun ro'yxat
    const myWorkspaces = S.workspaces
      .filter(w => S.memberships.some(m => m.workspaceId === w.id && m.userId === CURRENT && m.status === 'active'))
      .map(w => {
        const mem = S.memberships.find(m => m.workspaceId === w.id && m.userId === CURRENT);
        return { id: w.id, name: w.name, type: w.type, typeLabel: WS_TYPES[w.type].label, role: mem ? mem.role : '', active: w.id === S.activeWorkspaceId, onSelect: () => this.setActiveWorkspace(w.id) };
      });
    const wsTypeChips = [{ k: 'oila', name: 'Oila' }, { k: 'talim', name: "Ta'lim" }, { k: 'ishxona', name: 'Ishxona' }]
      .map(x => ({ ...x, active: S.wsDraft.type === x.k, onPick: () => this.pickWsType(x.k) }));

    return {
      authReady: S.authReady, booted, showOnboarding: S.authReady && !S.fbUser,
      authMode: S.authMode, authForm: S.authForm, authBusy: S.authBusy,
      setAuthMode: { signin: () => this.setAuthMode('signin'), signup: () => this.setAuthMode('signup') },
      onAuthField: {
        name: (v) => this.onAuthField('name', v), email: (v) => this.onAuthField('email', v),
        password: (v) => this.onAuthField('password', v), birthYear: (v) => this.onAuthField('birthYear', v),
      },
      submitAuth: this.submitAuth,
      greet, meName: first, meLast: last, meInitial: (first[0] || 'F'),
      meRole: isChild ? 'Farzand' : (activeWs ? (myMem ? myMem.role : '—') : 'Shaxsiy'),
      cityName: S.cityName, locStatus: S.locStatus, account: acc, isChild, mode: wsType, modeLabel, canManage,
      isShaxsiy, isChildTeam,
      jamoaSub, membersLabel, roleLabel, myTotal, myDone, myPct,
      hijriDate: hijriLabel(now), gregDate, monthLabel,
      next: { name: nextP.name, ar: nextP.ar, time: fmtClock(nextP.date, USE_24H), countdown },
      curName: curP.name,
      prayers, amals, goalDone, goalTotal, goalPct,
      members, board, jamoaTasks, myTasks, selMemberObj, selTaskObj,
      cells, daysUz, timeline,
      habits, prayerWeek, overallPct, leaderboard,
      tasbeh, qibla,
      assignMembers, catChips, dueChips, typeChips, draftTitle: S.draft.title,
      onDraftTitle: this.onDraftTitle, onSubmitAssign: this.submitAssign,
      newM: S.newM, onNMName: this.onNMName, onNMDetail: this.onNMDetail, addMember: this.addMember,
      roleChipsAdd: roleOptionsFor(wsType === 'shaxsiy' ? 'oila' : wsType).map(r => ({ name: r, active: S.newM.role === r, onPick: () => this.pickNMRole(r) })),
      settings: S.settings,
      toggleSetting: { namoz: () => this.toggleSetting('namoz'), azon: () => this.toggleSetting('azon'), zikr: () => this.toggleSetting('zikr'), jamoa: () => this.toggleSetting('jamoa') },
      tab: S.tab,
      go: { bugun: () => this.go('bugun'), namoz: () => this.go('namoz'), reja: () => this.go('reja'), jamoa: () => this.go('jamoa'), profil: () => this.go('profil') },
      open: { tasbeh: () => this.openOv('tasbeh'), qibla: () => this.openOv('qibla'), stats: () => this.openOv('stats'), habits: () => this.openOv('habits'), settings: () => this.openOv('settings'), assign: () => this.openOv('assign'), addmember: () => this.openOv('addmember'), workspace: () => this.openOv('workspace') },
      ov: { tasbeh: S.overlay === 'tasbeh', qibla: S.overlay === 'qibla', stats: S.overlay === 'stats', habits: S.overlay === 'habits', settings: S.overlay === 'settings', member: S.overlay === 'member', task: S.overlay === 'task', assign: S.overlay === 'assign', addmember: S.overlay === 'addmember', workspace: S.overlay === 'workspace' },
      // makon boshqaruvi
      myWorkspaces, shaxsiyActive: isShaxsiy, onSelectShaxsiy: () => this.setActiveWorkspace(null),
      wsDraft: S.wsDraft, wsTypeChips, onWsName: this.onWsName, createWorkspace: this.createWorkspace,
      showIsh: !isChild,
      close: this.closeOv, setScroll: this.setScroll,
      logout: this.logout, flash: S.flash,
    };
  }

  render() {
    if (!this.state.hydrated || !this.state.authReady) {
      return (
        <LinearGradient colors={['#0a1f18', '#071510', '#050f0b']} locations={[0, 0.62, 1]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={C.gold} size="large" />
        </LinearGradient>
      );
    }
    const v = this.vals();
    return (
      <LinearGradient colors={['#0a1f18', '#071510', '#050f0b']} locations={[0, 0.62, 1]} style={{ flex: 1 }}>
        {v.booted && (
          <View style={{ flex: 1 }}>
            <ScrollView ref={v.setScroll} style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {v.tab === 'bugun' && <Bugun v={v} />}
              {v.tab === 'namoz' && <Namoz v={v} />}
              {v.tab === 'reja' && <Reja v={v} />}
              {v.tab === 'jamoa' && <Jamoa v={v} />}
              {v.tab === 'profil' && <Profil v={v} />}
            </ScrollView>
            <TabBar v={v} />
          </View>
        )}

        {v.showOnboarding && <Onboarding v={v} />}

        {v.ov.tasbeh && <TasbehOverlay v={v} />}
        {v.ov.qibla && <QiblaOverlay v={v} />}
        {v.ov.stats && <StatsOverlay v={v} />}
        {v.ov.habits && <HabitsOverlay v={v} />}
        {v.ov.settings && <SettingsOverlay v={v} />}
        {v.ov.member && v.selMemberObj && <MemberOverlay v={v} />}
        {v.ov.task && v.selTaskObj && <TaskOverlay v={v} />}
        {v.ov.assign && <AssignOverlay v={v} />}
        {v.ov.addmember && <AddMemberOverlay v={v} />}
        {v.ov.workspace && <WorkspaceSheet v={v} />}

        {!!v.flash && (
          <View pointerEvents="none" style={st.flash}>
            <Text style={st.flashText}>{v.flash}</Text>
          </View>
        )}
      </LinearGradient>
    );
  }
}

const st = StyleSheet.create({
  flash: {
    position: 'absolute', bottom: 110, alignSelf: 'center', zIndex: 55,
    backgroundColor: 'rgba(20,64,47,0.97)', borderWidth: 1, borderColor: 'rgba(217,179,106,0.4)',
    paddingVertical: 13, paddingHorizontal: 22, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 15, shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  flashText: { fontFamily: F.bold, fontSize: 14, color: C.cream },
});
