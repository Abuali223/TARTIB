import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C, F } from '../theme';
import { OverlayShell, Toggle } from '../components/ui';

function ToggleRow({ label, on, onToggle, last }) {
  return (
    <View style={[st.row, !last && st.rowBorder]}>
      <Text style={st.rowLabel}>{label}</Text>
      <Toggle on={on} onPress={onToggle} />
    </View>
  );
}

function InfoRow({ label, value, gold, last, onPress }) {
  const body = (
    <>
      <Text style={st.rowLabel}>{label}</Text>
      <Text style={{ fontFamily: F.regular, fontSize: 14, color: gold ? C.gold : C.sage }}>{value} ›</Text>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[st.row, !last && st.rowBorder]}>
        {body}
      </TouchableOpacity>
    );
  }
  return <View style={[st.row, !last && st.rowBorder]}>{body}</View>;
}

export default function SettingsOverlay({ v }) {
  return (
    <OverlayShell title="Sozlamalar" onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={st.section}>ESLATMALAR</Text>
        <View style={st.card}>
          <ToggleRow label="Namoz eslatmalari" on={v.settings.namoz} onToggle={v.toggleSetting.namoz} />
          <ToggleRow label="Azon ovozi" on={v.settings.azon} onToggle={v.toggleSetting.azon} />
          <ToggleRow label="Zikr eslatmasi" on={v.settings.zikr} onToggle={v.toggleSetting.zikr} />
          <ToggleRow label="Vazifa bildirishnomalari" on={v.settings.jamoa} onToggle={v.toggleSetting.jamoa} last />
        </View>

        <Text style={st.section}>UMUMIY</Text>
        <View style={st.card}>
          <InfoRow label="Joylashuv" value={v.isManualCity ? v.cityName : `${v.cityName} (auto)`} onPress={v.openCity} />
          <InfoRow label="Hisoblash usuli" value={v.madhabName} onPress={v.openMadhab} />
          <InfoRow label="Til" value="O'zbekcha" />
          <InfoRow label="Mavzu" value="To'q yashil" gold last />
        </View>

        <TouchableOpacity onPress={v.logout} activeOpacity={0.85} style={st.logoutBtn}>
          <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.red }}>Chiqish</Text>
        </TouchableOpacity>
        <Text style={st.footer}>TARTIB · v1.0 · بارك الله فيكم</Text>
      </ScrollView>
    </OverlayShell>
  );
}

const st = StyleSheet.create({
  section: { fontFamily: F.regular, fontSize: 12, color: C.sageFaint, letterSpacing: 1, marginHorizontal: 4, marginTop: 4, marginBottom: 8 },
  card: { borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 22 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  rowLabel: { flex: 1, fontFamily: F.regular, fontSize: 15, color: C.cream },
  logoutBtn: { paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(224,120,95,0.4)', alignItems: 'center' },
  footer: { textAlign: 'center', fontFamily: F.regular, fontSize: 12, color: C.sageDim, marginTop: 18 },
});
