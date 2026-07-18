import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C, F } from '../theme';
import { Avatar, OverlayShell, StatusPill } from '../components/ui';

function InfoRow({ label, children, last }) {
  return (
    <View style={[st.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: C.hairline }]}>
      <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.sage, width: 90 }}>{label}</Text>
      {children}
    </View>
  );
}

export default function TaskOverlay({ v }) {
  const t = v.selTaskObj;
  return (
    <OverlayShell title="Vazifa" onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignSelf: 'flex-start' }}><StatusPill meta={t.statusMeta} /></View>
        <Text style={st.title}>{t.title}</Text>
        <Text style={st.desc}>{t.desc}</Text>

        <View style={st.infoCard}>
          <InfoRow label="Mas'ul">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Avatar name={t.assigneeName} color={t.assigneeColor} size={32} radius={10} fontSize={13} />
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: C.cream }}>{t.assigneeName}</Text>
            </View>
          </InfoRow>
          <InfoRow label="Bergan"><Text style={st.infoValue}>{t.assignerName}</Text></InfoRow>
          <InfoRow label="Muddat"><Text style={st.infoValue}>{t.due}</Text></InfoRow>
          <InfoRow label="Yo'nalish" last><Text style={st.infoValue}>{t.cat}</Text></InfoRow>
        </View>

        {t.reminderPending && (
          <>
            <View style={st.reminderNote}>
              <Text style={{ fontFamily: F.regular, fontSize: 13, color: '#9FC9E8', lineHeight: 19 }}>Bu — eslatma. O'qib chiqqaningizni tasdiqlang.</Text>
            </View>
            <TouchableOpacity onPress={t.onAck} activeOpacity={0.85} style={[st.fullBtn, { backgroundColor: C.blue }]}>
              <Text style={st.fullBtnText}>Tushunarli ✓</Text>
            </TouchableOpacity>
          </>
        )}
        {t.canAccept && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity onPress={t.onAccept} activeOpacity={0.85} style={[st.fullBtn, { flex: 1, backgroundColor: C.emerald }]}>
              <Text style={st.fullBtnText}>Qabul qilish</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={t.onReject} activeOpacity={0.85} style={[st.fullBtn, { flex: 1, borderWidth: 1, borderColor: 'rgba(224,120,95,0.5)' }]}>
              <Text style={[st.fullBtnText, { color: C.red }]}>Rad etish</Text>
            </TouchableOpacity>
          </View>
        )}
        {t.canStart && (
          <TouchableOpacity onPress={t.onStart} activeOpacity={0.85} style={[st.fullBtn, { backgroundColor: C.amber }]}>
            <Text style={st.fullBtnText}>Ishni boshlash</Text>
          </TouchableOpacity>
        )}
        {t.canComplete && (
          <TouchableOpacity onPress={t.onComplete} activeOpacity={0.85} style={[st.fullBtn, { backgroundColor: C.emerald }]}>
            <Text style={st.fullBtnText}>Bajarildi deb belgilash ✓</Text>
          </TouchableOpacity>
        )}
        {t.isFinal && (
          <TouchableOpacity onPress={t.onReopen} activeOpacity={0.85} style={[st.fullBtn, { borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' }]}>
            <Text style={[st.fullBtnText, { color: C.sageMid, fontFamily: F.bold }]}>Qayta ochish</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </OverlayShell>
  );
}

const st = StyleSheet.create({
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
