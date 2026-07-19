import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { F, useC } from '../theme';
import { BriefcaseIcon, CheckIcon, ChevronRight, GradCapIcon, PersonIcon, UsersIcon } from '../components/icons';
import { t } from '../lib/i18n';

const TYPE_ICON = {
  oila: { Icon: UsersIcon, bg: 'rgba(67,192,141,0.14)', color: '#43C08D' },
  talim: { Icon: GradCapIcon, bg: 'rgba(169,143,224,0.14)', color: '#A98FE0' },
  ishxona: { Icon: BriefcaseIcon, bg: 'rgba(111,179,224,0.14)', color: '#6FB3E0' },
};

function Row({ active, onPress, iconBg, icon, title, sub, showCheck = true }) {
  const C = useC();
  const st = mkSt(C);
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[st.row, active ? st.rowActive : st.rowIdle]}>
      <View style={[st.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.cream }}>{title}</Text>
        {!!sub && <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.sage, marginTop: 1 }}>{sub}</Text>}
      </View>
      {showCheck && <View style={{ opacity: active ? 1 : 0 }}><CheckIcon size={18} color={C.emerald} strokeWidth={2.4} /></View>}
    </TouchableOpacity>
  );
}

export default function WorkspaceSheet({ v }) {
  const C = useC();
  const st = mkSt(C);
  const [screen, setScreen] = useState('list'); // list | create | join

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 32 }]}>
      <Pressable onPress={v.close} style={st.backdrop} />
      <KeyboardAvoidingView style={st.sheetWrap} pointerEvents="box-none" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <LinearGradient colors={C.sheet} style={st.sheet}>
          <View style={st.grabber} />

          {screen === 'list' && (
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 470 }}>
              <Text style={st.title}>{t('Makonni tanlang')}</Text>
              <Text style={st.sub}>{t('Bitta hisob — barcha makonlar')}</Text>

              <Row active={v.shaxsiyActive} onPress={v.onSelectShaxsiy} iconBg="rgba(217,179,106,0.14)" icon={<PersonIcon />} title={t('Shaxsiy')} sub={t("O'zim uchun ibodat va odatlar")} />

              {v.myWorkspaces.map(w => {
                const ic = TYPE_ICON[w.type] || TYPE_ICON.oila;
                const Icon = ic.Icon;
                return <Row key={w.id} active={w.active} onPress={w.onSelect} iconBg={ic.bg} icon={<Icon color={ic.color} />} title={w.name} sub={`${t(w.typeLabel)} · ${t(w.role)}`} />;
              })}

              {v.myWorkspaces.length === 0 && (
                <Text style={st.empty}>{t("Hali makoningiz yo'q. Yangi makon yarating yoki kod bilan qo'shiling.")}</Text>
              )}

              <TouchableOpacity onPress={() => setScreen('create')} activeOpacity={0.85} style={st.dashed}>
                <View style={[st.rowIcon, { backgroundColor: 'rgba(217,179,106,0.14)' }]}>
                  <Text style={{ fontFamily: F.medium, fontSize: 22, color: C.gold, lineHeight: 26 }}>+</Text>
                </View>
                <Text style={{ flex: 1, fontFamily: F.bold, fontSize: 16, color: C.gold }}>{t('Yangi makon yaratish')}</Text>
                <ChevronRight color={C.gold} />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setScreen('join')} activeOpacity={0.85} style={st.dashed}>
                <View style={[st.rowIcon, { backgroundColor: 'rgba(111,179,224,0.14)' }]}>
                  <Text style={{ fontFamily: F.medium, fontSize: 20, color: C.blue }}>#</Text>
                </View>
                <Text style={{ flex: 1, fontFamily: F.bold, fontSize: 16, color: C.blue }}>{t("Kod bilan qo'shilish")}</Text>
                <ChevronRight color={C.blue} />
              </TouchableOpacity>
            </ScrollView>
          )}

          {screen === 'create' && (
            <View>
              <Text style={st.title}>{t('Yangi makon')}</Text>
              <Text style={st.sub}>{t("Oila, ta'lim yoki ishxona")}</Text>
              <Text style={st.label}>{t('Turi')}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
                {v.wsTypeChips.map((ch, i) => {
                  const ic = TYPE_ICON[ch.k]; const Icon = ic.Icon;
                  return (
                    <TouchableOpacity key={i} onPress={ch.onPick} activeOpacity={0.85} style={[st.typeChip, ch.active && { borderColor: ic.color, backgroundColor: ic.color + '18' }]}>
                      <Icon color={ch.active ? ic.color : C.sage} />
                      <Text style={{ fontFamily: F.bold, fontSize: 13, color: ch.active ? C.cream : C.sage, marginTop: 6 }}>{t(ch.name)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={st.label}>{t('Nomi')}</Text>
              <TextInput value={v.wsDraft.name} onChangeText={v.onWsName} placeholder={t('Masalan: Karimovlar oilasi')} placeholderTextColor={C.sageDim} style={st.input} />
              <TouchableOpacity onPress={v.createWorkspace} activeOpacity={0.85} style={st.primary}>
                <Text style={st.primaryText}>{t('Yaratish')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setScreen('list')} activeOpacity={0.8} style={st.back}>
                <Text style={st.backText}>← {t('Orqaga')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {screen === 'join' && (
            <View>
              <Text style={st.title}>{t("Kod bilan qo'shilish")}</Text>
              <Text style={st.sub}>{t('Sizga berilgan taklif kodini kiriting')}</Text>
              <Text style={st.label}>{t('Taklif kodi')}</Text>
              <TextInput
                value={v.joinCode}
                onChangeText={v.onJoinCode}
                placeholder="Masalan: OILA-2K7Q"
                placeholderTextColor={C.sageDim}
                autoCapitalize="characters"
                autoCorrect={false}
                style={[st.input, { textAlign: 'center', fontFamily: F.extrabold, fontSize: 18, letterSpacing: 2 }]}
              />
              <TouchableOpacity onPress={v.submitJoin} activeOpacity={0.85} disabled={v.joinBusy} style={[st.primary, v.joinBusy && { opacity: 0.7 }]}>
                {v.joinBusy ? <ActivityIndicator color={C.ink} /> : <Text style={st.primaryText}>{t("Qo'shilish")}</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setScreen('list')} activeOpacity={0.8} style={st.back}>
                <Text style={st.backText}>← {t('Orqaga')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </KeyboardAvoidingView>
    </View>
  );
}

const mkSt = (C) => StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,12,8,0.6)' },
  sheetWrap: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: 1, borderTopColor: 'rgba(217,179,106,0.22)', paddingTop: 12, paddingHorizontal: 20, paddingBottom: 42 },
  grabber: { width: 40, height: 4, borderRadius: 99, backgroundColor: C.overlay3, alignSelf: 'center', marginBottom: 18 },
  title: { fontFamily: F.serif, fontSize: 22, color: C.cream, marginBottom: 3 },
  sub: { fontFamily: F.regular, fontSize: 13, color: C.sage, marginBottom: 18 },
  empty: { fontFamily: F.regular, fontSize: 13, color: C.sageFaint, textAlign: 'center', paddingVertical: 10, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', paddingVertical: 15, paddingHorizontal: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1 },
  rowActive: { backgroundColor: 'rgba(217,179,106,0.12)', borderColor: 'rgba(217,179,106,0.4)' },
  rowIdle: { backgroundColor: C.cardAlt, borderColor: C.hairline },
  rowIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  dashed: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%', paddingVertical: 15, paddingHorizontal: 16, borderRadius: 16, marginBottom: 8, borderWidth: 1, borderColor: C.overlay3, borderStyle: 'dashed' },
  label: { fontFamily: F.bold, fontSize: 13, color: C.sageMid, marginBottom: 10, marginHorizontal: 2 },
  typeChip: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 16, borderWidth: 2, borderColor: 'transparent', backgroundColor: C.overlay1 },
  input: { paddingVertical: 15, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: 'rgba(217,179,106,0.18)', color: C.cream, fontFamily: F.medium, fontSize: 15, marginBottom: 20 },
  primary: { paddingVertical: 16, borderRadius: 16, backgroundColor: C.gold, alignItems: 'center' },
  primaryText: { fontFamily: F.extrabold, fontSize: 16, color: C.ink },
  back: { paddingVertical: 12, alignItems: 'center' },
  backText: { fontFamily: F.medium, fontSize: 14, color: C.sageFaint },
});
