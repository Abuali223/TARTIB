import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C, F } from '../theme';
import { OverlayShell, ProgressRing } from '../components/ui';

function PulsingCount({ count }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.14, duration: 120, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [count]);
  return (
    <Animated.Text style={{ fontFamily: F.extrabold, fontSize: 66, color: C.cream, transform: [{ scale }] }}>
      {count}
    </Animated.Text>
  );
}

export default function TasbehOverlay({ v }) {
  const t = v.tasbeh;
  return (
    <OverlayShell title="Tasbeh" onClose={v.close} radial>
      <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
          {t.dhikrs.map((d, i) => (
            <TouchableOpacity key={i} onPress={d.onPick} activeOpacity={0.8}
              style={[st.dhikrChip, d.active && st.dhikrChipActive]}>
              <Text style={{ fontFamily: F.bold, fontSize: 13, color: d.active ? C.gold : C.sage }}>{d.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontFamily: F.arabic, fontSize: 34, color: C.gold, textAlign: 'center', marginBottom: 2 }}>{t.ar}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sage, marginBottom: 6 }}>{t.tr}</Text>

        <TouchableOpacity onPress={t.onTap} activeOpacity={0.9} style={{ marginVertical: 10 }}>
          <ProgressRing size={250} strokeWidth={6} progress={t.progress}>
            <PulsingCount count={t.count} />
            <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.sage, marginTop: 6 }}>/ {t.target}</Text>
          </ProgressRing>
        </TouchableOpacity>

        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sageMid, marginBottom: 18 }}>
          Tugallangan davra: <Text style={{ color: C.gold, fontFamily: F.bold }}>{t.rounds}</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {t.targets.map((x, i) => (
            <TouchableOpacity key={i} onPress={x.onPick} activeOpacity={0.8}
              style={[st.targetBtn, x.active && { backgroundColor: 'rgba(217,179,106,0.16)', borderColor: 'rgba(217,179,106,0.5)' }]}>
              <Text style={{ fontFamily: F.extrabold, fontSize: 15, color: x.active ? C.gold : C.sage }}>{x.n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={t.onReset} activeOpacity={0.8} style={st.resetBtn}>
          <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.sageMid }}>Qayta boshlash</Text>
        </TouchableOpacity>
      </ScrollView>
    </OverlayShell>
  );
}

const st = StyleSheet.create({
  body: { alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 40 },
  dhikrChip: {
    paddingVertical: 9, paddingHorizontal: 15, borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  dhikrChipActive: { backgroundColor: 'rgba(217,179,106,0.16)', borderColor: 'rgba(217,179,106,0.5)' },
  targetBtn: {
    width: 52, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  resetBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
});
