import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C, F } from '../theme';
import { CalendarIcon, CrescentIcon, HomeIcon, ProfileTabIcon, UsersIcon } from '../components/icons';

function Tab({ onPress, active, label, Icon }) {
  const color = active ? C.gold : C.sage;
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={st.tab}>
      <Icon color={color} />
      <Text style={[st.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function TabBar({ v }) {
  return (
    <View style={st.bar}>
      <Tab onPress={v.go.bugun} active={v.tab === 'bugun'} label="Bugun" Icon={HomeIcon} />
      <Tab onPress={v.go.namoz} active={v.tab === 'namoz'} label="Namoz" Icon={CrescentIcon} />
      <Tab onPress={v.go.reja} active={v.tab === 'reja'} label="Reja" Icon={CalendarIcon} />
      <Tab onPress={v.go.jamoa} active={v.tab === 'jamoa'} label="Jamoa" Icon={({ color }) => <UsersIcon color={color} size={24} strokeWidth={1.7} />} />
      <Tab onPress={v.go.profil} active={v.tab === 'profil'} label="Profil" Icon={ProfileTabIcon} />
    </View>
  );
}

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingTop: 8, paddingHorizontal: 6, paddingBottom: 26,
    backgroundColor: 'rgba(6,18,13,0.96)',
    borderTopWidth: 1, borderTopColor: 'rgba(217,179,106,0.12)',
  },
  tab: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6 },
  label: { fontFamily: F.semibold, fontSize: 10 },
});
