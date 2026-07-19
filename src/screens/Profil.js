import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C, F } from '../theme';
import { FadeIn } from '../components/ui';
import { BigCheckIcon, ChevronRight, GearIcon, SmallUsersIcon, StatsIcon } from '../components/icons';
import { t } from '../lib/i18n';

function Row({ onPress, iconBg, icon, label, last }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={[st.row, !last && { borderBottomWidth: 1, borderBottomColor: C.hairline }]}>
      <View style={[st.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 16, color: C.cream }}>{label}</Text>
      <ChevronRight />
    </TouchableOpacity>
  );
}

export default function Profil({ v }) {
  return (
    <FadeIn style={st.wrap}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={st.avatar}><Text style={{ fontFamily: F.serif, fontSize: 38, color: C.gold }}>{v.meInitial}</Text></View>
        <Text style={{ fontFamily: F.serif, fontSize: 24, color: C.cream }}>{v.meName} {v.meLast}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sage, marginTop: 3 }}>{t(v.roleLabel)} · {t(v.meRole)}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 11, marginBottom: 22 }}>
        <View style={st.stat}><Text style={[st.statNum, { color: C.gold }]}>{v.overallPct}%</Text><Text style={st.statLabel}>{t('Haftalik')}</Text></View>
        <View style={st.stat}><Text style={[st.statNum, { color: C.emerald }]}>21</Text><Text style={st.statLabel}>{t('Kun streak')}</Text></View>
        <View style={st.stat}><Text style={[st.statNum, { color: C.blue }]}>148</Text><Text style={st.statLabel}>{t('Namoz')}</Text></View>
      </View>

      <View style={st.menu}>
        <Row onPress={v.open.stats} iconBg="rgba(217,179,106,0.14)" icon={<StatsIcon />} label={t('Statistika')} />
        <Row onPress={v.open.habits} iconBg="rgba(67,192,141,0.14)" icon={<BigCheckIcon />} label={t('Odatlar')} />
        <Row onPress={v.go.jamoa} iconBg="rgba(111,179,224,0.14)" icon={<SmallUsersIcon />} label={t(v.roleLabel + ' boshqaruvi')} />
        <Row onPress={v.open.settings} iconBg="rgba(255,255,255,0.06)" icon={<GearIcon />} label={t('Sozlamalar')} last />
      </View>
    </FadeIn>
  );
}

const st = StyleSheet.create({
  wrap: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28 },
  avatar: {
    width: 88, height: 88, borderRadius: 28, backgroundColor: 'rgba(217,179,106,0.14)',
    borderWidth: 1, borderColor: 'rgba(217,179,106,0.4)', alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  stat: { flex: 1, borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, paddingVertical: 16, paddingHorizontal: 10, alignItems: 'center' },
  statNum: { fontFamily: F.extrabold, fontSize: 22 },
  statLabel: { fontFamily: F.regular, fontSize: 11, color: C.sage, marginTop: 3 },
  menu: { borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
