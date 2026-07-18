import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../theme';
import { FadeIn, PrimaryBtn } from '../components/ui';
import { CheckIcon, GoogleIcon, LogoMark } from '../components/icons';

export default function Onboarding({ v }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#12402d', '#0a2117', '#050f0a']} locations={[0, 0.55, 1]} style={{ flex: 1 }}>
        {v.onb0 && (
          <FadeIn style={st.center} duration={600}>
            <View style={{ width: 150, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
              <View style={st.glow} />
              <LogoMark />
            </View>
            <Text style={st.bismillah}>بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْم</Text>
            <Text style={st.brand}>TARTIB</Text>
            <View style={st.rule} />
            <Text style={st.lede}>Kuningizni ibodat, niyat va tartib bilan boshlang. Namoz, zikr, odatlar, oila, ta'lim va ishxona vazifalari — barchasi bir joyda.</Text>
            <TouchableOpacity onPress={v.setStep.next} activeOpacity={0.85} style={st.googleBtn}>
              <GoogleIcon />
              <Text style={st.googleText}>Google orqali davom etish</Text>
            </TouchableOpacity>
            <Text style={st.note}>Bir marta ro'yxatdan o'ting — shaxsiy, oila, ta'lim va ishxona makonlaridan foydalaning</Text>
          </FadeIn>
        )}

        {v.onb1 && (
          <FadeIn style={{ flex: 1, paddingTop: 90, paddingHorizontal: 28, paddingBottom: 40 }}>
            <Text style={st.h2}>Ma'lumotlaringiz</Text>
            <Text style={st.sub}>
              Hisobingiz Google orqali ulandi. Yoshingizni kiriting — 16 yoshdan kichik bo'lsangiz, avtomatik{' '}
              <Text style={{ color: C.gold, fontFamily: F.bold }}>farzand/talaba</Text> rejimi beriladi.
            </Text>
            <View style={st.accCard}>
              <View style={st.accAvatar}><Text style={{ fontFamily: F.serif, fontSize: 20, color: C.gold }}>A</Text></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.cream }}>Anvar Karimov</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sage }} numberOfLines={1}>anvar.karimov@gmail.com</Text>
              </View>
              <View style={st.accCheck}><CheckIcon size={13} /></View>
            </View>
            <Text style={st.label}>Yoshingiz</Text>
            <TextInput
              value={v.onbAge}
              onChangeText={v.onOnbAge}
              keyboardType="number-pad"
              placeholder="Masalan: 28"
              placeholderTextColor={C.sageDim}
              style={st.ageInput}
            />
            {v.ageIsChild && (
              <View style={[st.ageHint, { backgroundColor: 'rgba(111,179,224,0.12)', borderColor: 'rgba(111,179,224,0.35)' }]}>
                <Text style={[st.ageHintText, { color: '#9FC9E8' }]}>Farzand / talaba rejimi — vazifa va eslatmalarni qabul qilasiz</Text>
              </View>
            )}
            {v.ageIsAdult && (
              <View style={[st.ageHint, { backgroundColor: 'rgba(67,192,141,0.12)', borderColor: 'rgba(67,192,141,0.35)' }]}>
                <Text style={[st.ageHintText, { color: '#7FCBA9' }]}>To'liq huquq — oila, ta'lim va ishxona makonlarini boshqarasiz</Text>
              </View>
            )}
            <PrimaryBtn label="Ro'yxatdan o'tish" onPress={v.register} style={{ marginTop: 22, paddingVertical: 16 }} />
            <TouchableOpacity onPress={v.setStep.back} style={{ marginTop: 'auto', padding: 12, alignItems: 'center' }}>
              <Text style={{ fontFamily: F.medium, fontSize: 14, color: C.sageFaint }}>← Orqaga</Text>
            </TouchableOpacity>
          </FadeIn>
        )}
      </LinearGradient>
    </View>
  );
}

const st = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 34, paddingTop: 60, paddingBottom: 40 },
  glow: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(217,179,106,0.13)' },
  bismillah: { fontFamily: F.arabic, fontSize: 22, color: C.goldD, marginBottom: 20, textAlign: 'center' },
  brand: { fontFamily: F.serifBold, fontSize: 52, letterSpacing: 7, color: C.cream, marginBottom: 4, paddingLeft: 7 },
  rule: { width: 44, height: 2, backgroundColor: C.gold, marginTop: 12, marginBottom: 18 },
  lede: { fontFamily: F.regular, fontSize: 16, lineHeight: 25, color: C.sageMid, maxWidth: 280, textAlign: 'center', marginBottom: 44 },
  googleBtn: {
    width: '100%', maxWidth: 300, paddingVertical: 15, borderRadius: 16, backgroundColor: '#F5F0E6',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 13, shadowOffset: { width: 0, height: 10 }, elevation: 6,
  },
  googleText: { fontFamily: F.extrabold, fontSize: 15, color: '#1a1a1a' },
  note: { marginTop: 16, fontFamily: F.regular, fontSize: 12, color: C.sageFaint, maxWidth: 280, lineHeight: 18, textAlign: 'center' },
  h2: { fontFamily: F.serif, fontSize: 30, color: C.cream, marginBottom: 6 },
  sub: { fontFamily: F.regular, fontSize: 15, color: C.sageMid, marginBottom: 24, lineHeight: 22 },
  accCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18,
    backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(217,179,106,0.15)', marginBottom: 24,
  },
  accAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(217,179,106,0.14)', borderWidth: 1, borderColor: 'rgba(217,179,106,0.4)', alignItems: 'center', justifyContent: 'center' },
  accCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.emerald, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: F.bold, fontSize: 13, color: C.sageMid, marginBottom: 10, marginHorizontal: 2 },
  ageInput: {
    width: '100%', padding: 16, borderRadius: 14, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.borderStrong, color: C.cream,
    fontSize: 18, fontFamily: F.bold, textAlign: 'center',
  },
  ageHint: { marginTop: 14, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1 },
  ageHintText: { fontFamily: F.semibold, fontSize: 13, textAlign: 'center' },
});
