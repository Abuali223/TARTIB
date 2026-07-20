import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { F, useC } from '../theme';
import { OverlayShell } from '../components/ui';
import { CheckIcon } from '../components/icons';
import { t } from '../lib/i18n';

export default function HabitsOverlay({ v }) {
  const C = useC();
  const st = mkSt(C);
  return (
    <OverlayShell title={t('Odatlar')} onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.sage, marginBottom: 16 }}>{t('Har kuni belgilab boring — uzluksizlik barakadir.')}</Text>
        <View style={{ gap: 13 }}>
          {v.habits.map(h => (
            <View key={h.id} style={st.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream }}>{t(h.name)}</Text>
                  <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gold, marginTop: 2 }}>🔥 {h.streak} {t('kun ketma-ket')}</Text>
                </View>
                <TouchableOpacity onPress={h.onToggleToday} activeOpacity={0.8}
                  accessibilityRole="button" accessibilityLabel={t(h.name) + (h.today ? ' — bajarildi' : ' — belgilash')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[st.todayBtn, h.today ? { borderColor: C.emerald, backgroundColor: C.emerald } : { borderColor: C.borderStrong }]}>
                  {h.today && <CheckIcon size={16} />}
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {h.weekCells.map((c, i) => (
                  <View key={i} style={[st.weekCell, { backgroundColor: c.on ? C.emerald : C.overlay2 }]}>
                    <Text style={{ fontFamily: F.bold, fontSize: 11, color: c.on ? C.ink : C.sageMid }}>{t(c.letter)}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </OverlayShell>
  );
}

const mkSt = (C) => StyleSheet.create({
  card: { borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 16 },
  todayBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  weekCell: { flex: 1, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
