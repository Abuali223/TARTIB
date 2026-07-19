import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { C, F } from '../theme';
import { OverlayShell } from '../components/ui';
import { UsersIcon } from '../components/icons';

export default function AddMemberOverlay({ v }) {
  const [copied, setCopied] = useState(false);
  const code = v.inviteCode || '—';

  const copy = async () => {
    try {
      await Clipboard.setStringAsync(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* noop */ }
  };

  return (
    <OverlayShell title="Taklif qilish" onClose={v.close}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <View style={st.iconWrap}><UsersIcon color={C.gold} size={30} /></View>
        <Text style={st.h}>A'zolarni taklif qiling</Text>
        <Text style={st.sub}>
          Quyidagi kodni ulashing. Boshqa foydalanuvchi TARTIB'da{'\n'}
          <Text style={{ color: C.gold, fontFamily: F.bold }}>Makon → Kod bilan qo'shilish</Text> orqali kiritsa, makoningizga qo'shiladi.
        </Text>

        <View style={st.codeCard}>
          <Text style={st.codeLabel}>TAKLIF KODI</Text>
          <Text style={st.code}>{code}</Text>
        </View>

        <TouchableOpacity onPress={copy} activeOpacity={0.85} style={st.copyBtn}>
          <Text style={st.copyText}>{copied ? 'Nusxalandi ✓' : 'Kodni nusxalash'}</Text>
        </TouchableOpacity>

        <View style={st.note}>
          <Text style={st.noteText}>
            A'zo qo'shilgach, uni <Text style={{ color: C.gold }}>A'zolar</Text> ro'yxatida ko'rasiz va rolini (masalan O'qituvchi, Xodim) o'zgartira olasiz.
          </Text>
        </View>
      </View>
    </OverlayShell>
  );
}

const st = StyleSheet.create({
  iconWrap: { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(217,179,106,0.14)', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  h: { fontFamily: F.serif, fontSize: 22, color: C.cream, textAlign: 'center', marginBottom: 8 },
  sub: { fontFamily: F.regular, fontSize: 14, color: C.sageMid, textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  codeCard: {
    borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(217,179,106,0.3)',
    paddingVertical: 22, alignItems: 'center', marginBottom: 16,
  },
  codeLabel: { fontFamily: F.regular, fontSize: 11, color: C.sage, letterSpacing: 1.2, marginBottom: 8 },
  code: { fontFamily: F.extrabold, fontSize: 34, color: C.gold, letterSpacing: 2 },
  copyBtn: { paddingVertical: 15, borderRadius: 16, backgroundColor: C.gold, alignItems: 'center', marginBottom: 22 },
  copyText: { fontFamily: F.extrabold, fontSize: 15, color: C.ink },
  note: { borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 14 },
  noteText: { fontFamily: F.regular, fontSize: 13, color: C.sageMid, lineHeight: 19 },
});
