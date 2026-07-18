import React from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../theme';
import { FadeIn } from '../components/ui';
import { GoogleIcon, LogoMark } from '../components/icons';

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, autoCapitalize }) {
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
  const signup = v.authMode === 'signup';
  const f = v.authForm;
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={['#12402d', '#0a2117', '#050f0a']} locations={[0, 0.55, 1]} style={{ flex: 1 }}>
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
                <Text style={st.lede}>Ibodat, niyat va tartib — barchasi bir joyda.</Text>
              </View>

              {/* Kirish / Ro'yxatdan o'tish toggle */}
              <View style={st.tabs}>
                <TouchableOpacity onPress={v.setAuthMode.signup} activeOpacity={0.8} style={[st.tab, signup && st.tabActive]}>
                  <Text style={[st.tabText, signup && st.tabTextActive]}>Ro'yxatdan o'tish</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={v.setAuthMode.signin} activeOpacity={0.8} style={[st.tab, !signup && st.tabActive]}>
                  <Text style={[st.tabText, !signup && st.tabTextActive]}>Kirish</Text>
                </TouchableOpacity>
              </View>

              {signup && (
                <Field label="Ism" value={f.name} onChangeText={v.onAuthField.name} placeholder="To'liq ismingiz" autoCapitalize="words" />
              )}
              <Field label="Email" value={f.email} onChangeText={v.onAuthField.email} placeholder="siz@example.com" keyboardType="email-address" />
              <Field label="Parol" value={f.password} onChangeText={v.onAuthField.password} placeholder="Kamida 6 belgi" secureTextEntry />
              {signup && (
                <Field label="Tug'ilgan yil" value={f.birthYear} onChangeText={v.onAuthField.birthYear} placeholder="Masalan: 1998" keyboardType="number-pad" />
              )}

              <TouchableOpacity onPress={v.submitAuth} activeOpacity={0.85} disabled={v.authBusy}
                style={[st.primary, v.authBusy && { opacity: 0.7 }]}>
                {v.authBusy
                  ? <ActivityIndicator color={C.ink} />
                  : <Text style={st.primaryText}>{signup ? "Ro'yxatdan o'tish" : 'Kirish'}</Text>}
              </TouchableOpacity>

              {/* Kelajakda: Google / Telefon (M1 — dev build) */}
              <View style={st.divider}>
                <View style={st.hr} /><Text style={st.dividerText}>yoki</Text><View style={st.hr} />
              </View>
              <View style={st.soonBtn}>
                <GoogleIcon size={18} />
                <Text style={st.soonText}>Google · tez orada</Text>
              </View>
              <View style={st.soonBtn}>
                <Text style={[st.soonText, { marginLeft: 0 }]}>Telefon (SMS) · tez orada</Text>
              </View>

              <Text style={st.note}>Ro'yxatdan o'tib, shaxsiy, oila, ta'lim va ishxona makonlaridan foydalaning</Text>
            </FadeIn>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const st = StyleSheet.create({
  scroll: { paddingHorizontal: 28, paddingTop: 70, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  glow: { position: 'absolute', width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(217,179,106,0.13)' },
  bismillah: { fontFamily: F.arabic, fontSize: 18, color: C.goldD, marginBottom: 12, textAlign: 'center' },
  brand: { fontFamily: F.serifBold, fontSize: 42, letterSpacing: 6, color: C.cream, paddingLeft: 6 },
  rule: { width: 40, height: 2, backgroundColor: C.gold, marginTop: 10, marginBottom: 14 },
  lede: { fontFamily: F.regular, fontSize: 14, lineHeight: 21, color: C.sageMid, maxWidth: 260, textAlign: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, marginBottom: 20 },
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
  hr: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { fontFamily: F.regular, fontSize: 12, color: C.sageFaint },
  soonBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 10, opacity: 0.55,
  },
  soonText: { fontFamily: F.semibold, fontSize: 14, color: C.sageMid, marginLeft: 0 },
  note: { marginTop: 18, fontFamily: F.regular, fontSize: 12, color: C.sageFaint, textAlign: 'center', lineHeight: 18 },
});
