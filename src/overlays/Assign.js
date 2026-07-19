import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { C, F } from '../theme';
import { Avatar, Chip, OverlayShell, PrimaryBtn } from '../components/ui';
import DatePicker from '../components/DatePicker';
import { t } from '../lib/i18n';

const MO = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const dueLabel = (d) => `${d.getDate()} ${t(MO[d.getMonth()])}`;

export default function AssignOverlay({ v }) {
  const [showCal, setShowCal] = useState(false);
  return (
    <OverlayShell title={t('Topshiriq yuborish')} onClose={v.close}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={st.label}>{t('Turi')}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {v.typeChips.map((ch, i) => (
            <Chip key={i} label={t(ch.name)} active={ch.active} onPress={ch.onPick}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 13, alignItems: 'center' }} />
          ))}
        </View>

        <Text style={st.label}>{t('Kimga')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 10, paddingBottom: 6 }}>
          {v.assignMembers.map(m => (
            <TouchableOpacity key={m.id} onPress={m.onPick} activeOpacity={0.8}
              style={[st.memberChip, m.active && { borderColor: m.color, backgroundColor: m.color + '18' }]}>
              <Avatar name={m.name} color={m.color} size={44} />
              <Text style={{ fontFamily: F.regular, fontSize: 12, color: '#C6D4CC', marginTop: 6 }}>{m.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={st.label}>{t('Vazifa nomi')}</Text>
        <TextInput
          value={v.draftTitle}
          onChangeText={v.onDraftTitle}
          placeholder={t("Masalan: Asr namozini o'qish")}
          placeholderTextColor={C.sageDim}
          style={st.input}
        />

        <Text style={st.label}>{t("Yo'nalish")}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {v.catChips.map((c, i) => (
            <Chip key={i} label={t(c.name)} active={c.active} onPress={c.onPick} />
          ))}
        </View>

        <Text style={st.label}>{t('Muddat')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {v.dueChips.map((d, i) => (
            <Chip key={i} label={t(d.name)} active={d.active} onPress={() => { setShowCal(false); d.onPick(); }} />
          ))}
          <Chip
            label={v.dueDate ? `📅 ${dueLabel(v.dueDate)}` : `📅 ${t('Sana tanlash')}`}
            active={!!v.dueDate || showCal}
            onPress={() => setShowCal(s => !s)}
          />
        </View>
        {showCal && (
          <DatePicker
            value={v.dueDate}
            onPick={(date) => { v.onPickDueDate(date); setShowCal(false); }}
          />
        )}
        <View style={{ height: 14 }} />

        <PrimaryBtn label={t('Yuborish')} onPress={v.onSubmitAssign} style={{ paddingVertical: 16 }} />
      </ScrollView>
      </KeyboardAvoidingView>
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
