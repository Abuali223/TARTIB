import React, { useEffect, useRef } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { F, useC } from '../theme';
import { OverlayShell, ProgressRing } from '../components/ui';
import { t } from '../lib/i18n';

function PulsingCount({ count }) {
  const C = useC();
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
  const C = useC();
  const st = mkSt(C);
  const tb = v.tasbeh;
  return (
    <OverlayShell title={t('Tasbeh')} onClose={v.close} radial>
      <ScrollView contentContainerStyle={st.body} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap', justifyContent: 'center' }}>
          {tb.dhikrs.map((d, i) => (
            <TouchableOpacity key={i} onPress={d.onPick} activeOpacity={0.8}
              style={[st.dhikrChip, d.active && st.dhikrChipActive]}>
              <Text style={{ fontFamily: F.bold, fontSize: 13, color: d.active ? C.gold : C.sage }}>{t(d.name)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ fontFamily: F.arabic, fontSize: 34, color: C.gold, textAlign: 'center', marginBottom: 2 }}>{tb.ar}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sage, marginBottom: 6 }}>{t(tb.tr)}</Text>

        <TouchableOpacity onPress={tb.onTap} activeOpacity={0.9} style={{ marginVertical: 10 }}>
          <ProgressRing size={250} strokeWidth={6} progress={tb.progress}>
            <PulsingCount count={tb.count} />
            <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.sage, marginTop: 6 }}>/ {tb.target}</Text>
          </ProgressRing>
        </TouchableOpacity>

        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sageMid, marginBottom: 18 }}>
          {t('Tugallangan davra')}: <Text style={{ color: C.gold, fontFamily: F.bold }}>{tb.rounds}</Text>
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {tb.targets.map((x, i) => (
            <TouchableOpacity key={i} onPress={x.onPick} activeOpacity={0.8}
              style={[st.targetBtn, x.active && { backgroundColor: 'rgba(217,179,106,0.16)', borderColor: 'rgba(217,179,106,0.5)' }]}>
              <Text style={{ fontFamily: F.extrabold, fontSize: 15, color: x.active ? C.gold : C.sage }}>{x.n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={tb.onReset} activeOpacity={0.8} style={st.resetBtn}>
          <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.sageMid }}>{t('Qayta boshlash')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </OverlayShell>
  );
}

const mkSt = (C) => StyleSheet.create({
  body: { alignItems: 'center', paddingTop: 8, paddingHorizontal: 24, paddingBottom: 40 },
  dhikrChip: {
    paddingVertical: 9, paddingHorizontal: 15, borderRadius: 99,
    backgroundColor: C.overlay1, borderWidth: 1, borderColor: C.overlay3,
  },
  dhikrChipActive: { backgroundColor: 'rgba(217,179,106,0.16)', borderColor: 'rgba(217,179,106,0.5)' },
  targetBtn: {
    width: 52, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.overlay3,
  },
  resetBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 14, borderWidth: 1, borderColor: C.overlay3 },
});
