import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { F, useC } from '../theme';
import { OverlayShell } from '../components/ui';
import { UsersIcon } from '../components/icons';
import { t } from '../lib/i18n';

// QR — react-native-svg ustida ishlaydi (u allaqachon mavjud). Eski APK'da ham
// xatosiz yuklanishi uchun himoyalab chaqiramiz.
let QRCode = null;
try { QRCode = require('react-native-qrcode-svg').default; } catch (e) { QRCode = null; }

// QR ichiga yoziladigan chuqur havola — boshqa telefon skaner qilsa kod chiqadi.
export const joinLinkFor = (code) => `tartib://join/${code}`;

export default function AddMemberOverlay({ v }) {
  const C = useC();
  const st = mkSt(C);
  const [copied, setCopied] = useState(false);
  const code = v.inviteCode || '—';
  const hasCode = !!v.inviteCode;

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* noop */ }
  };

  return (
    <OverlayShell title={t('Taklif qilish')} onClose={v.close}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <View style={st.iconWrap}><UsersIcon color={C.gold} size={30} /></View>
        <Text style={st.h}>{t("A'zolarni taklif qiling")}</Text>
        <Text style={st.sub}>
          {t('Quyidagi kodni ulashing. Boshqa foydalanuvchi TARTIB’da')}{'\n'}
          <Text style={{ color: C.gold, fontFamily: F.bold }}>{t("Makon → Kod bilan qo'shilish")}</Text> {t('orqali kiritsa, makoningizga qo’shiladi.')}
        </Text>

        <View style={st.codeCard}>
          <Text style={st.codeLabel}>{t('TAKLIF KODI')}</Text>
          <Text style={st.code}>{code}</Text>
          {QRCode && hasCode && (
            <View style={st.qrWrap}>
              <QRCode value={joinLinkFor(code)} size={168} color="#123F37" backgroundColor="#FCFAF4" />
            </View>
          )}
          {QRCode && hasCode && <Text style={st.qrHint}>{t('Yoki bu QR kodni skanerlab qo‘shilsin')}</Text>}
        </View>

        <TouchableOpacity onPress={copy} activeOpacity={0.85} style={st.copyBtn}>
          <Text style={st.copyText}>{copied ? t('Nusxalandi') + ' ✓' : t('Kodni nusxalash')}</Text>
        </TouchableOpacity>

        <View style={st.note}>
          <Text style={st.noteText}>
            {t("A'zo qo'shilgach, uni")} <Text style={{ color: C.gold }}>{t("A'zolar")}</Text> {t("ro'yxatida ko'rasiz va rolini (masalan O'qituvchi, Xodim) o'zgartira olasiz.")}
          </Text>
        </View>
      </View>
    </OverlayShell>
  );
}

const mkSt = (C) => StyleSheet.create({
  iconWrap: { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(217,179,106,0.14)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  h: { fontFamily: F.serif, fontSize: 22, color: C.cream, textAlign: 'center', marginBottom: 8 },
  sub: { fontFamily: F.regular, fontSize: 14, color: C.sageMid, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  codeCard: {
    borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(217,179,106,0.3)',
    paddingVertical: 22, alignItems: 'center', marginBottom: 16,
  },
  codeLabel: { fontFamily: F.regular, fontSize: 11, color: C.sage, letterSpacing: 1.2, marginBottom: 8 },
  code: { fontFamily: F.extrabold, fontSize: 34, color: C.gold, letterSpacing: 2 },
  qrWrap: { marginTop: 18, padding: 14, borderRadius: 16, backgroundColor: '#FCFAF4' },
  qrHint: { fontFamily: F.regular, fontSize: 12, color: C.sageMid, marginTop: 12, textAlign: 'center' },
  copyBtn: { paddingVertical: 15, borderRadius: 16, backgroundColor: C.gold, alignItems: 'center', marginBottom: 22 },
  copyText: { fontFamily: F.extrabold, fontSize: 15, color: C.ink },
  note: { borderRadius: 14, backgroundColor: C.overlay1, borderWidth: 1, borderColor: C.overlay2, padding: 14 },
  noteText: { fontFamily: F.regular, fontSize: 13, color: C.sageMid, lineHeight: 19 },
});
