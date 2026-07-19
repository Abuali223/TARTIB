import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { F, useC } from '../theme';
import { FadeIn, ProgressRing, SectionTitle, StatusPill } from '../components/ui';
import { BeadsIcon, CheckIcon, ChevronDown, CompassIcon } from '../components/icons';
import { t } from '../lib/i18n';

export default function Bugun({ v }) {
  const C = useC();
  const st = mkSt(C);
  return (
    <FadeIn style={st.wrap}>
      {/* header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <View>
          <TouchableOpacity onPress={v.open.workspace} activeOpacity={0.8} style={st.modeBtn}>
            <Text style={st.modeBtnText}>{v.modeLabel}</Text>
            <ChevronDown />
          </TouchableOpacity>
          <Text style={st.date}>{v.gregDate}</Text>
          <Text style={st.greet}>{t(v.greet)}, {v.meName}</Text>
          <Text style={st.hijri}>۩ {v.hijriDate}</Text>
        </View>
        <TouchableOpacity onPress={v.open.settings} activeOpacity={0.8} style={st.avatarBtn}>
          <Text style={{ fontFamily: F.serif, fontSize: 18, color: C.gold }}>{v.meInitial}</Text>
        </TouchableOpacity>
      </View>

      {/* next prayer card */}
      <LinearGradient colors={C.cardGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.prayerCard}>
        <Text style={st.crescentWatermark}>☾</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={st.kicker}>{t('KEYINGI NAMOZ')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 7 }}>
              <Text style={{ fontFamily: F.serif, fontSize: 30, color: C.cream }}>{t(v.next.name)}</Text>
              <Text style={{ fontFamily: F.arabic, fontSize: 20, color: C.gold }}>{v.next.ar}</Text>
            </View>
            <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sage, marginTop: 3 }}>{t('Vaqti')} · {v.next.time}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: F.regular, fontSize: 11, color: C.sage }}>{t('qoldi')}</Text>
            <Text style={{ fontFamily: F.extrabold, fontSize: 22, color: C.gold, marginTop: 2, fontVariant: ['tabular-nums'] }}>{v.next.countdown}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={v.go.namoz} activeOpacity={0.85} style={st.prayerCta}>
          <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.goldL }}>{t('Barcha vaqtlar va Qibla')} →</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* daily goal ring + quick actions */}
      <View style={{ flexDirection: 'row', gap: 13, marginBottom: 20 }}>
        <View style={st.ringCard}>
          <ProgressRing size={104} strokeWidth={9} progress={v.goalTotal ? v.goalDone / v.goalTotal : 0}>
            <Text style={{ fontFamily: F.extrabold, fontSize: 24, color: C.cream }}>{v.goalPct}%</Text>
            <Text style={{ fontFamily: F.regular, fontSize: 10, color: C.sage }}>{v.goalDone}/{v.goalTotal}</Text>
          </ProgressRing>
          <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.cream, marginTop: 10 }}>{t('Kunlik maqsad')}</Text>
        </View>
        <View style={{ flex: 1, gap: 13 }}>
          <TouchableOpacity onPress={v.open.tasbeh} activeOpacity={0.85} style={st.quickBtn}>
            <View style={[st.quickIcon, { backgroundColor: 'rgba(217,179,106,0.14)' }]}><BeadsIcon /></View>
            <View>
              <Text style={st.quickTitle}>{t('Tasbeh')}</Text>
              <Text style={st.quickSub}>{t('Zikr sanagich')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={v.open.qibla} activeOpacity={0.85} style={st.quickBtn}>
            <View style={[st.quickIcon, { backgroundColor: 'rgba(67,192,141,0.14)' }]}><CompassIcon /></View>
            <View>
              <Text style={st.quickTitle}>{t('Qibla')}</Text>
              <Text style={st.quickSub}>{t("Yo'nalish")}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* today's amals */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 2, marginTop: 4, marginBottom: 12 }}>
        <SectionTitle onBg>{t('Bugungi amallar')}</SectionTitle>
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.onBgDim }}>{v.goalDone}/{v.goalTotal} {t('bajarildi')}</Text>
      </View>
      <View style={st.card}>
        {v.amals.map((a, i) => (
          <TouchableOpacity key={a.id} onPress={a.onToggle} activeOpacity={0.7}
            style={[st.amalRow, i < v.amals.length - 1 && { borderBottomWidth: 1, borderBottomColor: C.hairline }]}>
            <View style={[st.amalBox, a.done ? { borderColor: C.emerald, backgroundColor: C.emerald } : { borderColor: C.borderStrong }]}>
              {a.done && <CheckIcon />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: a.done ? C.sage : C.cream, textDecorationLine: a.done ? 'line-through' : 'none' }}>{t(a.name)}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.sageFaint, marginTop: 2 }}>{t(a.sub)}</Text>
            </View>
            {!!a.ar && <Text style={{ fontFamily: F.arabic, fontSize: 17, color: C.goldD }}>{a.ar}</Text>}
          </TouchableOpacity>
        ))}
      </View>

      {/* tasks assigned to me (global inbox — barcha makonlardan) */}
      {v.myTasks.length > 0 && (
        <>
          <View style={{ marginHorizontal: 2, marginTop: 22, marginBottom: 12 }}>
            <SectionTitle onBg>{t('Menga berilgan vazifalar')}</SectionTitle>
          </View>
          {v.myTasks.map(task => (
            <TouchableOpacity key={task.id} onPress={task.onOpen} activeOpacity={0.85} style={st.taskCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream }}>{t(task.title)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    {!!task.wsLabel && (
                      <View style={st.wsTag}><Text style={st.wsTagText}>{t(task.wsLabel)}</Text></View>
                    )}
                    <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.sage }}>{task.assignerName} · {t(task.due)}</Text>
                  </View>
                </View>
                <StatusPill meta={task.statusMeta} />
              </View>
              {task.isPending && (
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                  <TouchableOpacity onPress={task.onAccept} activeOpacity={0.85} style={st.acceptBtn}>
                    <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.ink }}>{t('Qabul qilish')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={task.onReject} activeOpacity={0.85} style={st.rejectBtn}>
                    <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.red }}>{t('Rad etish')}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </>
      )}
    </FadeIn>
  );
}

const mkSt = (C) => StyleSheet.create({
  wrap: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28 },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 99,
    backgroundColor: 'rgba(217,179,106,0.12)', borderWidth: 1, borderColor: 'rgba(217,179,106,0.28)', marginBottom: 9,
  },
  modeBtnText: { fontFamily: F.bold, fontSize: 12, color: C.gold },
  wsTag: { paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, backgroundColor: 'rgba(111,179,224,0.16)' },
  wsTagText: { fontFamily: F.bold, fontSize: 10, color: '#8FC4E8' },
  date: { fontFamily: F.regular, fontSize: 13, color: C.onBgDim, letterSpacing: 0.3 },
  greet: { fontFamily: F.serif, fontSize: 25, color: C.onBg, marginTop: 3 },
  hijri: { fontFamily: F.arabic, fontSize: 14, color: C.goldD, marginTop: 3 },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(217,179,106,0.1)',
    borderWidth: 1, borderColor: 'rgba(217,179,106,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  prayerCard: {
    borderRadius: 24, padding: 22, borderWidth: 1, borderColor: 'rgba(217,179,106,0.24)',
    marginBottom: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3,
  },
  crescentWatermark: { position: 'absolute', right: -18, top: -24, fontFamily: F.arabic, fontSize: 130, color: 'rgba(217,179,106,0.07)', lineHeight: 140 },
  kicker: { fontFamily: F.regular, fontSize: 11, color: C.sage, letterSpacing: 1.1 },
  prayerCta: {
    marginTop: 18, paddingVertical: 12, borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(217,179,106,0.14)', borderWidth: 1, borderColor: 'rgba(217,179,106,0.32)',
  },
  ringCard: {
    flex: 1, borderRadius: 22, paddingVertical: 18, paddingHorizontal: 14,
    backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: 'center',
  },
  quickBtn: {
    flex: 1, borderRadius: 20, padding: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
    flexDirection: 'row', alignItems: 'center', gap: 11,
  },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickTitle: { fontFamily: F.bold, fontSize: 14, color: C.cream },
  quickSub: { fontFamily: F.regular, fontSize: 11, color: C.sage },
  card: { borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  amalRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 15, paddingHorizontal: 16 },
  amalBox: { width: 26, height: 26, borderRadius: 9, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  taskCard: { borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 11 },
  acceptBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: C.emerald, alignItems: 'center' },
  rejectBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(224,120,95,0.5)', alignItems: 'center' },
});
