import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { C, F } from './theme';
import { DEFAULT_CITY, DEFAULT_COORDS, fmtClock, nextPrayer, currentPrayer, pad2, prayerList, qiblaBearing } from './lib/prayer';
import { hijriLabel, hijriMonthLabel } from './lib/hijri';
import { loadState, saveState, todayKey } from './lib/storage';
import { ensureUserDoc, mapAuthError, signInEmail, signOutUser, signUpEmail, watchAuth } from './lib/auth';
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
const DEFAULT_MODE = 'shaxsiy';

// Slice of state persisted to AsyncStorage.
// Auth/hisob endi Firebase'da — 'booted'/'account' bu yerda saqlanmaydi.
const PERSIST_KEYS = [
  'mode', 'settings', 'amals', 'amalsDate', 'habits', 'tasks', 'members',
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

export default class Root extends React.Component {
  ME = { name: 'Anvar', last: 'Karimov', role: 'Rahbar', color: '#D9B36A' };

  state = {
    hydrated: false,
    // Firebase auth
    authReady: false, fbUser: null, userDoc: null,
    authMode: 'signup', authForm: { name: '', email: '', password: '', birthYear: '' }, authBusy: false,
    mode: DEFAULT_MODE, tab: 'bugun', overlay: null,
    now: Date.now(),
    coords: DEFAULT_COORDS, cityName: DEFAULT_CITY, locStatus: 'default', // default | granted | denied
    selMember: null, selTask: null, selDay: new Date().getDate(),
    tasbehCount: 0, tasbehTarget: 33, dhikrIdx: 0,
    settings: { namoz: true, azon: true, zikr: false, jamoa: true },
    draft: { assigneeId: null, title: '', category: 'Namoz', due: 'Bugun', type: 'vazifa' },
    newM: { name: '', role: '', detail: '' },
    flash: null,
    amalsDate: todayKey(),
    // ——— mock data: jamoa/oila section keeps local mock members & tasks until Firebase lands ———
    members: [
      { id: 'm1', name: 'Malika', roles: { oila: 'Ona', talim: "O'qituvchi", ishxona: 'Buxgalter' }, group: '2-kurs', color: '#E0916F', online: true },
      { id: 'm2', name: 'Sardor', roles: { oila: "O'g'il", talim: "O'quvchi", ishxona: 'Sotuv menejeri' }, group: '9-sinf', color: '#6FB3E0', online: false },
      { id: 'm3', name: 'Zaynab', roles: { oila: 'Qiz', talim: 'Talaba', ishxona: 'Dizayner' }, group: '1-kurs', color: '#A98FE0', online: true },
      { id: 'm4', name: 'Jahongir', roles: { oila: "O'g'il", talim: 'Talaba', ishxona: 'Dasturchi' }, group: '11-sinf', color: '#43C08D', online: false },
    ],
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
    tasks: [
      { id: 'k1', title: "Bomdodni jamoat bilan o'qish", desc: 'Mahalla masjidida jamoat namozida ishtirok etish.', assignee: 'm2', assigner: 'me', status: 'bajarildi', due: 'Bugun', cat: 'Namoz' },
      { id: 'k2', title: "Qur'on: Baqara 1-20 oyat", desc: "Tajvid qoidalari bilan o'qib, yodlashni boshlash.", assignee: 'm3', assigner: 'me', status: 'bajarilmoqda', due: 'Bugun', cat: "Qur'on" },
      { id: 'k3', title: 'Matematika uy vazifasi', desc: "5-mavzu bo'yicha 1-10 misollarni yechish.", assignee: 'm2', assigner: 'me', status: 'yuborildi', due: 'Ertaga', cat: "Ta'lim" },
      { id: 'k4', title: 'Oylik hisobotni tayyorlash', desc: "Iyul oyi bo'yicha moliyaviy hisobot.", assignee: 'm1', assigner: 'me', status: 'qabul', due: 'Bu hafta', cat: 'Ish' },
      { id: 'k5', title: 'Kechki sadaqa ulashish', desc: 'Ehtiyojmand oilalarga yordam yetkazish.', assignee: 'm4', assigner: 'me', status: 'rad', due: 'Bugun', cat: 'Sadaqa' },
      { id: 'k6', title: 'Kahf surasini yodlash', desc: 'Juma kuniga birinchi 10 oyatni tayyorlab keling.', assignee: 'me', assigner: 'Ustoz Karim', status: 'yuborildi', due: 'Juma', cat: "Qur'on", type: 'vazifa' },
      { id: 'k7', title: 'Ertaga imtihon — tayyorlaning', desc: "3-bob bo'yicha yozma imtihon. Konspektlaringizni ko'rib chiqing.", assignee: 'me', assigner: "O'qituvchi Kamola", status: 'yuborildi', due: 'Ertaga', cat: 'Imtihon', type: 'eslatma' },
      { id: 'k8', title: "Insho: Vatan tuyg'usi", desc: "Kamida bir bet, qo'lda yozilsin.", assignee: 'm2', assigner: 'me', status: 'bajarilmoqda', due: 'Chorshanba', cat: 'Dars', type: 'vazifa' },
    ],
  };

  async componentDidMount() {
    this._t = setInterval(() => this.setState({ now: Date.now() }), 1000);
    // 1) hydrate persisted state
    const saved = await loadState();
    if (saved) {
      const patch = {};
      for (const k of PERSIST_KEYS) if (saved[k] !== undefined) patch[k] = saved[k];
      // daily reset: amals checkboxes clear on a new day
      if (patch.amals && saved.amalsDate !== todayKey()) {
        patch.amals = patch.amals.map(a => ({ ...a, done: false }));
        patch.amalsDate = todayKey();
      }
      this.setState({ ...patch, hydrated: true });
    } else {
      this.setState({ hydrated: true });
    }
    // 2) locate the user (offline prayer math needs coordinates only)
    this.locate();
    // 3) Firebase auth holatini kuzatish (sessiya AsyncStorage'da saqlanadi)
    this._unsubAuth = watchAuth(async (user) => {
      if (user) {
        let userDoc = null;
        try { userDoc = await ensureUserDoc(user, {}); } catch (e) { /* offline bo'lsa keyin yuklanadi */ }
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
      } catch (e) { /* geocoder unavailable — keep default city name */ }
    } catch (e) {
      this.setState({ locStatus: 'denied' });
    }
  };

  // ————— actions —————
  roleOptsFor(mode) { return mode === 'talim' ? ["O'quvchi", 'Talaba', "O'qituvchi", 'Assistent', 'Mudir'] : mode === 'ishxona' ? ['Rahbar', 'Menejer', 'Xodim', 'Ishchi', 'Amaliyotchi'] : ['Ota', 'Ona', "O'g'il", 'Qiz', 'Farzand', 'Boshqa']; }
  roleOf(m, mode) { return (m.roles && m.roles[mode]) || "A'zo"; }
  isMgrRole(r) { return ['Ota', 'Ona', "O'qituvchi", 'Mudir', 'Rahbar', 'Menejer'].indexOf(r) >= 0; }

  setMemberRole = (id, role) => this.setState(s => ({ members: s.members.map(m => m.id === id ? { ...m, roles: { ...(m.roles || {}), [s.mode]: role } } : m) }));
  pickNMRole = (r) => this.setState(s => ({ newM: { ...s.newM, role: r } }));
  onNMDetail = (v) => this.setState(s => ({ newM: { ...s.newM, detail: v } }));
  onNMName = (v) => this.setState(s => ({ newM: { ...s.newM, name: v } }));

  // ————— auth (email/parol) —————
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
      // watchAuth fbUser/userDoc'ni o'rnatadi va ilova ochiladi
      this.setState({ authForm: { name: '', email: '', password: '', birthYear: '' } });
    } catch (e) {
      this.flash(mapAuthError(e));
    } finally {
      this.setState({ authBusy: false });
    }
  };
  setMode = (m) => { this.setState({ mode: m, overlay: null, tab: 'bugun' }); this._scroll?.scrollTo({ y: 0, animated: false }); };
  logout = async () => {
    this.setState({ overlay: null, tab: 'bugun' });
    try { await signOutUser(); } catch (e) { this.flash(mapAuthError(e)); }
  };
  go = (tab) => { this.setState({ tab, overlay: null }); this._scroll?.scrollTo({ y: 0, animated: false }); };
  openOv = (name) => this.setState({ overlay: name });
  closeOv = () => this.setState({ overlay: null, selMember: null, selTask: null });
  setScroll = (el) => { this._scroll = el; };
  toggleAmal = (id) => this.setState(s => ({ amals: s.amals.map(a => a.id === id ? { ...a, done: !a.done } : a), amalsDate: todayKey() }));
  toggleHabit = (id) => this.setState(s => ({ habits: s.habits.map(h => { if (h.id !== id) return h; const w = h.week.slice(); const nd = !w[6]; w[6] = nd; return { ...h, week: w, streak: nd ? h.streak + 1 : Math.max(0, h.streak - 1) }; }) }));
  tasbehTap = () => this.setState(s => ({ tasbehCount: s.tasbehCount + 1 }));
  tasbehReset = () => this.setState({ tasbehCount: 0 });
  setDhikr = (i) => this.setState({ dhikrIdx: i, tasbehCount: 0 });
  setTarget = (n) => this.setState({ tasbehTarget: n });
  selectMember = (id) => this.setState({ selMember: id, overlay: 'member' });
  selectTask = (id) => this.setState({ selTask: id, overlay: 'task' });
  selectDay = (d) => this.setState({ selDay: d });
  setStatus = (id, status) => this.setState(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, status } : t) }));
  toggleSetting = (k) => this.setState(s => ({ settings: { ...s.settings, [k]: !s.settings[k] } }));
  onDraftTitle = (v) => this.setState(s => ({ draft: { ...s.draft, title: v } }));
  pickAssignee = (id) => this.setState(s => ({ draft: { ...s.draft, assigneeId: id } }));
  pickCat = (c) => this.setState(s => ({ draft: { ...s.draft, category: c } }));
  pickDue = (d) => this.setState(s => ({ draft: { ...s.draft, due: d } }));
  pickType = (t) => this.setState(s => ({ draft: { ...s.draft, type: t } }));
  submitAssign = () => {
    const d = this.state.draft;
    if (!d.assigneeId || !d.title.trim()) { this.flash("A'zo va nomni kiriting"); return; }
    const id = 'k' + Date.now();
    const isR = d.type === 'eslatma';
    this.setState(s => ({
      tasks: [{ id, title: d.title.trim(), desc: d.category + (isR ? " bo'yicha eslatma." : " yo'nalishidagi vazifa.") + ' Muddat: ' + d.due + '.', assignee: d.assigneeId, assigner: 'me', status: 'yuborildi', due: d.due, cat: d.category, type: d.type }, ...s.tasks],
      draft: { assigneeId: null, title: '', category: 'Namoz', due: 'Bugun', type: 'vazifa' },
      overlay: null, tab: 'jamoa',
    }));
    this.flash(isR ? 'Eslatma yuborildi ✓' : 'Vazifa yuborildi ✓');
  };
  addMember = () => {
    const n = this.state.newM;
    if (!n.name.trim()) { this.flash('Ism kiriting'); return; }
    if (!n.role) { this.flash('Rolni tanlang'); return; }
    const cols = ['#E0916F', '#6FB3E0', '#A98FE0', '#43C08D', '#D9B36A'];
    const id = 'm' + Date.now();
    const mode = this.state.mode;
    this.setState(s => ({
      members: [...s.members, { id, name: n.name.trim(), roles: { [mode]: n.role }, group: n.detail || '—', color: cols[s.members.length % cols.length], online: false }],
      newM: { name: '', role: '', detail: '' }, overlay: null,
    }));
    this.flash("A'zo qo'shildi ✓");
  };
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

    // Prayer times — computed offline from coordinates via adhan
    const list = prayerList(coords, now);
    const nextP = nextPrayer(coords, now);
    const curP = currentPrayer(coords, now);
    const diff = Math.max(0, nextP.date - now);
    const dh = Math.floor(diff / 3600000), dm = Math.floor(diff % 3600000 / 60000), ds = Math.floor(diff % 60000 / 1000);
    const countdown = SHOW_SECONDS ? `${pad2(dh)}:${pad2(dm)}:${pad2(ds)}` : `${dh} soat ${dm} daq`;
    const prayers = list.map(p => ({
      name: p.name, ar: p.ar, info: !!p.info,
      time: fmtClock(p.date, USE_24H),
      passed: p.date <= now,
      isNext: !p.info && p.k === nextP.k && nextP.date.getDate() === now.getDate(),
    }));

    const amals = S.amals.map(a => ({ ...a, onToggle: () => this.toggleAmal(a.id) }));
    // Show real Bomdod time in the first amal's subtitle
    if (amals[0]) amals[0] = { ...amals[0], sub: fmtClock(list[0].date, USE_24H) + ' · jamoat bilan' };
    const goalDone = S.amals.filter(a => a.done).length, goalTotal = S.amals.length;
    const goalPct = goalTotal ? Math.round(goalDone / goalTotal * 100) : 0;

    const memTasks = mid => S.tasks.filter(t => t.assignee === mid);
    // Hisob endi Firebase userDoc'dan keladi
    const booted = !!S.fbUser;
    const ud = S.userDoc || {};
    const nowYear = new Date().getFullYear();
    const uAge = ud.birthYear ? nowYear - ud.birthYear : null;
    const isChild = uAge != null ? uAge < 16 : false;
    const accName = (ud.name || (S.fbUser && S.fbUser.displayName) || 'Foydalanuvchi').trim() || 'Foydalanuvchi';
    const acc = { name: accName, email: ud.email || (S.fbUser && S.fbUser.email) || '', birthYear: ud.birthYear || null, isChild };
    const first = accName.split(' ')[0], last = accName.split(' ').slice(1).join(' ');
    const mode = S.mode;
    const modeLabel = mode === 'ishxona' ? 'Ishxona' : mode === 'talim' ? "Ta'lim" : mode === 'shaxsiy' ? 'Shaxsiy' : 'Oilam';
    const canManage = mode !== 'shaxsiy' && !isChild;
    const jamoaSub = mode === 'shaxsiy' ? 'Shaxsiy makon' : isChild ? 'Sizga berilgan topshiriqlar' : mode === 'talim' ? 'Talabalarga eslatma va vazifa' : mode === 'ishxona' ? 'Xodimlar oqimi nazorati' : 'Oila vazifalari nazorati';
    const membersLabel = mode === 'talim' ? 'Talabalar' : mode === 'ishxona' ? 'Xodimlar' : "A'zolar";
    const myAll = S.tasks.filter(t => t.assignee === 'me');
    const myTotal = myAll.length;
    const myDone = myAll.filter(t => t.status === 'bajarildi').length;
    const myPct = myTotal ? Math.round(myDone / myTotal * 100) : 0;

    const nameOf = id => id === 'me' ? this.ME.name : (S.members.find(m => m.id === id) || {}).name || id;
    const colorOf = id => id === 'me' ? this.ME.color : (S.members.find(m => m.id === id) || {}).color || C.gold;

    const members = S.members.map(m => {
      const ts = memTasks(m.id), done = ts.filter(t => t.status === 'bajarildi').length, pct = ts.length ? Math.round(done / ts.length * 100) : 0;
      const role = this.roleOf(m, mode);
      return {
        id: m.id, name: m.name, initial: m.name[0], color: m.color, online: m.online,
        role, isMgr: this.isMgrRole(role),
        label: mode === 'talim' ? (role + ' · ' + m.group) : role,
        doneCount: done, totalCount: ts.length, pct,
        onOpen: () => this.selectMember(m.id),
      };
    });

    const all = S.tasks.filter(t => t.assigner === 'me');
    const board = {
      send: all.filter(t => t.status === 'yuborildi').length,
      prog: all.filter(t => t.status === 'qabul' || t.status === 'bajarilmoqda').length,
      done: all.filter(t => t.status === 'bajarildi').length,
    };
    board.total = all.length;
    board.pct = board.total ? Math.round(board.done / board.total * 100) : 0;

    const taskCard = t => ({
      id: t.id, title: t.title, cat: t.cat, due: t.due,
      statusMeta: STATUS_META[t.status] || STATUS_META.yuborildi,
      type: t.type, isReminder: t.type === 'eslatma',
      assigneeName: nameOf(t.assignee), assigneeInitial: (nameOf(t.assignee) || '?')[0], assigneeColor: colorOf(t.assignee),
      onOpen: () => this.selectTask(t.id),
    });
    const jamoaTasks = all.map(taskCard);

    const myTasks = myAll.map(t => {
      const isR = t.type === 'eslatma';
      return {
        id: t.id, title: t.title, desc: t.desc, cat: t.cat, due: t.due, type: t.type,
        statusMeta: STATUS_META[t.status] || STATUS_META.yuborildi,
        assignerName: t.assigner === 'me' ? 'Men' : t.assigner,
        isReminder: isR, notDone: t.status !== 'bajarildi',
        isPending: !isR && t.status === 'yuborildi', canStart: !isR && t.status === 'qabul', canComplete: !isR && t.status === 'bajarilmoqda',
        onOpen: () => this.selectTask(t.id),
        onAccept: () => this.setStatus(t.id, 'qabul'), onReject: () => this.setStatus(t.id, 'rad'),
        onStart: () => this.setStatus(t.id, 'bajarilmoqda'), onComplete: () => this.setStatus(t.id, 'bajarildi'),
      };
    });

    let selMemberObj = null;
    if (S.selMember) {
      const m = S.members.find(x => x.id === S.selMember);
      if (m) {
        const ts = memTasks(m.id), done = ts.filter(t => t.status === 'bajarildi').length, tot = ts.length;
        const role = this.roleOf(m, mode);
        selMemberObj = {
          name: m.name, initial: m.name[0], color: m.color, role,
          label: mode === 'talim' ? (role + ' · ' + m.group) : role,
          doneCount: done, totalCount: tot, pct: tot ? Math.round(done / tot * 100) : 0,
          roleChips: this.roleOptsFor(mode).map(r => ({ name: r, active: r === role, onPick: () => this.setMemberRole(m.id, r) })),
          tasks: ts.map(taskCard),
          onAssign: () => this.setState(s => ({ draft: { ...s.draft, assigneeId: m.id }, overlay: 'assign' })),
        };
      }
    }

    let selTaskObj = null;
    if (S.selTask) {
      const t = S.tasks.find(x => x.id === S.selTask);
      if (t) {
        const isR = t.type === 'eslatma';
        selTaskObj = {
          title: t.title, desc: t.desc, due: t.due, cat: t.cat, type: t.type,
          statusMeta: STATUS_META[t.status] || STATUS_META.yuborildi,
          assigneeName: nameOf(t.assignee), assigneeInitial: (nameOf(t.assignee) || '?')[0], assigneeColor: colorOf(t.assignee),
          assignerName: t.assigner === 'me' ? 'Men (siz)' : t.assigner,
          isReminder: isR, reminderPending: isR && t.status !== 'bajarildi',
          canAccept: !isR && t.status === 'yuborildi', canStart: !isR && t.status === 'qabul', canComplete: !isR && t.status === 'bajarilmoqda',
          isFinal: t.status === 'bajarildi' || t.status === 'rad',
          onAccept: () => this.setStatus(t.id, 'qabul'), onReject: () => this.setStatus(t.id, 'rad'),
          onStart: () => this.setStatus(t.id, 'bajarilmoqda'), onComplete: () => this.setStatus(t.id, 'bajarildi'),
          onReopen: () => this.setStatus(t.id, 'yuborildi'), onAck: () => this.setStatus(t.id, 'bajarildi'),
        };
      }
    }

    // Calendar for the real current month (Mon-first)
    const daysUz = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
    const y = now.getFullYear(), mIdx = now.getMonth();
    const firstDow = (new Date(y, mIdx, 1).getDay() + 6) % 7; // 0 = Monday
    const daysInMonth = new Date(y, mIdx + 1, 0).getDate();
    const taskDays = [3, 7, 12, 15, 21, 26]; // mock markers until tasks carry real dates
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push({ blank: true, key: 'b' + i });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        blank: false, key: 'd' + d, num: d,
        selected: d === S.selDay, today: d === now.getDate(), hasTask: taskDays.indexOf(d) >= 0,
        onSelect: () => this.selectDay(d),
      });
    }
    const monthLabel = hijriMonthLabel(now) + ' · ' + mo[mIdx];

    // Day timeline built around today's real prayer times
    const pt = k => fmtClock(list.find(p => p.k === k).date, USE_24H);
    const passed = k => list.find(p => p.k === k).date <= now;
    const timeline = [
      { time: pt('fajr'), title: 'Bomdod namozi', type: 'Namoz', color: C.emerald, done: passed('fajr') },
      { time: '07:00', title: "Ertalabki zikr va Qur'on", type: 'Ibodat', color: C.gold, done: h >= 7 },
      { time: '09:30', title: "Ish / o'qish", type: 'Reja', color: C.blue, done: false },
      { time: pt('dhuhr'), title: 'Peshin namozi', type: 'Namoz', color: C.gold, done: passed('dhuhr') },
      { time: pt('asr'), title: 'Asr namozi', type: 'Namoz', color: C.sageDim, done: passed('asr') },
      { time: '20:00', title: 'Oila bilan kechki taom', type: 'Oila', color: C.purple, done: false },
      { time: pt('isha'), title: 'Xufton + kunlik hisob', type: 'Namoz', color: C.sageDim, done: passed('isha') },
    ];

    const habits = S.habits.map(hb => ({
      ...hb, today: hb.week[6],
      onToggleToday: () => this.toggleHabit(hb.id),
      weekCells: hb.week.map((v, i) => ({ letter: daysUz[i], on: v })),
    }));

    const pw = [{ d: 'Du', p: 100 }, { d: 'Se', p: 100 }, { d: 'Ch', p: 80 }, { d: 'Pa', p: 100 }, { d: 'Ju', p: 100 }, { d: 'Sh', p: 60 }, { d: 'Ya', p: 40 }];
    const prayerWeek = pw.map(x => ({ ...x, color: x.p >= 100 ? C.emerald : x.p >= 60 ? C.gold : C.red }));
    const overallPct = 83;
    const leaderboard = members.slice().sort((a, b) => b.pct - a.pct).map((m, i) => ({ ...m, rank: i + 1 }));

    const dh0 = DHIKRS[S.dhikrIdx];
    const tasbeh = {
      count: S.tasbehCount, target: S.tasbehTarget,
      rounds: Math.floor(S.tasbehCount / S.tasbehTarget),
      progress: (S.tasbehCount % S.tasbehTarget) / S.tasbehTarget,
      ar: dh0.ar, tr: dh0.tr,
      onTap: this.tasbehTap, onReset: this.tasbehReset,
      dhikrs: DHIKRS.map((d, i) => ({ name: d.name, active: i === S.dhikrIdx, onPick: () => this.setDhikr(i) })),
      targets: [33, 99, 100].map(n => ({ n, active: n === S.tasbehTarget, onPick: () => this.setTarget(n) })),
    };

    const qibla = { bearing: Math.round(qiblaBearing(coords)), cityName: S.cityName, locStatus: S.locStatus };

    const cats = ['Namoz', "Qur'on", 'Dars', 'Imtihon', 'Ish', 'Sadaqa'];
    const dues = ['Bugun', 'Ertaga', 'Bu hafta', 'Juma'];
    const assignMembers = S.members.map(m => ({ id: m.id, name: m.name, color: m.color, active: S.draft.assigneeId === m.id, onPick: () => this.pickAssignee(m.id) }));
    const catChips = cats.map(c => ({ name: c, active: S.draft.category === c, onPick: () => this.pickCat(c) }));
    const dueChips = dues.map(d => ({ name: d, active: S.draft.due === d, onPick: () => this.pickDue(d) }));
    const typeChips = [{ k: 'vazifa', name: 'Vazifa' }, { k: 'eslatma', name: 'Eslatma' }].map(x => ({ ...x, active: S.draft.type === x.k, onPick: () => this.pickType(x.k) }));

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
      meRole: isChild ? 'Farzand' : (mode === 'ishxona' ? 'Rahbar' : mode === 'talim' ? "O'qituvchi" : mode === 'oila' ? 'Ota-ona' : 'Foydalanuvchi'),
      cityName: S.cityName, locStatus: S.locStatus, account: acc, isChild, mode, modeLabel, canManage,
      isShaxsiy: mode === 'shaxsiy', isChildTeam: mode !== 'shaxsiy' && isChild,
      jamoaSub, membersLabel, roleLabel: modeLabel, myTotal, myDone, myPct,
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
      roleChipsAdd: this.roleOptsFor(mode).map(r => ({ name: r, active: S.newM.role === r, onPick: () => this.pickNMRole(r) })),
      settings: S.settings,
      toggleSetting: { namoz: () => this.toggleSetting('namoz'), azon: () => this.toggleSetting('azon'), zikr: () => this.toggleSetting('zikr'), jamoa: () => this.toggleSetting('jamoa') },
      tab: S.tab,
      go: { bugun: () => this.go('bugun'), namoz: () => this.go('namoz'), reja: () => this.go('reja'), jamoa: () => this.go('jamoa'), profil: () => this.go('profil') },
      open: { tasbeh: () => this.openOv('tasbeh'), qibla: () => this.openOv('qibla'), stats: () => this.openOv('stats'), habits: () => this.openOv('habits'), settings: () => this.openOv('settings'), assign: () => this.openOv('assign'), addmember: () => this.openOv('addmember'), workspace: () => this.openOv('workspace') },
      ov: { tasbeh: S.overlay === 'tasbeh', qibla: S.overlay === 'qibla', stats: S.overlay === 'stats', habits: S.overlay === 'habits', settings: S.overlay === 'settings', member: S.overlay === 'member', task: S.overlay === 'task', assign: S.overlay === 'assign', addmember: S.overlay === 'addmember', workspace: S.overlay === 'workspace' },
      setMode: { shaxsiy: () => this.setMode('shaxsiy'), oila: () => this.setMode('oila'), talim: () => this.setMode('talim'), ishxona: () => this.setMode('ishxona') },
      showIsh: !isChild,
      close: this.closeOv, setScroll: this.setScroll,
      logout: this.logout, flash: S.flash,
    };
  }

  render() {
    // Splash: lokal ma'lumot yuklanmaguncha yoki Firebase auth holati aniqlanmaguncha
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
