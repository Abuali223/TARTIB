import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../theme';
import { FadeIn } from '../components/ui';
import { ChevronRight, CompassIcon } from '../components/icons';

export default function Namoz({ v }) {
  return (
    <FadeIn style={st.wrap}>
      <Text style={st.h2}>Namoz vaqtlari</Text>
      <Text style={st.sub}>{v.cityName} · {v.gregDate}</Text>
      {v.locStatus === 'denied' && (
        <Text style={st.locWarn}>Joylashuvga ruxsat berilmadi — vaqtlar {v.cityName} bo'yicha taxminiy hisoblanmoqda</Text>
      )}

      <LinearGradient colors={['#14402f', '#0b2a1f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.countCard}>
        <Text style={st.kicker}>{v.next.name.toUpperCase()} NAMOZIGACHA</Text>
        <Text style={st.countdown}>{v.next.countdown}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sageMid }}>Hozir: {v.curName} vaqti</Text>
      </LinearGradient>

      <View style={st.listCard}>
        {v.prayers.map((p, i) => (
          <View key={i} style={[st.row, p.isNext && st.rowNext]}>
            <View style={[st.dot, { backgroundColor: p.info ? C.sageDim : p.passed ? C.emerald : p.isNext ? C.gold : C.sageDim, opacity: p.info ? 0.5 : 1 }]} />
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: p.info ? C.sage : C.cream }}>{p.name}</Text>
              <Text style={{ fontFamily: F.arabic, fontSize: 15, color: C.sageFaint }}>{p.ar}</Text>
            </View>
            <Text style={{
              fontFamily: p.isNext ? F.extrabold : F.semibold, fontSize: 16,
              color: p.isNext ? C.gold : p.info ? C.sage : C.cream, fontVariant: ['tabular-nums'],
            }}>{p.time}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity onPress={v.open.qibla} activeOpacity={0.85} style={st.qiblaBtn}>
        <View style={st.qiblaIcon}><CompassIcon size={26} dot={false} /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.cream }}>Qibla kompas</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sage, marginTop: 2 }}>Ka'ba yo'nalishini toping</Text>
        </View>
        <ChevronRight />
      </TouchableOpacity>
    </FadeIn>
  );
}

const st = StyleSheet.create({
  wrap: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28 },
  h2: { fontFamily: F.serif, fontSize: 30, color: C.cream, marginBottom: 6 },
  sub: { fontFamily: F.regular, fontSize: 14, color: C.sage, marginBottom: 20 },
  locWarn: { fontFamily: F.regular, fontSize: 12, color: C.amber, marginTop: -12, marginBottom: 16 },
  countCard: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(217,179,106,0.22)', padding: 20, marginBottom: 18, alignItems: 'center' },
  kicker: { fontFamily: F.regular, fontSize: 11, color: C.sage, letterSpacing: 1.1 },
  countdown: { fontFamily: F.extrabold, fontSize: 40, color: C.gold, marginTop: 6, marginBottom: 2, fontVariant: ['tabular-nums'] },
  listCard: { borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 8, marginBottom: 18 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 14, marginBottom: 2, borderWidth: 1, borderColor: 'transparent',
  },
  rowNext: { backgroundColor: 'rgba(217,179,106,0.12)', borderColor: 'rgba(217,179,106,0.35)' },
  dot: { width: 9, height: 9, borderRadius: 5 },
  qiblaBtn: {
    borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    padding: 18, flexDirection: 'row', alignItems: 'center', gap: 15,
  },
  qiblaIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(67,192,141,0.14)', alignItems: 'center', justifyContent: 'center' },
});
