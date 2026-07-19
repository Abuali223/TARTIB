import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { F, useC } from '../theme';
import { FadeIn } from '../components/ui';
import { GoogleIcon, LogoMark } from '../components/icons';
import { t } from '../lib/i18n';

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
  const C = useC();
  const st = mkSt(C);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={st.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.sageDim}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'none'}
        autoCorrect={false}
        style={st.input}
      />
    </View>
  );
}

export default function Onboarding({ v }) {
  const C = useC();
  const st = mkSt(C);
  const signup = v.authMode === 'signup';
  const f = v.authForm;
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={C.radialTop} locations={[0, 0.55, 1]} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <FadeIn>
              {/* Brand */}
              <View style={{ alignItems: 'center', marginBottom: 26 }}>
                <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <View style={st.glow} />
                  <LogoMark size={80} />
                </View>
                <Text style={st.bismillah}>بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيْم</Text>
                <Text style={st.brand}>TARTIB</Text>
                <View style={st.rule} />
                <Text style={st.lede}>{t('Ibodat, niyat va tartib — barchasi bir joyda.')}</Text>
              </View>

              {/* Kirish / Ro'yxatdan o'tish toggle */}
              <View style={st.tabs}>
                <TouchableOpacity onPress={v.setAuthMode.signup} activeOpacity={0.8} style={[st.tab, signup && st.tabActive]}>
                  <Text style={[st.tabText, signup && st.tabTextActive]}>{t("Ro'yxatdan o'tish")}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={v.setAuthMode.signin} activeOpacity={0.8} style={[st.tab, !signup && st.tabActive]}>
                  <Text style={[st.tabText, !signup && st.tabTextActive]}>{t('Kirish')}</Text>
                </TouchableOpacity>
              </View>

              {signup && (
                <Field label={t('Ism')} value={f.name} onChangeText={v.onAuthField.name} placeholder={t("To'liq ismingiz")} autoCapitalize="words" />
              )}
              <Field label={t('Email')} value={f.email} onChangeText={v.onAuthField.email} placeholder="siz@example.com" keyboardType="email-address" />
              <Field label={t('Parol')} value={f.password} onChangeText={v.onAuthField.password} placeholder={t('Kamida 6 belgi')} secureTextEntry />
              {signup && (
                <Field label={t("Tug'ilgan yil")} value={f.birthYear} onChangeText={v.onAuthField.birthYear} placeholder={t('Masalan: 1998')} keyboardType="number-pad" />
              )}

              <TouchableOpacity onPress={v.submitAuth} activeOpacity={0.85} disabled={v.authBusy}
                style={[st.primary, v.authBusy && { opacity: 0.7 }]}>
                {v.authBusy
                  ? <ActivityIndicator color={C.ink} />
                  : <Text style={st.primaryText}>{signup ? t("Ro'yxatdan o'tish") : t('Kirish')}</Text>}
              </TouchableOpacity>

              {/* Google / Telefon (SMS) */}
              <View style={st.divider}>
                <View style={st.hr} /><Text style={st.dividerText}>{t('yoki')}</Text><View style={st.hr} />
              </View>
              {v.googleEnabled ? (
                <TouchableOpacity onPress={v.startGoogle} activeOpacity={0.85} disabled={v.googleBusy}
                  style={[st.googleBtn, v.googleBusy && { opacity: 0.7 }]}>
                  {v.googleBusy
                    ? <ActivityIndicator color={C.cream} />
                    : (<><GoogleIcon size={18} /><Text style={st.googleText}>{t('Google bilan kirish')}</Text></>)}
                </TouchableOpacity>
              ) : (
                <View style={st.soonBtn}>
                  <GoogleIcon size={18} />
                  <Text style={st.soonText}>{t('Google · tez orada')}</Text>
                </View>
              )}
              <View style={st.soonBtn}>
                <Text style={[st.soonText, { marginLeft: 0 }]}>{t('Telefon (SMS) · tez orada')}</Text>
              </View>

              <Text style={st.note}>{t("Ro'yxatdan o'tib, shaxsiy, oila, ta'lim va ishxona makonlaridan foydalaning")}</Text>
            </FadeIn>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const mkSt = (C) => StyleSheet.create({
  scroll: { paddingHorizontal: 28, paddingTop: 70, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  glow: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(217,179,106,0.13)' },
  bismillah: { fontFamily: F.arabic, fontSize: 18, color: C.goldD, marginBottom: 12, textAlign: 'center' },
  brand: { fontFamily: F.serifBold, fontSize: 42, letterSpacing: 6, color: C.cream, paddingLeft: 6 },
  rule: { width: 40, height: 2, backgroundColor: C.gold, marginTop: 10, marginBottom: 14 },
  lede: { fontFamily: F.regular, fontSize: 14, lineHeight: 21, color: C.sageMid, maxWidth: 260, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: C.overlay2, borderRadius: 14, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 11, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: 'rgba(217,179,106,0.16)', borderWidth: 1, borderColor: 'rgba(217,179,106,0.4)' },
  tabText: { fontFamily: F.bold, fontSize: 14, color: C.sage },
  tabTextActive: { color: C.gold },
  label: { fontFamily: F.bold, fontSize: 13, color: C.sageMid, marginBottom: 8, marginHorizontal: 2 },
  input: {
    paddingVertical: 15, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.card,
    borderWidth: 1, borderColor: C.borderStrong, color: C.cream, fontFamily: F.medium, fontSize: 16,
  },
  primary: {
    marginTop: 8, paddingVertical: 16, borderRadius: 16, backgroundColor: C.gold, alignItems: 'center',
    shadowColor: C.gold, shadowOpacity: 0.3, shadowRadius: 13, shadowOffset: { width: 0, height: 10 }, elevation: 5,
  },
  primaryText: { fontFamily: F.extrabold, fontSize: 16, color: C.ink },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 18, gap: 12 },
  hr: { flex: 1, height: 1, backgroundColor: C.overlay3 },
  dividerText: { fontFamily: F.regular, fontSize: 12, color: C.sageFaint },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: C.overlay3,
    backgroundColor: C.overlay2, marginBottom: 10, minHeight: 50,
  },
  googleText: { fontFamily: F.semibold, fontSize: 15, color: C.cream },
  soonBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: C.overlay3,
    backgroundColor: C.overlay1, marginBottom: 10, opacity: 0.55,
  },
  soonText: { fontFamily: F.semibold, fontSize: 14, color: C.sageMid, marginLeft: 0 },
  note: { marginTop: 18, fontFamily: F.regular, fontSize: 12, color: C.sageFaint, textAlign: 'center', lineHeight: 18 },
});
