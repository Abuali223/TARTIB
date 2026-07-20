import React from 'react';
import { ActivityIndicator, Alert, AppState, BackHandler, Linking, Platform, ScrollView, Share, StatusBar, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { C, F, THEMES, ThemeProvider } from './theme';
import { DEFAULT_CITY, DEFAULT_COORDS, MADHABS, fmtClock, nextPrayer, currentPrayer, pad2, prayerList, qiblaBearing } from './lib/prayer';
import { CITIES } from './lib/cities';
import { LANGS, setLang, t } from './lib/i18n';
import { hijriLabel, hijriMonthLabel } from './lib/hijri';
import { loadState, saveState, todayKey } from './lib/storage';
import { ensureUserDoc, mapAuthError, signInEmail, signInWithGoogleIdToken, signOutUser, signUpEmail, watchAuth } from './lib/auth';
import { googleConfigured } from './lib/googleAuth';
import { googleSignInIdToken } from './lib/googleSignin';
import LockScreen from './screens/LockScreen';
import { setSecurePin, verifySecurePin, clearSecurePin, hashPin, verifyLegacyPin, biometricAvailable, biometricAuth } from './lib/lock';
import { appShareMessage } from './lib/appMeta';
import { CAP, WS_TYPES, isManagerPerms, isMinorAge, roleOptionsFor } from './lib/roles';
import { schedulePrayerReminders } from './lib/notifications';
import {
  addTask, createWorkspace, ensureJoinCode, fetchUser, joinByCode, setTaskStatus, updateMemberRole,
  subscribeInbox, subscribeMyMemberships, subscribeWorkspace, subscribeWorkspaceMembers, subscribeWorkspaceTasks,
} from './lib/db';
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
import { cameraAvailable, parseJoinCode } from './lib/native';
import PickerOverlay from './overlays/Picker';

const USE_24H = true;
const SHOW_SECONDS = true;
const LOCK_GRACE_MS = 60000; // fonda shu muddatdan uzoq turса — qaytganda qulf so'raydi (1 daqiqa)

// Faqat shaxsiy/lokal qism saqlanadi. Jamoa (makon/a'zo/vazifa) Firestore'da.
const PERSIST_KEYS = [
  'activeWorkspaceId', 'settings', 'amals', 'amalsDate', 'habits',
  'tasbehCount', 'tasbehTarget', 'dhikrIdx', 'madhab', 'manualCity', 'lang',
  'lockEnabled', 'pinHash', 'biometricEnabled', 'theme',
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
  _subs = { mem: null, inbox: null, ws: new Map(), members: null, tasks: null, activeWid: null };

  state = {
    hydrated: false,
    authReady: false, fbUser: null, userDoc: null,
    authMode: 'signup', authForm: { name: '', email: '', password: '', birthYear: '' }, authBusy: false,
    googleBusy: false, googleReady: false,
    activeWorkspaceId: null,
    tab: 'bugun', overlay: null,
    now: Date.now(),
    coords: DEFAULT_COORDS, cityName: DEFAULT_CITY, locStatus: 'default',
    madhab: 'hanafi', manualCity: null, lang: 'lotin', theme: 'dark',
    lockEnabled: false, pinHash: null, biometricEnabled: false,
    locked: false, pinSetup: false, // pinSetup: yangi PIN o'rnatish oynasi
    bioAvailable: false,
    selMember: null, selTask: null, selDay: new Date().getDate(),
    tasbehCount: 0, tasbehTarget: 33, dhikrIdx: 0,
    settings: { namoz: true, azon: true, zikr: false, jamoa: true },
    draft: { assigneeId: null, title: '', category: 'Namoz', due: 'Bugun', dueDate: null, type: 'vazifa' },
    wsDraft: { type: 'oila', name: '' },
    joinCode: '', joinBusy: false,
    flash: null,
    amalsDate: todayKey(),
    // ——— Firestore'dan sinxron ———
    myMemberships: [], myWorkspaces: {}, // {wid: workspace}
    activeMembers: [], activeTasks: [], inboxTasks: [],
    usersCache: {}, syncing: false,
    // ——— lokal shaxsiy ———
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

  get uid() { return this.state.fbUser ? this.state.fbUser.uid : null; }

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
      if (patch.lang) setLang(patch.lang); // i18n modulini saqlangan tilga moslash
      if (patch.lockEnabled) patch.locked = true; // ochilishda qulflangan (SecureStore yoki legacy)
      this.setState({ ...patch, hydrated: true }, () => this.syncNotifications());
    } else {
      this.setState({ hydrated: true }, () => this.syncNotifications());
    }
    this.locate();
    this._backSub = BackHandler.addEventListener('hardwareBackPress', this.onHardwareBack);
    // Chuqur havola (tartib://join/CODE) — tizim kamerasi QR skaner qilganda
    this._linkSub = Linking.addEventListener('url', ({ url }) => this.handleDeepLink(url));
    Linking.getInitialURL().then((u) => { if (u) this.handleDeepLink(u); }).catch(() => {});
    biometricAvailable().then(a => this.setState({ bioAvailable: a })).catch(() => {});
    // Ilova fonda LOCK_GRACE_MS'dan uzoq turса — qaytganda qulflanadi.
    // Qisqa o'tishlar (boshqa ilovaga bir zumга) qulflamaydi.
    this._appStateSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') {
        if (this._bgAt && this.state.lockEnabled &&
            (Date.now() - this._bgAt) > LOCK_GRACE_MS) {
          this.setState({ locked: true });
        }
        this._bgAt = null;
        return;
      }
      if ((s === 'background' || s === 'inactive') && !this._bgAt) {
        this._bgAt = Date.now(); // fonga o'tgan vaqtni belgilaymiz
      }
    });
    this._unsubAuth = watchAuth(async (user) => {
      if (user) {
        let userDoc = null;
        try { userDoc = await ensureUserDoc(user, {}); } catch (e) { /* offline */ }
        this.setState({ fbUser: { uid: user.uid, email: user.email, displayName: user.displayName }, userDoc, authReady: true }, () => {
          this.startSync(user.uid);
          if (this._pendingJoin) { const c = this._pendingJoin; this._pendingJoin = null; this.confirmJoin(c); }
        });
      } else {
        this.stopSync();
        this.setState({ fbUser: null, userDoc: null, authReady: true, myMemberships: [], myWorkspaces: {}, activeMembers: [], activeTasks: [], inboxTasks: [] });
      }
    });
  }

  componentWillUnmount() {
    clearInterval(this._t); clearTimeout(this._ft); clearTimeout(this._st);
    if (this._unsubAuth) this._unsubAuth();
    if (this._backSub) this._backSub.remove();
    if (this._linkSub) this._linkSub.remove();
    if (this._appStateSub) this._appStateSub.remove();
    this.stopSync();
  }

  // Android "ortga" tugmasi: ilovadan chiqib ketmasin — avval oyna/tabni yopsin
  onHardwareBack = () => {
    const { overlay, tab, fbUser, locked, pinSetup } = this.state;
    if (locked) return true;                          // qulf ekrani — chiqmasin
    if (pinSetup) { this.setState({ pinSetup: false }); return true; }
    if (overlay) {
      // Sozlamalar ichidagi tanlovlar — Sozlamalarga qaytadi, aks holda yopiladi
      if (overlay === 'madhab' || overlay === 'city' || overlay === 'lang') this.setState({ overlay: 'settings' });
      else this.setState({ overlay: null });
      return true;
    }
    if (!fbUser) return false;          // onboarding — chiqishga ruxsat
    if (tab !== 'bugun') { this.go('bugun'); return true; }
    // Bosh ekranda — ikki marta bosilsa chiqadi
    if (this._backExitAt && Date.now() - this._backExitAt < 2000) return false;
    this._backExitAt = Date.now();
    this.flash('Chiqish uchun yana bir marta bosing');
    return true;
  };

  componentDidUpdate(_, prev) {
    if (this.state.hydrated) {
      for (const k of PERSIST_KEYS) {
        if (prev[k] !== this.state[k]) { this.schedulePersist(); break; }
      }
    }
    // Faol makon o'zgarsa — a'zolar/vazifalarga obuna
    if (prev.activeWorkspaceId !== this.state.activeWorkspaceId) this.syncActive();
    // Koordinata, shahar, mazhab yoki namoz/azon sozlamasi o'zgarsa — qayta rejalash
    if (this.state.hydrated && (
      prev.coords !== this.state.coords ||
      prev.manualCity !== this.state.manualCity ||
      prev.madhab !== this.state.madhab ||
      prev.settings.namoz !== this.state.settings.namoz ||
      prev.settings.azon !== this.state.settings.azon
    )) this.syncNotifications();
  }

  syncNotifications() {
    const c = this.effCoords();
    const key = `${c.latitude.toFixed(3)},${c.longitude.toFixed(3)}|${this.state.madhab}|${this.state.settings.namoz}|${this.state.settings.azon}`;
    if (this._notifKey === key) return;
    this._notifKey = key;
    schedulePrayerReminders(c, { enabled: this.state.settings.namoz, sound: this.state.settings.azon, madhab: this.state.madhab }).catch(() => {});
  }

  schedulePersist() {
    clearTimeout(this._st);
    this._st = setTimeout(() => {
      const slice = {};
      for (const k of PERSIST_KEYS) slice[k] = this.state[k];
      saveState(slice);
    }, 400);
  }

  // ————— Firestore sinxron —————
  startSync(uid) {
    this.stopSync();
    this.setState({ syncing: true });
    this._subs.mem = subscribeMyMemberships(uid, (rows, err) => {
      if (err || !rows) { this.setState({ syncing: false }); return; }
      // Har makonga obuna (workspace hujjati)
      const ids = rows.map(m => m.workspaceId);
      for (const wid of ids) {
        if (!this._subs.ws.has(wid)) {
          this._subs.ws.set(wid, subscribeWorkspace(wid, (ws) => {
            // Vaqtinchalik null/xatoni e'tiborsiz qoldiramiz (avvalgi qiymatni saqlaymiz)
            this.setState(s => (ws ? { myWorkspaces: { ...s.myWorkspaces, [wid]: ws } } : {}));
            // Eski makon: kod→makon xaritasi yo'q bo'lsa ega uni tiklaydi (bir marta)
            if (ws && ws.ownerUserId === this.uid && ws.code) {
              this._healed = this._healed || new Set();
              if (!this._healed.has(ws.code)) { this._healed.add(ws.code); ensureJoinCode(ws); }
            }
          }));
        }
      }
      // Endi a'zo bo'lmagan makonlardan obunani uzish
      for (const [wid, unsub] of this._subs.ws) {
        if (!ids.includes(wid)) { unsub && unsub(); this._subs.ws.delete(wid); this.setState(s => { const m = { ...s.myWorkspaces }; delete m[wid]; return { myWorkspaces: m }; }); }
      }
      this.setState({ myMemberships: rows, syncing: false }, () => {
        // agar faol makon endi a'zoligimda bo'lmasa — shaxsiyga qayt
        if (this.state.activeWorkspaceId && !ids.includes(this.state.activeWorkspaceId)) {
          this.setState({ activeWorkspaceId: null });
        }
      });
    });
    this._subs.inbox = subscribeInbox(uid, (rows, err) => {
      if (err || !rows) return;
      this.setState({ inboxTasks: rows });
      this.ensureUsers(rows.map(t => t.assignerUserId));
    });
    // stopSync activeWid'ni null qildi — faol makon a'zolari/vazifalariga qayta obuna bo'lamiz
    this.syncActive();
  }

  syncActive() {
    const wid = this.state.activeWorkspaceId;
    if (this._subs.activeWid === wid) return;
    if (this._subs.members) { this._subs.members(); this._subs.members = null; }
    if (this._subs.tasks) { this._subs.tasks(); this._subs.tasks = null; }
    this._subs.activeWid = wid;
    if (!wid) { this.setState({ activeMembers: [], activeTasks: [] }); return; }
    this._subs.members = subscribeWorkspaceMembers(wid, (rows, err) => {
      if (err || !rows) return;
      this.setState({ activeMembers: rows });
      this.ensureUsers(rows.map(m => m.userId));
    });
    this._subs.tasks = subscribeWorkspaceTasks(wid, (rows, err) => {
      if (err || !rows) return;
      this.setState({ activeTasks: rows });
      this.ensureUsers(rows.flatMap(t => [t.assignerUserId, t.assigneeUserId]));
    });
  }

  stopSync() {
    const s = this._subs;
    if (s.mem) s.mem(); if (s.inbox) s.inbox();
    if (s.members) s.members(); if (s.tasks) s.tasks();
    for (const [, unsub] of s.ws) unsub && unsub();
    this._subs = { mem: null, inbox: null, ws: new Map(), members: null, tasks: null, activeWid: null };
  }

  async ensureUsers(ids) {
    const me = this.uid;
    const missing = [...new Set(ids)].filter(id => id && id !== me && !this.state.usersCache[id]);
    if (!missing.length) return;
    const fetched = await Promise.all(missing.map(fetchUser));
    this.setState(s => {
      const c = { ...s.usersCache };
      fetched.forEach(u => { c[u.id] = u; });
      return { usersCache: c };
    });
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
  // Qo'lda shahar tanlangan bo'lsa — o'sha, aks holda GPS (yoki default)
  effCoords() {
    const m = this.state.manualCity;
    return m ? { latitude: m.latitude, longitude: m.longitude } : this.state.coords;
  }
  effCity() {
    const m = this.state.manualCity;
    return m ? m.name : this.state.cityName;
  }
  activeWs() { return this.state.activeWorkspaceId ? this.state.myWorkspaces[this.state.activeWorkspaceId] : null; }
  myMembershipOf(wid) { return this.state.myMemberships.find(m => m.workspaceId === wid); }
  canIn(ws, cap) {
    if (!ws) return false;
    if (ws.ownerUserId === this.uid) return true;
    const mem = this.myMembershipOf(ws.id);
    return !!mem && (mem.permissions || []).includes(cap);
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
    this.setState({ overlay: null, tab: 'bugun', activeWorkspaceId: null });
    try { await signOutUser(); } catch (e) { this.flash(mapAuthError(e)); }
  };

  // ————— Google bilan kirish (native @react-native-google-signin) —————
  startGoogle = async () => {
    if (this.state.googleBusy) return;
    if (!googleConfigured) { this.flash('Google hali sozlanmagan — email bilan kiring'); return; }
    this.setState({ googleBusy: true });
    try {
      const idToken = await googleSignInIdToken();      // Google oynasi
      if (!idToken) { this.setState({ googleBusy: false }); return; }  // bekor qilindi
      await signInWithGoogleIdToken(idToken);           // watchAuth qolganini bajaradi
      this.flash('Xush kelibsiz!');
    } catch (e) {
      const m = e && e.message;
      this.flash(
        m === 'google-native-missing' ? 'Google faqat yangi APK’da — ilovani yangilang'
        : m === 'no-idtoken' ? 'Google token bermadi, qaytadan urining'
        : 'Google bilan kirishda xatolik'
      );
    } finally {
      this.setState({ googleBusy: false });
    }
  };

  // ————— navigatsiya —————
  go = (tab) => { this.setState({ tab, overlay: null }); this._scroll?.scrollTo({ y: 0, animated: false }); };
  openOv = (name) => this.setState({ overlay: name });
  closeOv = () => this.setState({ overlay: null, selMember: null, selTask: null });
  setScroll = (el) => { this._scroll = el; };
  setActiveWorkspace = (id) => { this.setState({ activeWorkspaceId: id, overlay: null, tab: id ? 'jamoa' : 'bugun' }); this._scroll?.scrollTo({ y: 0, animated: false }); };

  // ————— makon —————
  pickWsType = (t) => this.setState(s => ({ wsDraft: { ...s.wsDraft, type: t } }));
  onWsName = (v) => this.setState(s => ({ wsDraft: { ...s.wsDraft, name: v } }));
  createWorkspace = async () => {
    const { type, name } = this.state.wsDraft;
    if (!name.trim()) { this.flash('Makon nomini kiriting'); return; }
    try {
      const { wid } = await createWorkspace(this.uid, { type, name });
      this.setState({ wsDraft: { type: 'oila', name: '' }, overlay: null, activeWorkspaceId: wid, tab: 'jamoa' });
      this.flash('Makon yaratildi ✓');
    } catch (e) { this.flash('Xatolik: makon yaratilmadi'); }
  };
  onJoinCode = (v) => this.setState({ joinCode: (v + '').replace(/[^A-Za-z0-9-]/g, '').toUpperCase() });
  submitJoin = async () => {
    if (this.state.joinBusy) return;
    const code = this.state.joinCode.trim();
    if (!code) { this.flash('Kodni kiriting'); return; }
    this.setState({ joinBusy: true });
    try {
      const ws = await joinByCode(this.uid, code, { restricted: this.state.userDoc ? isMinorAge(this.state.userDoc.birthYear) : false });
      this.setState({ joinCode: '', overlay: null, activeWorkspaceId: ws.id, tab: 'jamoa' });
      this.flash('Makonga qo\'shildingiz ✓');
    } catch (e) {
      if (e.code === 'ws/not-found') this.setState({ joinCode: '' });  // junk/eskirgan kod qolmasin
      this.flash(e.code === 'ws/not-found' ? 'Bunday kod topilmadi' : e.code === 'ws/already-member' ? 'Siz allaqachon a\'zosiz' : 'Qo\'shilishda xatolik');
    } finally {
      this.setState({ joinBusy: false });
    }
  };

  // QR skaner ochish / natijani qabul qilish
  openScan = () => this.setState({ overlay: 'scanqr' });
  onScanned = (raw) => {
    const code = parseJoinCode(raw);
    if (!code) { this.setState({ overlay: null }); this.flash('QR o‘qilmadi'); return; }
    this.setState({ overlay: null, joinCode: code }, () => this.submitJoin());
  };

  // Chuqur havola: tartib://join/CODE — tizim kamerasi skaner qilganda ham.
  // Tashqi havola bo'lgani uchun AVTOMATIK qo'shmaymiz — tasdiq so'raymiz.
  confirmJoin = (code) => {
    Alert.alert(
      'Jamoaga qo‘shilish',
      `“${code}” taklif kodi bilan jamoaga qo‘shilasizmi?`,
      [
        { text: 'Bekor', style: 'cancel' },
        { text: 'Qo‘shilish', onPress: () => this.setState({ joinCode: code, overlay: null, tab: 'jamoa' }, () => this.submitJoin()) },
      ],
    );
  };
  handleDeepLink = (url) => {
    const code = parseJoinCode(url);
    if (!code) return;                 // faqat to'g'ri join havolasi
    if (this.uid) this.confirmJoin(code);
    else this._pendingJoin = code;     // login'dan keyin
  };

  // ————— a'zolar —————
  setMemberRole = async (ws, userId, role) => {
    try { await updateMemberRole(ws, userId, role); } catch (e) { this.flash("Rolni o'zgartirib bo'lmadi"); }
  };

  // ————— vazifalar —————
  selectMember = (id) => this.setState({ selMember: id, overlay: 'member' });
  selectTask = (id) => this.setState({ selTask: id, overlay: 'task' });
  selectDay = (d) => this.setState({ selDay: d });
  setStatus = async (id, status) => {
    // Ruxsat mijoz tomonida ham tekshiriladi (Firestore rules asosiy himoya)
    try { await setTaskStatus(id, status); } catch (e) { this.flash("Holatni o'zgartirib bo'lmadi"); }
  };
  toggleSetting = (k) => this.setState(s => ({ settings: { ...s.settings, [k]: !s.settings[k] } }));
  setMadhab = (key) => this.setState({ madhab: key, overlay: 'settings' });
  setManualCity = (city) => this.setState({ manualCity: city, overlay: 'settings' }); // city=null → GPS
  setAppLang = (key) => { setLang(key); this.setState({ lang: key, overlay: 'settings' }); };
  setTheme = (key) => this.setState({ theme: key === 'light' ? 'light' : 'dark', overlay: 'settings' });
  openPicker = (which) => this.setState({ overlay: which }); // 'madhab' | 'city' | 'lang'
  backToSettings = () => this.setState({ overlay: 'settings' });

  // ————— Ilovani ulashish —————
  shareApp = async () => {
    try { await Share.share({ message: appShareMessage() }); } catch (e) { /* bekor qilindi */ }
  };

  // ————— Ilova qulfi (PIN + biometrika) —————
  startSetPin = () => this.setState({ pinSetup: true, overlay: null });
  cancelSetPin = () => this.setState({ pinSetup: false });
  onSetPin = async (pin) => {
    try {
      const secure = await setSecurePin(pin);   // yangi APK: SecureStore
      if (secure) {
        this.setState({ pinHash: null, lockEnabled: true, pinSetup: false, locked: false });
      } else {
        // eski APK (SecureStore yo'q) — legacy hash (OTA'da ham ishlaydi)
        const h = await hashPin(pin);
        this.setState({ pinHash: h, lockEnabled: true, pinSetup: false, locked: false });
      }
      this.flash('Ilova qulfi yoqildi');
    } catch (e) { this.flash('Xatolik — qaytadan urining'); }
  };
  disableLock = () => {
    clearSecurePin().catch(() => {});
    this.setState({ lockEnabled: false, biometricEnabled: false, pinHash: null, locked: false });
  };
  toggleLock = () => {
    if (this.state.lockEnabled) this.disableLock();
    else this.startSetPin();
  };
  toggleBiometric = async () => {
    if (this.state.biometricEnabled) { this.setState({ biometricEnabled: false }); return; }
    if (!this.state.bioAvailable) { this.flash("Qurilmada barmoq izi sozlanmagan"); return; }
    const ok = await biometricAuth('Barmoq izini tasdiqlang');
    if (ok) { this.setState({ biometricEnabled: true }); this.flash('Barmoq izi yoqildi'); }
  };
  unlockWithPin = async (pin) => {
    let ok = await verifySecurePin(pin);           // yangi: SecureStore
    if (!ok && this.state.pinHash) {
      // legacy (eski statik-tuz) — muvaffaqiyatli bo'lsa SecureStore'ga ko'chiramiz
      ok = await verifyLegacyPin(pin, this.state.pinHash);
      if (ok) {
        const migrated = await setSecurePin(pin);
        if (migrated) this.setState({ pinHash: null });
      }
    }
    if (ok) this.setState({ locked: false });
    return ok;
  };
  unlockWithBiometric = async () => {
    if (!this.state.biometricEnabled) return false;
    const ok = await biometricAuth('Kirish uchun tasdiqlang');
    if (ok) this.setState({ locked: false });
    return ok;
  };
  forgotLogout = async () => {
    this.disableLock();
    try { await signOutUser(); } catch (e) { /* noop */ }
  };
  onDraftTitle = (v) => this.setState(s => ({ draft: { ...s.draft, title: v } }));
  pickAssignee = (id) => this.setState(s => ({ draft: { ...s.draft, assigneeId: id } }));
  pickCat = (c) => this.setState(s => ({ draft: { ...s.draft, category: c } }));
  pickDue = (d) => this.setState(s => ({ draft: { ...s.draft, due: d, dueDate: null } }));
  pickDueDate = (dateObj) => {
    const MO = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    const label = dateObj.getDate() + ' ' + MO[dateObj.getMonth()];
    this.setState(s => ({ draft: { ...s.draft, due: label, dueDate: dateObj } }));
  };
  pickType = (t) => this.setState(s => ({ draft: { ...s.draft, type: t } }));
  submitAssign = async () => {
    const ws = this.activeWs();
    if (!ws) { this.flash('Avval makon tanlang'); return; }
    if (!this.canIn(ws, CAP.ASSIGN_TASKS)) { this.flash("Vazifa yuborishga ruxsat yo'q"); return; }
    const d = this.state.draft;
    if (!d.assigneeId || !d.title.trim()) { this.flash("A'zo va nomni kiriting"); return; }
    const isR = d.type === 'eslatma';
    try {
      await addTask(this.uid, {
        workspaceId: ws.id, assigneeUserId: d.assigneeId, title: d.title.trim(),
        desc: d.category + (isR ? " bo'yicha eslatma." : " yo'nalishidagi vazifa.") + ' Muddat: ' + d.due + '.',
        cat: d.category, due: d.due, type: d.type,
      });
      this.setState({ draft: { assigneeId: null, title: '', category: 'Namoz', due: 'Bugun', dueDate: null, type: 'vazifa' }, overlay: null, tab: 'jamoa' });
      this.flash(isR ? 'Eslatma yuborildi ✓' : 'Vazifa yuborildi ✓');
    } catch (e) { this.flash('Vazifa yuborilmadi'); }
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
    const me = this.uid;
    const now = new Date(S.now);
    const coords = this.effCoords();
    const cityName = this.effCity();
    const madhab = S.madhab;
    const madhabName = (MADHABS.find(m => m.key === madhab) || MADHABS[0]).name;
    const wd = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const mo = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
    const gregDate = now.getDate() + ' ' + mo[now.getMonth()] + ' · ' + wd[now.getDay()];
    const h = now.getHours();
    const greet = h >= 5 && h < 11 ? 'Xayrli tong' : h >= 11 && h < 17 ? 'Xayrli kun' : h >= 17 && h < 22 ? 'Xayrli kech' : 'Xayrli tun';

    const list = prayerList(coords, now, madhab);
    const nextP = nextPrayer(coords, now, madhab);
    const curP = currentPrayer(coords, now, madhab);
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

    const booted = !!S.fbUser;
    const ud = S.userDoc || {};
    const isChild = isMinorAge(ud.birthYear, now);
    const accName = (ud.name || (S.fbUser && S.fbUser.displayName) || 'Foydalanuvchi').trim() || 'Foydalanuvchi';
    const acc = { name: accName, email: ud.email || (S.fbUser && S.fbUser.email) || '', birthYear: ud.birthYear || null, isChild };
    const first = accName.split(' ')[0], last = accName.split(' ').slice(1).join(' ');
    const meUser = { id: me, name: accName, color: ud.photoColor || C.gold };
    const userById = id => id === me ? meUser : (S.usersCache[id] || { id, name: 'Foydalanuvchi', color: C.gold });

    // ——— faol makon ———
    const activeWs = S.activeWorkspaceId ? S.myWorkspaces[S.activeWorkspaceId] : null;
    const isShaxsiy = !activeWs;
    const wsType = activeWs ? activeWs.type : 'shaxsiy';
    const myMem = activeWs ? S.myMemberships.find(m => m.workspaceId === activeWs.id) : null;
    const isOwner = !!activeWs && activeWs.ownerUserId === me;
    const can = (cap) => isOwner || (!!myMem && (myMem.permissions || []).includes(cap));
    const canManage = !!activeWs && (isOwner || can(CAP.VIEW_BOARD));
    const isChildTeam = !!activeWs && !isOwner && !can(CAP.VIEW_BOARD);

    const modeLabel = activeWs ? activeWs.name : 'Shaxsiy';
    const roleLabel = activeWs ? WS_TYPES[wsType].label : 'Shaxsiy';
    const membersLabel = activeWs ? WS_TYPES[wsType].membersLabel : "A'zolar";
    const jamoaSub = activeWs ? WS_TYPES[wsType].sub : 'Shaxsiy makon';

    const wsTasks = activeWs ? S.activeTasks : [];
    const memTasksOf = uid => wsTasks.filter(t => t.assigneeUserId === uid);
    const wsMembers = activeWs ? S.activeMembers.filter(m => m.userId !== me) : [];

    const members = wsMembers.map(mem => {
      const u = userById(mem.userId);
      const ts = memTasksOf(mem.userId), done = ts.filter(t => t.status === 'bajarildi').length, pct = ts.length ? Math.round(done / ts.length * 100) : 0;
      return {
        id: u.id, name: u.name, initial: (u.name || '?')[0], color: u.color || C.gold, online: false,
        role: mem.role, isMgr: isManagerPerms(mem.permissions || []),
        label: (wsType === 'talim' && mem.group) ? (mem.role + ' · ' + mem.group) : mem.role,
        doneCount: done, totalCount: ts.length, pct, onOpen: () => this.selectMember(mem.userId),
      };
    });

    const managed = activeWs ? wsTasks.filter(t => t.assignerUserId === me) : [];
    const board = {
      send: managed.filter(t => t.status === 'yuborildi').length,
      prog: managed.filter(t => t.status === 'qabul' || t.status === 'bajarilmoqda').length,
      done: managed.filter(t => t.status === 'bajarildi').length,
    };
    board.total = managed.length;
    board.pct = board.total ? Math.round(board.done / board.total * 100) : 0;

    const wsNameOf = wid => (S.myWorkspaces[wid] || {}).name || '';
    const taskCard = t => {
      const assignee = userById(t.assigneeUserId);
      return {
        id: t.id, title: t.title, cat: t.cat, due: t.due,
        statusMeta: STATUS_META[t.status] || STATUS_META.yuborildi,
        type: t.type, isReminder: t.type === 'eslatma',
        assigneeName: assignee.name, assigneeInitial: (assignee.name || '?')[0], assigneeColor: assignee.color || C.gold,
        wsLabel: wsNameOf(t.workspaceId), onOpen: () => this.selectTask(t.id),
      };
    };
    const jamoaTasks = managed.map(taskCard);

    // Global inbox
    const myAll = S.inboxTasks;
    const myTotal = myAll.length;
    const myDone = myAll.filter(t => t.status === 'bajarildi').length;
    const myPct = myTotal ? Math.round(myDone / myTotal * 100) : 0;
    const myTasks = myAll.map(t => {
      const isR = t.type === 'eslatma';
      const assigner = userById(t.assignerUserId);
      return {
        id: t.id, title: t.title, desc: t.desc, cat: t.cat, due: t.due, type: t.type,
        statusMeta: STATUS_META[t.status] || STATUS_META.yuborildi,
        assignerName: t.assignerUserId === me ? 'Men' : assigner.name,
        wsLabel: wsNameOf(t.workspaceId),
        isReminder: isR, notDone: t.status !== 'bajarildi',
        isPending: !isR && t.status === 'yuborildi', canStart: !isR && t.status === 'qabul', canComplete: !isR && t.status === 'bajarilmoqda',
        onOpen: () => this.selectTask(t.id),
        onAccept: () => this.setStatus(t.id, 'qabul'), onReject: () => this.setStatus(t.id, 'rad'),
        onStart: () => this.setStatus(t.id, 'bajarilmoqda'), onComplete: () => this.setStatus(t.id, 'bajarildi'),
      };
    });

    let selMemberObj = null;
    if (S.selMember && activeWs) {
      const mem = S.activeMembers.find(m => m.userId === S.selMember);
      if (mem) {
        const u = userById(mem.userId);
        const ts = memTasksOf(mem.userId), done = ts.filter(t => t.status === 'bajarildi').length, tot = ts.length;
        selMemberObj = {
          name: u.name, initial: (u.name || '?')[0], color: u.color || C.gold, role: mem.role,
          label: (wsType === 'talim' && mem.group) ? (mem.role + ' · ' + mem.group) : mem.role,
          doneCount: done, totalCount: tot, pct: tot ? Math.round(done / tot * 100) : 0,
          canEditRole: this.canIn(activeWs, CAP.MANAGE_MEMBERS),
          roleChips: roleOptionsFor(wsType).map(r => ({ name: r, active: r === mem.role, onPick: () => this.setMemberRole(activeWs, u.id, r) })),
          tasks: ts.map(taskCard),
          onAssign: () => this.setState(s => ({ draft: { ...s.draft, assigneeId: u.id }, overlay: 'assign' })),
        };
      }
    }

    let selTaskObj = null;
    if (S.selTask) {
      const t = S.activeTasks.find(x => x.id === S.selTask) || S.inboxTasks.find(x => x.id === S.selTask);
      if (t) {
        const isR = t.type === 'eslatma';
        const isAssignee = t.assigneeUserId === me;
        const tws = S.myWorkspaces[t.workspaceId];
        const canBoard = !!tws && (tws.ownerUserId === me || ((this.myMembershipOf(tws.id) || {}).permissions || []).includes(CAP.VIEW_BOARD));
        const isManagerOfTask = t.assignerUserId === me || canBoard;
        const assignee = userById(t.assigneeUserId), assigner = userById(t.assignerUserId);
        selTaskObj = {
          title: t.title, desc: t.desc, due: t.due, cat: t.cat, type: t.type,
          statusMeta: STATUS_META[t.status] || STATUS_META.yuborildi,
          assigneeName: assignee.name, assigneeInitial: (assignee.name || '?')[0], assigneeColor: assignee.color || C.gold,
          assignerName: t.assignerUserId === me ? 'Men (siz)' : assigner.name,
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

    const qibla = { bearing: Math.round(qiblaBearing(coords)), cityName, locStatus: S.locStatus };

    // Sozlamalar tanlov ro'yxatlari (mazhab / shahar)
    const madhabPicker = {
      title: t('Hisoblash usuli'),
      note: t('Mazhab Asr namozi vaqtiga ta’sir qiladi.'),
      options: MADHABS.map(m => ({
        label: t(m.name),
        sub: m.key === 'hanafi' ? t("Asr — soya 2 barobar (O'zbekistonda keng tarqalgan)") : t('Asr — soya 1 barobar'),
        active: madhab === m.key,
        onPick: () => this.setMadhab(m.key),
      })),
    };
    const cityPicker = {
      title: t('Joylashuv'),
      note: t('Namoz vaqtlari tanlangan shaharga moslanadi.'),
      options: [
        {
          label: t('Avtomatik (GPS)'),
          sub: S.locStatus === 'granted' ? `${t('Aniqlangan')}: ${t(S.cityName)}` : t('Joylashuvdan aniqlash'),
          active: !S.manualCity,
          onPick: () => this.setManualCity(null),
        },
        ...CITIES.map(c => ({
          label: t(c.name),
          active: !!S.manualCity && S.manualCity.name === c.name,
          onPick: () => this.setManualCity(c),
        })),
      ],
    };
    const langName = (LANGS.find(l => l.key === S.lang) || LANGS[0]).name;
    const langPicker = {
      title: t('Til'),
      note: t("Ilova tili. Kirill — matnlar avtomatik o'giriladi."),
      options: LANGS.map(l => ({ label: l.name, active: S.lang === l.key, onPick: () => this.setAppLang(l.key) })),
    };
    const THEME_OPTS = [{ key: 'dark', name: t("To'q yashil") }, { key: 'light', name: t("Yorug'") }];
    const themeName = (THEME_OPTS.find(o => o.key === S.theme) || THEME_OPTS[0]).name;
    const themePicker = {
      title: t('Mavzu'),
      note: t('Ilova ko’rinishi.'),
      options: THEME_OPTS.map(o => ({
        label: o.name,
        sub: o.key === 'dark' ? t('Standart — to‘q yashil') : t('Yorug‘ — issiq krem'),
        active: S.theme === o.key,
        onPick: () => this.setTheme(o.key),
      })),
    };

    const cats = ['Namoz', "Qur'on", 'Dars', 'Imtihon', 'Ish', 'Sadaqa'];
    const dues = ['Bugun', 'Ertaga', 'Bu hafta', 'Juma'];
    const assignMembers = members.map(m => ({ id: m.id, name: m.name, color: m.color, active: S.draft.assigneeId === m.id, onPick: () => this.pickAssignee(m.id) }));
    const catChips = cats.map(c => ({ name: c, active: S.draft.category === c, onPick: () => this.pickCat(c) }));
    const dueChips = dues.map(d => ({ name: d, active: S.draft.due === d && !S.draft.dueDate, onPick: () => this.pickDue(d) }));
    const typeChips = [{ k: 'vazifa', name: 'Vazifa' }, { k: 'eslatma', name: 'Eslatma' }].map(x => ({ ...x, active: S.draft.type === x.k, onPick: () => this.pickType(x.k) }));

    // Makon almashtirish varag'i
    const myWorkspaces = S.myMemberships
      .map(mem => {
        const w = S.myWorkspaces[mem.workspaceId];
        if (!w) return null;
        return { id: w.id, name: w.name, type: w.type, typeLabel: WS_TYPES[w.type].label, role: mem.role, active: w.id === S.activeWorkspaceId, onSelect: () => this.setActiveWorkspace(w.id) };
      })
      .filter(Boolean);
    const wsTypeChips = [{ k: 'oila', name: 'Oila' }, { k: 'talim', name: "Ta'lim" }, { k: 'ishxona', name: 'Ishxona' }]
      .map(x => ({ ...x, active: S.wsDraft.type === x.k, onPick: () => this.pickWsType(x.k) }));

    // Taklif (invite) — faol makon kodi
    const inviteCode = activeWs ? activeWs.code : '';

    return {
      authReady: S.authReady, booted, showOnboarding: S.authReady && !S.fbUser,
      authMode: S.authMode, authForm: S.authForm, authBusy: S.authBusy,
      setAuthMode: { signin: () => this.setAuthMode('signin'), signup: () => this.setAuthMode('signup') },
      onAuthField: {
        name: (v) => this.onAuthField('name', v), email: (v) => this.onAuthField('email', v),
        password: (v) => this.onAuthField('password', v), birthYear: (v) => this.onAuthField('birthYear', v),
      },
      submitAuth: this.submitAuth,
      googleEnabled: googleConfigured, googleBusy: S.googleBusy, googleReady: S.googleReady,
      startGoogle: this.startGoogle,
      greet, meName: first, meLast: last, meInitial: (first[0] || 'F'),
      meRole: isChild ? 'Farzand' : (activeWs ? (myMem ? myMem.role : '—') : 'Shaxsiy'),
      cityName, locStatus: S.locStatus, account: acc, isChild, mode: wsType, modeLabel, canManage,
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
      dueDate: S.draft.dueDate, onPickDueDate: this.pickDueDate,
      onDraftTitle: this.onDraftTitle, onSubmitAssign: this.submitAssign,
      // taklif
      inviteCode, canInvite: this.canIn(activeWs, CAP.MANAGE_MEMBERS),
      // QR skaner
      canScan: (this._canScan === undefined ? (this._canScan = cameraAvailable()) : this._canScan),
      openScan: this.openScan, onScanned: this.onScanned,
      settings: S.settings,
      toggleSetting: { namoz: () => this.toggleSetting('namoz'), azon: () => this.toggleSetting('azon'), zikr: () => this.toggleSetting('zikr'), jamoa: () => this.toggleSetting('jamoa') },
      // Sozlamalar tanlovlari
      madhabName, isManualCity: !!S.manualCity, langName,
      openMadhab: () => this.openPicker('madhab'), openCity: () => this.openPicker('city'), openLang: () => this.openPicker('lang'), openTheme: () => this.openPicker('theme'),
      madhabPicker, cityPicker, langPicker, themePicker, themeName,
      // Qulf + ulashish
      lockEnabled: S.lockEnabled, biometricEnabled: S.biometricEnabled, bioAvailable: S.bioAvailable,
      locked: S.locked, pinSetup: S.pinSetup,
      toggleLock: this.toggleLock, toggleBiometric: this.toggleBiometric, changePin: this.startSetPin,
      shareApp: this.shareApp,
      tab: S.tab,
      go: { bugun: () => this.go('bugun'), namoz: () => this.go('namoz'), reja: () => this.go('reja'), jamoa: () => this.go('jamoa'), profil: () => this.go('profil') },
      open: { tasbeh: () => this.openOv('tasbeh'), qibla: () => this.openOv('qibla'), stats: () => this.openOv('stats'), habits: () => this.openOv('habits'), settings: () => this.openOv('settings'), assign: () => this.openOv('assign'), addmember: () => this.openOv('addmember'), workspace: () => this.openOv('workspace') },
      ov: { tasbeh: S.overlay === 'tasbeh', qibla: S.overlay === 'qibla', stats: S.overlay === 'stats', habits: S.overlay === 'habits', settings: S.overlay === 'settings', member: S.overlay === 'member', task: S.overlay === 'task', assign: S.overlay === 'assign', addmember: S.overlay === 'addmember', workspace: S.overlay === 'workspace', madhab: S.overlay === 'madhab', city: S.overlay === 'city', lang: S.overlay === 'lang', theme: S.overlay === 'theme', scanqr: S.overlay === 'scanqr' },
      // makon boshqaruvi
      myWorkspaces, shaxsiyActive: isShaxsiy, onSelectShaxsiy: () => this.setActiveWorkspace(null),
      wsDraft: S.wsDraft, wsTypeChips, onWsName: this.onWsName, createWorkspace: this.createWorkspace,
      joinCode: S.joinCode, onJoinCode: this.onJoinCode, submitJoin: this.submitJoin, joinBusy: S.joinBusy,
      showIsh: !isChild,
      close: this.closeOv, setScroll: this.setScroll,
      logout: this.logout, flash: S.flash,
    };
  }

  render() {
    const CT = THEMES[this.state.theme] || THEMES.dark;
    if (!this.state.hydrated || !this.state.authReady) {
      return (
        <LinearGradient colors={CT.bg} locations={[0, 0.62, 1]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={CT.gold} size="large" />
        </LinearGradient>
      );
    }
    const v = this.vals();
    return (
      <ThemeProvider value={CT}>
      <LinearGradient colors={CT.bg} locations={[0, 0.62, 1]} style={{ flex: 1 }}>
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

        {/* Status-bar scrim: tab ekranlar tepasida — overlaylar ustidan chizilmasin
            (shu bois overlaylardan OLDIN, zIndex'siz render qilinadi) */}
        {Platform.OS === 'android' && !!StatusBar.currentHeight && (
          <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: StatusBar.currentHeight, backgroundColor: CT.scrim }} />
        )}

        {v.showOnboarding && <Onboarding v={v} />}

        {v.ov.tasbeh && <TasbehOverlay v={v} />}
        {v.ov.qibla && <QiblaOverlay v={v} />}
        {v.ov.stats && <StatsOverlay v={v} />}
        {v.ov.habits && <HabitsOverlay v={v} />}
        {v.ov.settings && <SettingsOverlay v={v} />}
        {v.ov.madhab && <PickerOverlay picker={v.madhabPicker} onClose={this.backToSettings} />}
        {v.ov.city && <PickerOverlay picker={v.cityPicker} onClose={this.backToSettings} />}
        {v.ov.lang && <PickerOverlay picker={v.langPicker} onClose={this.backToSettings} />}
        {v.ov.theme && <PickerOverlay picker={v.themePicker} onClose={this.backToSettings} />}
        {v.ov.member && v.selMemberObj && <MemberOverlay v={v} />}
        {v.ov.task && v.selTaskObj && <TaskOverlay v={v} />}
        {v.ov.assign && <AssignOverlay v={v} />}
        {v.ov.addmember && <AddMemberOverlay v={v} />}
        {v.ov.workspace && <WorkspaceSheet v={v} />}
        {v.ov.scanqr && v.canScan && (() => { const ScanQROverlay = require('./overlays/ScanQR').default; return <ScanQROverlay v={v} />; })()}

        {!!v.flash && (
          <View pointerEvents="none" style={st.flash}>
            <Text style={st.flashText}>{v.flash}</Text>
          </View>
        )}

        {/* Yangi PIN o'rnatish oynasi (Sozlamalardan) */}
        {v.pinSetup && (
          <LockScreen mode="set" onSetPin={this.onSetPin} />
        )}
        {/* Qulf ekrani — hammasidan ustun */}
        {v.locked && v.booted && (
          <LockScreen
            mode="unlock"
            onUnlock={this.unlockWithPin}
            biometricEnabled={this.state.biometricEnabled}
            onBiometric={this.unlockWithBiometric}
            onForgot={this.forgotLogout}
          />
        )}
      </LinearGradient>
      </ThemeProvider>
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
  topScrim: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: '#0a1f18', zIndex: 60 },
});
