import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { C, F } from '../theme';
import { Avatar, Chip, OverlayShell, PrimaryBtn } from '../components/ui';

export default function AssignOverlay({ v }) {
  return (
    <OverlayShell title="Topshiriq yuborish" onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={st.label}>Turi</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {v.typeChips.map((t, i) => (
            <Chip key={i} label={t.name} active={t.active} onPress={t.onPick}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 13, alignItems: 'center' }} />
          ))}
        </View>

        <Text style={st.label}>Kimga</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 10, paddingBottom: 6 }}>
          {v.assignMembers.map(m => (
            <TouchableOpacity key={m.id} onPress={m.onPick} activeOpacity={0.8}
              style={[st.memberChip, m.active && { borderColor: m.color, backgroundColor: m.color + '18' }]}>
              <Avatar name={m.name} color={m.color} size={44} />
              <Text style={{ fontFamily: F.regular, fontSize: 12, color: '#C6D4CC', marginTop: 6 }}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={st.label}>Vazifa nomi</Text>
        <TextInput
          value={v.draftTitle}
          onChangeText={v.onDraftTitle}
          placeholder="Masalan: Asr namozini o'qish"
          placeholderTextColor={C.sageDim}
          style={st.input}
        />

        <Text style={st.label}>Yo'nalish</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {v.catChips.map((c, i) => (
            <Chip key={i} label={c.name} active={c.active} onPress={c.onPick} />
          ))}
        </View>

        <Text style={st.label}>Muddat</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
          {v.dueChips.map((d, i) => (
            <Chip key={i} label={d.name} active={d.active} onPress={d.onPick} />
          ))}
        </View>

        <PrimaryBtn label="Yuborish" onPress={v.onSubmitAssign} style={{ paddingVertical: 16 }} />
      </ScrollView>
    </OverlayShell>
  );
}

const st = StyleSheet.create({
  label: { fontFamily: F.bold, fontSize: 13, color: C.sageMid, marginHorizontal: 2, marginTop: 4, marginBottom: 10 },
  memberChip: {
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, minWidth: 78,
    borderWidth: 2, borderColor: 'transparent', backgroundColor: 'rgba(255,255,255,0.03)',
  },
  input: {
    paddingVertical: 15, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.card,
    borderWidth: 1, borderColor: 'rgba(217,179,106,0.18)', color: C.cream,
    fontFamily: F.regular, fontSize: 15, marginBottom: 20,
  },
});
