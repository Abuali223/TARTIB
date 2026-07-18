import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { C, F } from '../theme';
import { Chip, OverlayShell, PrimaryBtn } from '../components/ui';

export default function AddMemberOverlay({ v }) {
  return (
    <OverlayShell title="A'zo qo'shish" onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={st.label}>Ism</Text>
        <TextInput
          value={v.newM.name}
          onChangeText={v.onNMName}
          placeholder="To'liq ism"
          placeholderTextColor={C.sageDim}
          style={[st.input, { marginBottom: 18 }]}
        />
        <Text style={st.label}>Roli</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {v.roleChipsAdd.map((r, i) => (
            <Chip key={i} label={r.name} active={r.active} onPress={r.onPick}
              style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 11 }} textStyle={{ fontSize: 13 }} />
          ))}
        </View>
        <Text style={st.label}>
          Guruh / mutaxassislik <Text style={{ color: C.sageDim, fontFamily: F.medium }}>(ixtiyoriy)</Text>
        </Text>
        <TextInput
          value={v.newM.detail}
          onChangeText={v.onNMDetail}
          placeholder="Masalan: 9-sinf, Dasturchi"
          placeholderTextColor={C.sageDim}
          style={[st.input, { marginBottom: 28 }]}
        />
        <PrimaryBtn label="Qo'shish" onPress={v.addMember} style={{ paddingVertical: 16 }} />
      </ScrollView>
    </OverlayShell>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: F.bold, fontSize: 13, color: C.sageMid, marginHorizontal: 2, marginTop: 4, marginBottom: 10 },
  input: {
    paddingVertical: 15, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.card,
    borderWidth: 1, borderColor: 'rgba(217,179,106,0.18)', color: C.cream,
    fontFamily: F.regular, fontSize: 15,
  },
});
