import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C, F } from '../theme';
import { OverlayShell } from '../components/ui';
import { CheckIcon } from '../components/icons';

export default function HabitsOverlay({ v }) {
  return (
    <OverlayShell title="Odatlar" onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.sage, marginBottom: 16 }}>Har kuni belgilab boring — uzluksizlik barakadir.</Text>
        <View style={{ gap: 13 }}>
          {v.habits.map(h => (
            <View key={h.id} style={st.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream }}>{h.name}</Text>
                  <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.gold, marginTop: 2 }}>🔥 {h.streak} kun ketma-ket</Text>
                </View>
                <TouchableOpacity onPress={h.onToggleToday} activeOpacity={0.8}
                  style={[st.todayBtn, h.today ? { borderColor: C.emerald, backgroundColor: C.emerald } : { borderColor: 'rgba(242,235,217,0.28)' }]}>
                  {h.today && <CheckIcon size={16} />}
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {h.weekCells.map((c, i) => (
                  <View key={i} style={[st.weekCell, { backgroundColor: c.on ? C.emerald : 'rgba(255,255,255,0.06)' }]}>
                    <Text style={{ fontFamily: F.bold, fontSize: 10, color: c.on ? C.ink : C.sageDim }}>{c.letter}</Text>
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

const st = StyleSheet.create({
  card: { borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 16 },
  todayBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  weekCell: { flex: 1, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
