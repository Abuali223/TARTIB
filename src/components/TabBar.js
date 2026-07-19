import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { F, useC } from '../theme';
import { CalendarIcon, CrescentIcon, HomeIcon, ProfileTabIcon, UsersIcon } from '../components/icons';
import { t } from '../lib/i18n';

// Edge-to-edge (SDK 54) tufayli ilova tizim panellari ostiga chiziladi.
// react-native-safe-area-context native modul — OTA'da eski APK'ni buzadi,
// shu bois tizim navigatsiya paneli balandligini xavfsiz zaxira bilan qoplaymiz.
const NAV_INSET = Platform.OS === 'android' ? 46 : 34;
const ICON_SIZE = 28;

function Tab({ onPress, active, label, Icon }) {
  const C = useC();
  const st = mkSt(C);
  const color = active ? C.gold : C.sage;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={st.tab}>
      <Icon color={color} size={ICON_SIZE} />
      <Text style={[st.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function TabBar({ v }) {
  const C = useC();
  const st = mkSt(C);
  return (
    <View style={st.bar}>
      <Tab onPress={v.go.bugun} active={v.tab === 'bugun'} label={t('Bugun')} Icon={HomeIcon} />
      <Tab onPress={v.go.namoz} active={v.tab === 'namoz'} label={t('Namoz')} Icon={CrescentIcon} />
      <Tab onPress={v.go.reja} active={v.tab === 'reja'} label={t('Reja')} Icon={CalendarIcon} />
      <Tab onPress={v.go.jamoa} active={v.tab === 'jamoa'} label={t('Jamoa')} Icon={({ color, size }) => <UsersIcon color={color} size={size} strokeWidth={1.7} />} />
      <Tab onPress={v.go.profil} active={v.tab === 'profil'} label={t('Profil')} Icon={ProfileTabIcon} />
    </View>
  );
}

const mkSt = (C) => StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingTop: 8, paddingHorizontal: 6, paddingBottom: NAV_INSET,
    backgroundColor: C.card,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  label: { fontFamily: F.semibold, fontSize: 11 },
});
