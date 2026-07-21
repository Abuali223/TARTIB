import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { F, useC } from '../theme';
import { OverlayShell } from '../components/ui';
import { ChevronDown } from '../components/icons';
import { t } from '../lib/i18n';
import {
  RECITERS, getSurahList, getSurah, getJuz, verseSource, downloadAyahs, isDownloaded,
} from '../lib/quran';

const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicNum = (n) => String(n).split('').map(d => AR_DIGITS[+d] || d).join('');

export default function QuranOverlay({ v }) {
  const C = useC();
  const st = mkSt(C);

  const [list, setList] = useState([]);              // 114 sura ro'yxati
  const [tab, setTab] = useState('surah');           // surah | juz
  const [sel, setSel] = useState(1);                 // sura yoki juz raqami
  const [data, setData] = useState(null);            // { ayahs, meta }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reciter, setReciter] = useState(RECITERS[0]);
  const [soya, setSoya] = useState(true);            // soyali rejim
  const [trShow, setTrShow] = useState(true);        // tarjima ko'rsatish
  const [picker, setPicker] = useState(null);        // null | surah | juz | reciter
  const [playing, setPlaying] = useState(false);
  const [curIdx, setCurIdx] = useState(-1);
  const [dl, setDl] = useState({ on: false, done: 0, total: 0, ok: false });

  const soundRef = useRef(null);
  const ayahsRef = useRef([]);
  const reciterRef = useRef(reciter);
  const stopRef = useRef(false);
  useEffect(() => { reciterRef.current = reciter; }, [reciter]);

  useEffect(() => {
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: true }).catch(() => {});
    getSurahList().then(setList).catch(() => {});
    return () => { stopRef.current = true; unloadSound(); };
  }, []);

  // Tanlangan sura/juz matnini yuklash
  useEffect(() => {
    let alive = true;
    (async () => {
      await stopPlay();
      setLoading(true); setError(false);
      try {
        const d = tab === 'surah' ? await getSurah(sel) : await getJuz(sel);
        if (!alive) return;
        ayahsRef.current = d.ayahs || [];
        setData(d);
        setDl({ on: false, done: 0, total: 0, ok: isDownloaded(reciter.folder, d.ayahs) });
      } catch (e) { if (alive) setError(true); }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [tab, sel]);

  // Qori o'zgarsa — yuklab olinganini qayta tekshirish
  useEffect(() => {
    if (data) setDl(x => ({ ...x, ok: isDownloaded(reciter.folder, data.ayahs) }));
  }, [reciter]);

  async function unloadSound() {
    const s = soundRef.current; soundRef.current = null;
    if (s) { try { await s.stopAsync(); } catch (e) {} try { await s.unloadAsync(); } catch (e) {} }
  }
  async function stopPlay() { stopRef.current = true; await unloadSound(); setPlaying(false); setCurIdx(-1); }

  async function playSeq(idx) {
    await unloadSound();
    if (stopRef.current) return;
    const ay = ayahsRef.current;
    if (idx < 0 || idx >= ay.length) { setPlaying(false); setCurIdx(-1); return; }
    setCurIdx(idx);
    const a = ay[idx];
    try {
      const src = verseSource(reciterRef.current.folder, a.surah, a.n);
      const { sound } = await Audio.Sound.createAsync(
        { uri: src }, { shouldPlay: true },
        (s) => { if (s.didJustFinish) playSeq(idx + 1); },
      );
      if (stopRef.current) { try { await sound.unloadAsync(); } catch (e) {} return; }
      soundRef.current = sound;
    } catch (e) { playSeq(idx + 1); }  // bu oyat tushmasa — keyingisiga
  }

  const togglePlay = async () => {
    if (playing) { await stopPlay(); return; }
    if (!ayahsRef.current.length) return;
    stopRef.current = false; setPlaying(true);
    playSeq(curIdx >= 0 ? curIdx : 0);
  };

  const doDownload = async () => {
    if (dl.on || !data) return;
    setDl({ on: true, done: 0, total: data.ayahs.length, ok: false });
    try {
      await downloadAyahs(reciter.folder, data.ayahs, (done, total) => setDl(x => ({ ...x, done, total })));
      setDl({ on: false, done: data.ayahs.length, total: data.ayahs.length, ok: true });
    } catch (e) {
      setDl({ on: false, done: 0, total: 0, ok: false });
    }
  };

  const selName = tab === 'surah'
    ? (list.find(s => s.n === sel)?.en || `Sura ${sel}`)
    : `${sel}-pora`;
  const meta = data && tab === 'surah'
    ? `${data.en || ''} · ${data.type === 'Meccan' ? 'Makkiy' : 'Madaniy'} · ${data.ayahs.length} oyat`
    : (data ? `${data.ayahs.length} oyat` : '');

  return (
    <OverlayShell title={t('Qur‘on')} onClose={() => { stopPlay(); v.close(); }}>
      <View style={{ flex: 1 }}>
        {/* Boshqaruv paneli */}
        <View style={st.bar}>
          <View style={st.tabs}>
            <Chip label={t('Sura')} active={tab === 'surah'} onPress={() => { setTab('surah'); setSel(1); }} C={C} st={st} />
            <Chip label={t('Pora')} active={tab === 'juz'} onPress={() => { setTab('juz'); setSel(1); }} C={C} st={st} />
          </View>
          <TouchableOpacity style={st.sel} activeOpacity={0.8} onPress={() => setPicker(tab)}>
            <Text numberOfLines={1} style={st.selT}>{selName}</Text><ChevronDown />
          </TouchableOpacity>
        </View>

        <View style={st.bar2}>
          <TouchableOpacity style={st.reciter} activeOpacity={0.8} onPress={() => setPicker('reciter')}>
            <Text style={st.reciterLbl}>{t('Qori')}</Text>
            <Text numberOfLines={1} style={st.reciterT}>{reciter.name}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.iconBtn, playing && st.iconBtnOn]} activeOpacity={0.85} onPress={togglePlay}
            accessibilityRole="button" accessibilityLabel={playing ? t('To‘xtatish') : t('Tinglash')}>
            <Text style={[st.iconBtnT, playing && { color: C.ink }]}>{playing ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.iconBtn} activeOpacity={0.85} onPress={doDownload} disabled={dl.on || dl.ok}
            accessibilityRole="button" accessibilityLabel={t('Yuklab olish')}>
            {dl.on
              ? <Text style={st.dlT}>{Math.round((dl.done / Math.max(1, dl.total)) * 100)}%</Text>
              : <Text style={[st.iconBtnT, dl.ok && { color: C.emerald }]}>{dl.ok ? '✓' : '⤓'}</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[st.iconBtn, trShow && st.iconBtnOn]} activeOpacity={0.85} onPress={() => setTrShow(s => !s)}
            accessibilityRole="button" accessibilityLabel={t('Tarjima')}>
            <Text style={[st.iconBtnUz, trShow && { color: C.ink }]}>Uz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[st.iconBtn, soya && st.iconBtnOn]} activeOpacity={0.85} onPress={() => setSoya(s => !s)}
            accessibilityRole="button" accessibilityLabel={t('Soyali rejim')}>
            <Text style={[st.iconBtnT, soya && { color: C.ink }]}>☾</Text>
          </TouchableOpacity>
        </View>

        {/* Sarlavha */}
        {data && (
          <View style={st.head}>
            <Text style={st.headAr}>{tab === 'surah' ? data.name : selName}</Text>
            {!!meta && <Text style={st.headSub}>{meta}</Text>}
          </View>
        )}

        {/* Matn */}
        {loading ? (
          <View style={st.center}><ActivityIndicator color={C.gold} size="large" /><Text style={st.msg}>{t('Yuklanmoqda…')}</Text></View>
        ) : error ? (
          <View style={st.center}>
            <Text style={st.msg}>{t('Matnni yuklab bo‘lmadi. Internetni tekshiring.')}</Text>
            <TouchableOpacity onPress={() => setSel(s => s)} style={st.retry}><Text style={st.retryT}>{t('Qaytadan')}</Text></TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
            <View style={st.paper}>
              {trShow ? (
                (data?.ayahs || []).map((a, i) => {
                  const dim = soya && curIdx !== i;
                  const isCur = curIdx === i;
                  const col = isCur ? C_INK_ACTIVE : (dim ? C_INK_DIM : C_INK);
                  return (
                    <TouchableOpacity key={i} activeOpacity={0.7}
                      onPress={() => { stopRef.current = false; setPlaying(true); playSeq(i); }}
                      style={[st.vBlock, i > 0 && st.vDivider, isCur && st.vBlockOn]}>
                      <Text style={[st.arabicV, { color: col }]}>
                        {a.text} <Text style={st.ayahNum}>﴿{toArabicNum(a.n)}﴾</Text>
                      </Text>
                      {!!a.tr && <Text style={[st.tr, { opacity: dim ? 0.5 : 1 }]}>{a.n}. {a.tr}</Text>}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={st.arabic}>
                  {(data?.ayahs || []).map((a, i) => {
                    const dim = soya && curIdx !== i;
                    const isCur = curIdx === i;
                    return (
                      <Text key={i} onPress={() => { stopRef.current = false; setPlaying(true); playSeq(i); }}
                        style={{ color: isCur ? C_INK_ACTIVE : (dim ? C_INK_DIM : C_INK) }}>
                        {a.text}
                        <Text style={st.ayahNum}> ﴿{toArabicNum(a.n)}﴾ </Text>
                      </Text>
                    );
                  })}
                </Text>
              )}
            </View>
          </ScrollView>
        )}

        {/* Tanlash oynasi */}
        {picker && (
          <Pressable style={st.pickBackdrop} onPress={() => setPicker(null)}>
            <Pressable style={st.pickSheet} onPress={() => {}}>
              <Text style={st.pickTitle}>
                {picker === 'surah' ? t('Surani tanlang') : picker === 'juz' ? t('Porani tanlang') : t('Qorini tanlang')}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                {picker === 'reciter' && RECITERS.map(r => (
                  <PickRow key={r.id} label={r.name} active={r.id === reciter.id}
                    onPress={() => { setReciter(r); setPicker(null); }} C={C} st={st} />
                ))}
                {picker === 'surah' && list.map(s => (
                  <PickRow key={s.n} label={`${s.n}. ${s.en}`} right={s.name} active={s.n === sel}
                    onPress={() => { setSel(s.n); setPicker(null); }} C={C} st={st} />
                ))}
                {picker === 'juz' && Array.from({ length: 30 }, (_, i) => i + 1).map(j => (
                  <PickRow key={j} label={`${j}-pora`} active={j === sel}
                    onPress={() => { setSel(j); setPicker(null); }} C={C} st={st} />
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        )}
      </View>
    </OverlayShell>
  );
}

// Qog'oz (cream) ustidagi matn ranglari — soya/current
const C_INK = '#1C3A32';
const C_INK_DIM = 'rgba(28,58,50,0.32)';
const C_INK_ACTIVE = '#0C2A22';

function Chip({ label, active, onPress, C, st }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[st.chip, active && st.chipOn]}>
      <Text style={[st.chipT, active && { color: C.ink }]}>{label}</Text>
    </TouchableOpacity>
  );
}
function PickRow({ label, right, active, onPress, C, st }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[st.pickRow, active && st.pickRowOn]}>
      <Text style={[st.pickRowT, active && { color: C.gold }]}>{label}</Text>
      {!!right && <Text style={st.pickRowR}>{right}</Text>}
    </TouchableOpacity>
  );
}

const mkSt = (C) => StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  tabs: { flexDirection: 'row', gap: 6 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 11, backgroundColor: C.overlay1, borderWidth: 1, borderColor: C.hairline },
  chipOn: { backgroundColor: C.gold, borderColor: C.gold },
  chipT: { fontFamily: F.bold, fontSize: 13, color: C.sageMid },
  sel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  selT: { flex: 1, fontFamily: F.bold, fontSize: 14, color: C.cream },
  bar2: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 10 },
  reciter: { flex: 1, paddingVertical: 7, paddingHorizontal: 12, borderRadius: 12, backgroundColor: C.overlay1, borderWidth: 1, borderColor: C.hairline },
  reciterLbl: { fontFamily: F.regular, fontSize: 10, color: C.sage, letterSpacing: 0.5 },
  reciterT: { fontFamily: F.bold, fontSize: 13, color: C.gold, marginTop: 1 },
  iconBtn: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: C.overlay2, borderWidth: 1, borderColor: C.border },
  iconBtnOn: { backgroundColor: C.gold, borderColor: C.gold },
  iconBtnT: { fontSize: 18, color: C.cream },
  iconBtnUz: { fontFamily: F.extrabold, fontSize: 14, color: C.cream },
  dlT: { fontFamily: F.extrabold, fontSize: 12, color: C.gold },
  vBlock: { paddingVertical: 14 },
  vDivider: { borderTopWidth: 1, borderTopColor: 'rgba(28,58,50,0.12)' },
  vBlockOn: { backgroundColor: 'rgba(201,162,75,0.10)', borderRadius: 12, marginHorizontal: -8, paddingHorizontal: 8 },
  arabicV: { fontSize: 25, lineHeight: 48, textAlign: 'right', writingDirection: 'rtl' },
  tr: { fontFamily: F.regular, fontSize: 14.5, lineHeight: 22, color: '#3A5049', marginTop: 8, textAlign: 'left' },
  head: { alignItems: 'center', paddingVertical: 10, marginHorizontal: 16, borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  headAr: { fontFamily: F.serif, fontSize: 26, color: C.gold },
  headSub: { fontFamily: F.regular, fontSize: 12.5, color: C.sageMid, marginTop: 3 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 6 },
  msg: { fontFamily: F.regular, fontSize: 15, color: C.sageMid, textAlign: 'center', marginTop: 12, lineHeight: 22 },
  retry: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 13, backgroundColor: C.gold },
  retryT: { fontFamily: F.extrabold, fontSize: 14, color: C.ink },
  paper: { backgroundColor: '#FCFAF4', borderRadius: 18, padding: 22, borderWidth: 1, borderColor: 'rgba(238,194,113,0.4)' },
  arabic: { fontSize: 26, lineHeight: 52, textAlign: 'right', writingDirection: 'rtl' },
  ayahNum: { fontSize: 20, color: '#C9A24B' },
  pickBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,12,8,0.6)', justifyContent: 'flex-end' },
  pickSheet: { maxHeight: '72%', backgroundColor: C.sheet ? C.sheet[0] : C.bg[1], borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: C.border, paddingTop: 16, paddingHorizontal: 16, paddingBottom: 30 },
  pickTitle: { fontFamily: F.serif, fontSize: 19, color: C.cream, marginBottom: 12, marginHorizontal: 4 },
  pickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, marginBottom: 4 },
  pickRowOn: { backgroundColor: 'rgba(238,194,113,0.12)' },
  pickRowT: { fontFamily: F.bold, fontSize: 15, color: C.cream },
  pickRowR: { fontFamily: F.serif, fontSize: 18, color: C.sageMid },
});
