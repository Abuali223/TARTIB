import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C, F } from '../theme';
import { OverlayShell } from '../components/ui';

// Umumiy tanlov ro'yxati (mazhab / shahar uchun).
// picker = { title, note?, options: [{ label, sub?, active, onPick }] }
export default function PickerOverlay({ picker, onClose }) {
  return (
    <OverlayShell title={picker.title} onClose={onClose}>
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {!!picker.note && <Text style={st.note}>{picker.note}</Text>}
        <View style={st.card}>
          {picker.options.map((o, i) => (
            <TouchableOpacity
              key={o.label}
              onPress={o.onPick}
              activeOpacity={0.75}
              style={[st.row, i < picker.options.length - 1 && st.rowBorder]}>
              <View style={{ flex: 1 }}>
                <Text style={[st.label, o.active && { color: C.gold }]}>{o.label}</Text>
                {!!o.sub && <Text style={st.sub}>{o.sub}</Text>}
              </View>
              {o.active && <Text style={st.check}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </OverlayShell>
  );
}

const st = StyleSheet.create({
  note: { fontFamily: F.regular, fontSize: 13, color: C.sageMid, marginHorizontal: 4, marginTop: 6, marginBottom: 14, lineHeight: 19 },
  card: { borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  label: { fontFamily: F.semibold, fontSize: 16, color: C.cream },
  sub: { fontFamily: F.regular, fontSize: 12.5, color: C.sageDim, marginTop: 3 },
  check: { fontFamily: F.bold, fontSize: 18, color: C.gold, marginLeft: 12 },
});
