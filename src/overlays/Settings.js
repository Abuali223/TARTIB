import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { F, useC } from '../theme';
import { OverlayShell, Toggle } from '../components/ui';
import { t } from '../lib/i18n';
import { appVersionLabel } from '../lib/native';

function ToggleRow({ label, on, onToggle, last }) {
  const C = useC();
  const st = mkSt(C);
  return (
    <View style={[st.row, !last && st.rowBorder]}>
      <Text style={st.rowLabel}>{label}</Text>
      <Toggle on={on} onPress={onToggle} />
    </View>
  );
}

function InfoRow({ label, value, gold, last, onPress }) {
  const C = useC();
  const st = mkSt(C);
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
  const C = useC();
  const st = mkSt(C);
  return (
    <OverlayShell title={t('Sozlamalar')} onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={st.section}>{t('ESLATMALAR')}</Text>
        <View style={st.card}>
          <ToggleRow label={t('Namoz eslatmalari')} on={v.settings.namoz} onToggle={v.toggleSetting.namoz} />
          <ToggleRow label={t('Azon ovozi')} on={v.settings.azon} onToggle={v.toggleSetting.azon} />
          <ToggleRow label={t('Zikr eslatmasi')} on={v.settings.zikr} onToggle={v.toggleSetting.zikr} />
          <ToggleRow label={t('Vazifa bildirishnomalari')} on={v.settings.jamoa} onToggle={v.toggleSetting.jamoa} last />
        </View>
        {v.testNotification && (
          <TouchableOpacity onPress={v.testNotification} activeOpacity={0.85} style={st.testBtn}
            accessibilityRole="button" accessibilityLabel={t('Test bildirishnoma yuborish')}>
            <Text style={st.testBtnT}>{t('🔔 Test bildirishnoma yuborish')}</Text>
          </TouchableOpacity>
        )}

        <Text style={st.section}>{t('UMUMIY')}</Text>
        <View style={st.card}>
          <InfoRow label={t('Joylashuv')} value={v.isManualCity ? t(v.cityName) : `${t(v.cityName)} (auto)`} onPress={v.openCity} />
          <InfoRow label={t('Hisoblash usuli')} value={t(v.madhabName)} onPress={v.openMadhab} />
          <InfoRow label={t('Til')} value={v.langName} onPress={v.openLang} />
          <InfoRow label={t('Mavzu')} value={v.themeName} gold last onPress={v.openTheme} />
        </View>

        <Text style={st.section}>{t('XAVFSIZLIK')}</Text>
        <View style={st.card}>
          <ToggleRow label={t('Ilova qulfi (PIN)')} on={v.lockEnabled} onToggle={v.toggleLock} last={!v.lockEnabled} />
          {v.lockEnabled && (
            <>
              <ToggleRow label={t('Barmoq izi bilan ochish')} on={v.biometricEnabled} onToggle={v.toggleBiometric} />
              <InfoRow label={t("PIN'ni o'zgartirish")} value={t("O'zgartirish")} onPress={v.changePin} last />
            </>
          )}
        </View>

        <TouchableOpacity onPress={v.shareApp} activeOpacity={0.85} style={st.shareBtn}>
          <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.gold }}>{t('Ilovani ulashish')}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={v.logout} activeOpacity={0.85} style={st.logoutBtn}>
          <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.red }}>{t('Chiqish')}</Text>
        </TouchableOpacity>
        <Text style={st.footer}>TARTIB · {appVersionLabel()} · بارك الله فيكم</Text>
      </ScrollView>
    </OverlayShell>
  );
}

const mkSt = (C) => StyleSheet.create({
  section: { fontFamily: F.regular, fontSize: 12, color: C.sageFaint, letterSpacing: 1, marginHorizontal: 4, marginTop: 4, marginBottom: 8 },
  card: { borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden', marginBottom: 22 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: C.hairline },
  rowLabel: { flex: 1, fontFamily: F.regular, fontSize: 15, color: C.cream },
  shareBtn: { paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(217,179,106,0.4)', backgroundColor: 'rgba(217,179,106,0.08)', alignItems: 'center', marginBottom: 12 },
  logoutBtn: { paddingVertical: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(224,120,95,0.4)', alignItems: 'center' },
  footer: { textAlign: 'center', fontFamily: F.regular, fontSize: 12, color: C.sageDim, marginTop: 18 },
  testBtn: { marginTop: 10, paddingVertical: 13, borderRadius: 14, alignItems: 'center', backgroundColor: C.overlay2, borderWidth: 1, borderColor: C.border },
  testBtnT: { fontFamily: F.bold, fontSize: 14, color: C.gold },
});
