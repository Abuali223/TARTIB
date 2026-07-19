import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { F, useC } from '../theme';
import { LogoMark } from '../components/icons';
import { t } from '../lib/i18n';

const LEN = 4;

// mode: 'unlock' | 'set'
// onUnlock(pin) -> Promise<bool> (noto'g'ri bo'lsa false — silkitadi)
// onSetPin(pin) -> void (ikki marta bir xil kiritilganda)
// biometricEnabled, onBiometric() -> Promise<bool>
// onForgot() -> chiqish (PIN esdan chiqsa)
export default function LockScreen({ mode = 'unlock', onUnlock, onSetPin, biometricEnabled, onBiometric, onForgot }) {
  const C = useC();
  const st = mkSt(C);
  const [entered, setEntered] = useState('');
  const [step, setStep] = useState('enter');   // set rejimi: enter -> confirm
  const [firstPin, setFirstPin] = useState('');
  const [err, setErr] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [remain, setRemain] = useState(0);      // cooldown soniyalari
  const shake = useRef(new Animated.Value(0)).current;

  // Cooldown taymeri
  useEffect(() => {
    if (remain <= 0) return;
    const id = setInterval(() => setRemain(r => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remain > 0]);

  // Ketma-ket xato urinishlar → kutish (brute-force'ga qarshi)
  const coolFor = (a) => (a >= 10 ? 300 : a >= 8 ? 120 : a >= 5 ? 30 : 0);

  const doShake = () => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const tryBiometric = async () => {
    if (mode !== 'unlock' || !biometricEnabled || !onBiometric) return;
    const ok = await onBiometric();
    if (ok) return; // ochiladi (parent hal qiladi)
  };

  useEffect(() => { tryBiometric(); }, []);

  const submit = async (pin) => {
    if (mode === 'unlock') {
      const ok = await onUnlock(pin);
      if (ok) { setAttempts(0); return; }   // ochildi
      const a = attempts + 1;
      setAttempts(a);
      setEntered('');
      doShake();
      const cd = coolFor(a);
      if (cd > 0) { setRemain(cd); setErr(''); }
      else setErr(t("Noto'g'ri PIN"));
    } else {
      if (step === 'enter') { setFirstPin(pin); setEntered(''); setStep('confirm'); setErr(''); }
      else {
        if (pin === firstPin) { onSetPin(pin); }
        else { setErr(t('PIN mos kelmadi, qaytadan')); setEntered(''); setFirstPin(''); setStep('enter'); doShake(); }
      }
    }
  };

  const press = (d) => {
    if (remain > 0) return;                 // kutish davomida bloklangan
    if (entered.length >= LEN) return;
    const next = entered + d;
    setEntered(next);
    setErr('');
    if (next.length === LEN) setTimeout(() => submit(next), 90);
  };
  const del = () => setEntered(e => e.slice(0, -1));

  const title = mode === 'set'
    ? (step === 'enter' ? t('Yangi PIN kiriting') : t('PIN’ni tasdiqlang'))
    : t('Ilova qulflangan');
  const sub = mode === 'set'
    ? t('4 xonali maxfiy kod')
    : t('Davom etish uchun PIN kiriting');

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={C.radialTop} locations={[0, 0.55, 1]} style={{ flex: 1 }}>
        <View style={st.wrap}>
          <View style={st.logo}><LogoMark size={64} /></View>
          <Text style={st.title}>{title}</Text>
          <Text style={[st.sub, remain > 0 && { color: C.red }]}>
            {remain > 0 ? t('Ko‘p urinish. {n} soniyadan keyin qayta urining').replace('{n}', String(remain)) : (err ? err : sub)}
          </Text>

          <Animated.View style={[st.dots, { transform: [{ translateX: shake }] }]}>
            {Array.from({ length: LEN }).map((_, i) => (
              <View key={i} style={[st.dot, i < entered.length && st.dotOn, !!err && { borderColor: C.red }]} />
            ))}
          </Animated.View>

          <View style={[st.pad, remain > 0 && { opacity: 0.4 }]} pointerEvents={remain > 0 ? 'none' : 'auto'}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
              <TouchableOpacity key={d} onPress={() => press(d)} activeOpacity={0.6} style={st.key}>
                <Text style={st.keyT}>{d}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={mode === 'unlock' && biometricEnabled ? tryBiometric : undefined}
              activeOpacity={mode === 'unlock' && biometricEnabled ? 0.6 : 1}
              style={st.key}>
              {mode === 'unlock' && biometricEnabled ? <Text style={st.bio}>☝</Text> : null}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => press('0')} activeOpacity={0.6} style={st.key}>
              <Text style={st.keyT}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={del} activeOpacity={0.6} style={st.key}>
              <Text style={st.del}>⌫</Text>
            </TouchableOpacity>
          </View>

          {mode === 'unlock' && onForgot && (
            <TouchableOpacity onPress={onForgot} activeOpacity={0.7} style={{ marginTop: 22 }}>
              <Text style={st.forgot}>{t('PIN esdan chiqdimi? Hisobdan chiqish')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const mkSt = (C) => StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingBottom: 20 },
  logo: { marginBottom: 20, opacity: 0.95 },
  title: { fontFamily: F.serif, fontSize: 24, color: C.cream, textAlign: 'center' },
  sub: { fontFamily: F.regular, fontSize: 14, color: C.sageMid, marginTop: 8, marginBottom: 26, textAlign: 'center', minHeight: 20 },
  dots: { flexDirection: 'row', gap: 18, marginBottom: 38 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: 'rgba(217,179,106,0.5)' },
  dotOn: { backgroundColor: C.gold, borderColor: C.gold },
  pad: { width: 260, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  key: {
    width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.overlay2, borderWidth: 1, borderColor: C.overlay3,
  },
  keyT: { fontFamily: F.semibold, fontSize: 28, color: C.cream },
  del: { fontFamily: F.regular, fontSize: 24, color: C.sageMid },
  bio: { fontSize: 30, color: C.gold },
  forgot: { fontFamily: F.regular, fontSize: 13, color: C.sageFaint, textDecorationLine: 'underline' },
});
