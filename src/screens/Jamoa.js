import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { C, F } from '../theme';
import { Avatar, FadeIn, PrimaryBtn, ProgressRing, SectionTitle, StatusPill, TypeBadge } from '../components/ui';
import { ChevronDown, ChevronRight, PersonIcon } from '../components/icons';

function RoleBadge({ role, isMgr }) {
  return (
    <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 7, backgroundColor: isMgr ? 'rgba(217,179,106,0.16)' : 'rgba(111,179,224,0.15)' }}>
      <Text style={{ fontFamily: F.bold, fontSize: 11, color: isMgr ? C.gold : C.blueL }}>{role}</Text>
    </View>
  );
}

export default function Jamoa({ v }) {
  return (
    <FadeIn style={st.wrap}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <View>
          <TouchableOpacity onPress={v.open.workspace} activeOpacity={0.8} style={st.modeBtn}>
            <Text style={{ fontFamily: F.bold, fontSize: 12, color: C.gold }}>Makon almashtirish</Text>
            <ChevronDown />
          </TouchableOpacity>
          <Text style={st.h2}>{v.modeLabel}</Text>
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.sage, marginTop: 2 }}>{v.jamoaSub}</Text>
        </View>
        {v.canManage && (
          <TouchableOpacity onPress={v.open.addmember} activeOpacity={0.85} style={st.addBtn}>
            <Text style={{ fontFamily: F.medium, fontSize: 22, color: C.gold, lineHeight: 26 }}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {v.isShaxsiy && (
        <LinearGradient colors={['#14402f', '#0b2a1f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.shaxsiyCard}>
          <View style={st.shaxsiyIcon}><PersonIcon size={30} /></View>
          <Text style={{ fontFamily: F.serif, fontSize: 20, color: C.cream }}>Shaxsiy makon</Text>
          <Text style={st.shaxsiyText}>Bu yerda faqat o'zingiz uchun ibodat, zikr va odatlaringizni yuritasiz. Jamoa bilan ishlash uchun oila, ta'lim yoki ishxona makonini tanlang.</Text>
          <PrimaryBtn label="Makon tanlash" onPress={v.open.workspace} style={{ width: '100%', paddingVertical: 14 }} />
        </LinearGradient>
      )}

      {v.canManage && (
        <>
          {/* board summary */}
          <LinearGradient colors={['#14402f', '#0b2a1f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.boardCard}>
            <View style={{ flexDirection: 'row', marginBottom: 14 }}>
              <View style={st.boardCol}><Text style={[st.boardNum, { color: C.gold }]}>{v.board.send}</Text><Text style={st.boardLabel}>Yuborildi</Text></View>
              <View style={st.vr} />
              <View style={st.boardCol}><Text style={[st.boardNum, { color: C.amber }]}>{v.board.prog}</Text><Text style={st.boardLabel}>Jarayonda</Text></View>
              <View style={st.vr} />
              <View style={st.boardCol}><Text style={[st.boardNum, { color: C.emerald }]}>{v.board.done}</Text><Text style={st.boardLabel}>Bajarildi</Text></View>
            </View>
            <View style={st.barTrack}>
              <LinearGradient colors={[C.gold, C.emerald]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', borderRadius: 99, width: `${v.board.pct}%` }} />
            </View>
            <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.sageMid, marginTop: 8, textAlign: 'center' }}>Umumiy bajarilish: {v.board.pct}%</Text>
          </LinearGradient>
          <PrimaryBtn label="+ Eslatma yoki vazifa yuborish" onPress={v.open.assign} style={{ marginBottom: 22 }} />

          {/* members */}
          <SectionTitle style={{ marginHorizontal: 2, marginBottom: 12 }}>{v.membersLabel}</SectionTitle>
          {v.members.length === 0 && (
            <TouchableOpacity onPress={v.open.addmember} activeOpacity={0.85} style={st.emptyCard}>
              <Text style={st.emptyTitle}>Hali a'zo yo'q</Text>
              <Text style={st.emptyText}>Taklif kodini ulashing — a'zolar qo'shilgach shu yerda ko'rinadi.</Text>
              <Text style={st.emptyAction}>+ Taklif kodini olish</Text>
            </TouchableOpacity>
          )}
          <View style={{ gap: 11, marginBottom: 24 }}>
            {v.members.map(m => (
              <TouchableOpacity key={m.id} onPress={m.onOpen} activeOpacity={0.85} style={st.memberRow}>
                <Avatar name={m.name} color={m.color} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.cream }}>{m.name}</Text>
                    {m.online && <View style={st.onlineDot} />}
                    <RoleBadge role={m.role} isMgr={m.isMgr} />
                  </View>
                  <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.sage, marginTop: 1 }}>{m.label} · {m.doneCount}/{m.totalCount} vazifa</Text>
                  <View style={st.memberBarTrack}>
                    <View style={{ height: '100%', borderRadius: 99, width: `${m.pct}%`, backgroundColor: m.color }} />
                  </View>
                </View>
                <ChevronRight />
              </TouchableOpacity>
            ))}
          </View>

          {/* recent assignments */}
          <SectionTitle style={{ marginHorizontal: 2, marginBottom: 12 }}>So'nggi topshiriqlar</SectionTitle>
          {v.jamoaTasks.length === 0 && (
            <View style={st.emptyCard}>
              <Text style={st.emptyText}>Hali topshiriq yuborilmagan. Yuqoridagi tugma orqali vazifa yoki eslatma yuboring.</Text>
            </View>
          )}
          <View style={{ gap: 11 }}>
            {v.jamoaTasks.map(t => (
              <TouchableOpacity key={t.id} onPress={t.onOpen} activeOpacity={0.85} style={st.taskRow}>
                <Avatar name={t.assigneeName} color={t.assigneeColor} size={40} radius={12} fontSize={15} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TypeBadge type={t.type} />
                    <Text numberOfLines={1} style={{ flex: 1, fontFamily: F.bold, fontSize: 15, color: C.cream }}>{t.title}</Text>
                  </View>
                  <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.sage, marginTop: 2 }}>{t.assigneeName} · {t.due}</Text>
                </View>
                <StatusPill meta={t.statusMeta} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {v.isChildTeam && (
        <>
          <LinearGradient colors={['#14402f', '#0b2a1f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.boardCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <ProgressRing size={64} strokeWidth={12} progress={v.myTotal ? v.myDone / v.myTotal : 0} color={C.emerald} track="rgba(255,255,255,0.08)">
                <Text style={{ fontFamily: F.extrabold, fontSize: 15, color: C.cream }}>{v.myPct}%</Text>
              </ProgressRing>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.cream }}>Sizning natijangiz</Text>
                <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sageMid, marginTop: 3 }}>{v.myDone}/{v.myTotal} topshiriq bajarildi. Barakalla!</Text>
              </View>
            </View>
          </LinearGradient>
          <SectionTitle style={{ marginHorizontal: 2, marginBottom: 12 }}>Sizga berilgan topshiriqlar</SectionTitle>
          <View style={{ gap: 11 }}>
            {v.myTasks.map(t => (
              <View key={t.id} style={st.taskCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ marginBottom: 5 }}><TypeBadge type={t.type} /></View>
                    <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream }}>{t.title}</Text>
                    <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.sage, marginTop: 3 }}>{t.assignerName} · {t.due}</Text>
                  </View>
                  <StatusPill meta={t.statusMeta} />
                </View>
                {t.isReminder && t.notDone && (
                  <TouchableOpacity onPress={t.onComplete} activeOpacity={0.85} style={st.ackBtn}>
                    <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.blue }}>Tushunarli ✓</Text>
                  </TouchableOpacity>
                )}
                {t.isPending && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                    <TouchableOpacity onPress={t.onAccept} activeOpacity={0.85} style={st.acceptBtn}>
                      <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.ink }}>Qabul qilish</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={t.onReject} activeOpacity={0.85} style={st.rejectBtn}>
                      <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.red }}>Rad etish</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {t.canStart && (
                  <TouchableOpacity onPress={t.onStart} activeOpacity={0.85} style={[st.fullBtn, { backgroundColor: C.amber }]}>
                    <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.ink }}>Boshlash</Text>
                  </TouchableOpacity>
                )}
                {t.canComplete && (
                  <TouchableOpacity onPress={t.onComplete} activeOpacity={0.85} style={[st.fullBtn, { backgroundColor: C.emerald }]}>
                    <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.ink }}>Bajarildi ✓</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </>
      )}
    </FadeIn>
  );
}

const st = StyleSheet.create({
  wrap: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28 },
  h2: { fontFamily: F.serif, fontSize: 30, color: C.cream },
  modeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingVertical: 5, paddingHorizontal: 12, borderRadius: 99,
    backgroundColor: 'rgba(217,179,106,0.12)', borderWidth: 1, borderColor: 'rgba(217,179,106,0.28)', marginBottom: 8,
  },
  addBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(217,179,106,0.12)',
    borderWidth: 1, borderColor: 'rgba(217,179,106,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  shaxsiyCard: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(217,179,106,0.2)', paddingVertical: 26, paddingHorizontal: 22, alignItems: 'center' },
  shaxsiyIcon: { width: 60, height: 60, borderRadius: 18, backgroundColor: 'rgba(217,179,106,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  shaxsiyText: { fontFamily: F.regular, fontSize: 14, color: C.sageMid, lineHeight: 21, textAlign: 'center', marginTop: 8, marginBottom: 18 },
  boardCard: { borderRadius: 22, borderWidth: 1, borderColor: 'rgba(217,179,106,0.2)', padding: 20, marginBottom: 20 },
  boardCol: { flex: 1, alignItems: 'center' },
  boardNum: { fontFamily: F.extrabold, fontSize: 26 },
  boardLabel: { fontFamily: F.regular, fontSize: 11, color: C.sage, marginTop: 2 },
  vr: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  barTrack: { height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.emerald },
  memberBarTrack: { height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 8 },
  taskRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  taskCard: { borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 16 },
  emptyCard: { borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed', padding: 18, marginBottom: 20, alignItems: 'center' },
  emptyTitle: { fontFamily: F.bold, fontSize: 15, color: C.cream, marginBottom: 6 },
  emptyText: { fontFamily: F.regular, fontSize: 13, color: C.sageMid, textAlign: 'center', lineHeight: 19 },
  emptyAction: { fontFamily: F.bold, fontSize: 13, color: C.gold, marginTop: 12 },
  ackBtn: {
    marginTop: 14, paddingVertical: 11, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(111,179,224,0.16)', borderWidth: 1, borderColor: 'rgba(111,179,224,0.4)',
  },
  acceptBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: C.emerald, alignItems: 'center' },
  rejectBtn: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(224,120,95,0.5)', alignItems: 'center' },
  fullBtn: { marginTop: 14, paddingVertical: 11, borderRadius: 12, alignItems: 'center' },
});
