import React from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../theme';
import { BriefcaseIcon, CheckIcon, GradCapIcon, PersonIcon, UsersIcon } from '../components/icons';

function WsRow({ active, onPress, iconBg, icon, title, sub }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={[st.row, active ? { backgroundColor: 'rgba(217,179,106,0.12)', borderColor: 'rgba(217,179,106,0.4)' } : { backgroundColor: C.cardAlt, borderColor: 'rgba(255,255,255,0.06)' }]}>
      <View style={[st.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.cream }}>{title}</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.sage, marginTop: 1 }}>{sub}</Text>
      </View>
      <View style={{ opacity: active ? 1 : 0 }}>
        <CheckIcon size={18} color={C.emerald} strokeWidth={2.4} />
      </View>
    </TouchableOpacity>
  );
}

export default function WorkspaceSheet({ v }) {
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 32 }]}>
      <Pressable onPress={v.close} style={st.backdrop} />
      <View style={st.sheetWrap} pointerEvents="box-none">
        <LinearGradient colors={['#102c22', '#0a1f18']} style={st.sheet}>
          <View style={st.grabber} />
          <Text style={{ fontFamily: F.serif, fontSize: 22, color: C.cream, marginBottom: 3 }}>Makonni tanlang</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sage, marginBottom: 18 }}>Bitta hisob — barcha rejimlar</Text>
          <WsRow active={v.mode === 'shaxsiy'} onPress={v.setMode.shaxsiy} iconBg="rgba(217,179,106,0.14)"
            icon={<PersonIcon />} title="Shaxsiy" sub="O'zim uchun ibodat va odatlar" />
          <WsRow active={v.mode === 'oila'} onPress={v.setMode.oila} iconBg="rgba(67,192,141,0.14)"
            icon={<UsersIcon />} title="Oila" sub="Farzandlarga vazifa va nazorat" />
          <WsRow active={v.mode === 'talim'} onPress={v.setMode.talim} iconBg="rgba(169,143,224,0.14)"
            icon={<GradCapIcon />} title="Ta'lim" sub="Maktab, kollej, universitet — talabalarga" />
          {v.showIsh && (
            <WsRow active={v.mode === 'ishxona'} onPress={v.setMode.ishxona} iconBg="rgba(111,179,224,0.14)"
              icon={<BriefcaseIcon />} title="Ishxona" sub="Xodimlarga vazifa va oqim nazorati" />
          )}
        </LinearGradient>
      </View>
    </View>
  );
}

const st = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,12,8,0.6)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderTopWidth: 1, borderTopColor: 'rgba(217,179,106,0.22)',
    paddingTop: 12, paddingHorizontal: 20, paddingBottom: 42,
  },
  grabber: { width: 40, height: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'center', marginBottom: 18 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%',
    paddingVertical: 15, paddingHorizontal: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1,
  },
  rowIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
