import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { F, useC } from '../theme';
import { Avatar, Chip, OverlayShell, PrimaryBtn, SectionTitle, StatusPill } from '../components/ui';
import { t } from '../lib/i18n';

export default function MemberOverlay({ v }) {
  const C = useC();
  const st = mkSt(C);
  const m = v.selMemberObj;
  return (
    <OverlayShell title={t("A'zo profili")} onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Avatar name={m.name} color={m.color} size={64} radius={20} fontSize={26} />
          <View>
            <Text style={{ fontFamily: F.serif, fontSize: 24, color: C.cream }}>{m.name}</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.sage, marginTop: 2 }}>{t(m.label)}</Text>
          </View>
        </View>

        <View style={st.progressCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.sage }}>{t('Bajarilgan vazifalar')}</Text>
            <Text style={{ fontFamily: F.extrabold, fontSize: 18, color: C.emerald }}>{m.doneCount}/{m.totalCount}</Text>
          </View>
          <View style={st.barTrack}>
            <View style={{ height: '100%', borderRadius: 99, width: `${m.pct}%`, backgroundColor: m.color }} />
          </View>
        </View>

        <Text style={st.label}>{t('Roli')}</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          {m.roleChips.map((r, i) => (
            <Chip key={i} label={t(r.name)} active={r.active} onPress={r.onPick}
              style={{ paddingVertical: 9, paddingHorizontal: 14, borderRadius: 11 }} textStyle={{ fontSize: 13 }} />
          ))}
        </View>

        <PrimaryBtn label={t("+ Bu a'zoga vazifa yoki eslatma")} onPress={m.onAssign} style={{ marginBottom: 22, paddingVertical: 14 }} />

        <SectionTitle style={{ fontSize: 18, marginHorizontal: 2, marginBottom: 12 }}>{t('Vazifalari')}</SectionTitle>
        <View style={{ gap: 11 }}>
          {m.tasks.map(task => (
            <TouchableOpacity key={task.id} onPress={task.onOpen} activeOpacity={0.85} style={st.taskRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream }}>{t(task.title)}</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.sage, marginTop: 2 }}>{t(task.cat)} · {t(task.due)}</Text>
              </View>
              <StatusPill meta={task.statusMeta} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </OverlayShell>
  );
}

const mkSt = (C) => StyleSheet.create({
  progressCard: { borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 18 },
  barTrack: { height: 8, borderRadius: 99, backgroundColor: C.overlay2, overflow: 'hidden' },
  label: { fontFamily: F.bold, fontSize: 13, color: C.sageMid, marginHorizontal: 2, marginBottom: 10 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 16, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
});
