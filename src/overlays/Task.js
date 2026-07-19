import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { F, useC } from '../theme';
import { Avatar, OverlayShell, StatusPill } from '../components/ui';
import { t } from '../lib/i18n';

function InfoRow({ label, children, last }) {
  const C = useC();
  const st = mkSt(C);
  return (
    <View style={[st.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: C.hairline }]}>
      <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.sage, width: 90 }}>{label}</Text>
      {children}
    </View>
  );
}

export default function TaskOverlay({ v }) {
  const C = useC();
  const st = mkSt(C);
  const task = v.selTaskObj;
  return (
    <OverlayShell title={t('Vazifa')} onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignSelf: 'flex-start' }}><StatusPill meta={task.statusMeta} /></View>
        <Text style={st.title}>{t(task.title)}</Text>
        <Text style={st.desc}>{t(task.desc)}</Text>

        <View style={st.infoCard}>
          <InfoRow label={t("Mas'ul")}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar name={task.assigneeName} color={task.assigneeColor} size={32} radius={10} fontSize={13} />
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.cream }}>{task.assigneeName}</Text>
            </View>
          </InfoRow>
          <InfoRow label={t('Bergan')}><Text style={st.infoValue}>{task.assignerName}</Text></InfoRow>
          <InfoRow label={t('Muddat')}><Text style={st.infoValue}>{t(task.due)}</Text></InfoRow>
          <InfoRow label={t("Yo'nalish")} last><Text style={st.infoValue}>{t(task.cat)}</Text></InfoRow>
        </View>

        {task.reminderPending && (
          <>
            <View style={st.reminderNote}>
              <Text style={{ fontFamily: F.regular, fontSize: 13, color: '#9FC9E8', lineHeight: 19 }}>{t("Bu — eslatma. O'qib chiqqaningizni tasdiqlang.")}</Text>
            </View>
            <TouchableOpacity onPress={task.onAck} activeOpacity={0.85} style={[st.fullBtn, { backgroundColor: C.blue }]}>
              <Text style={st.fullBtnText}>{t('Tushunarli')} ✓</Text>
            </TouchableOpacity>
          </>
        )}
        {task.canAccept && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={task.onAccept} activeOpacity={0.85} style={[st.fullBtn, { flex: 1, backgroundColor: C.emerald }]}>
              <Text style={st.fullBtnText}>{t('Qabul qilish')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={task.onReject} activeOpacity={0.85} style={[st.fullBtn, { flex: 1, borderWidth: 1, borderColor: 'rgba(224,120,95,0.5)' }]}>
              <Text style={[st.fullBtnText, { color: C.red }]}>{t('Rad etish')}</Text>
            </TouchableOpacity>
          </View>
        )}
        {task.canStart && (
          <TouchableOpacity onPress={task.onStart} activeOpacity={0.85} style={[st.fullBtn, { backgroundColor: C.amber }]}>
            <Text style={st.fullBtnText}>{t('Ishni boshlash')}</Text>
          </TouchableOpacity>
        )}
        {task.canComplete && (
          <TouchableOpacity onPress={task.onComplete} activeOpacity={0.85} style={[st.fullBtn, { backgroundColor: C.emerald }]}>
            <Text style={st.fullBtnText}>{t('Bajarildi deb belgilash')} ✓</Text>
          </TouchableOpacity>
        )}
        {task.isFinal && (
          <TouchableOpacity onPress={task.onReopen} activeOpacity={0.85} style={[st.fullBtn, { borderWidth: 1, borderColor: C.overlay3 }]}>
            <Text style={[st.fullBtnText, { color: C.sageMid, fontFamily: F.bold }]}>{t('Qayta ochish')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </OverlayShell>
  );
}

const mkSt = (C) => StyleSheet.create({
  title: { fontFamily: F.serif, fontSize: 26, color: C.cream, marginTop: 14, marginBottom: 6, lineHeight: 33 },
  desc: { fontFamily: F.regular, fontSize: 15, color: C.sageMid, lineHeight: 23, marginBottom: 22 },
  infoCard: { borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16 },
  infoValue: { fontFamily: F.regular, fontSize: 15, color: C.cream },
  reminderNote: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, marginBottom: 14,
    backgroundColor: 'rgba(111,179,224,0.1)', borderWidth: 1, borderColor: 'rgba(111,179,224,0.3)',
  },
  fullBtn: { paddingVertical: 15, borderRadius: 16, alignItems: 'center' },
  fullBtnText: { fontFamily: F.extrabold, fontSize: 15, color: C.ink },
});
