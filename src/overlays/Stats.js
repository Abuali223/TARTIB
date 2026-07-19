import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { C, F } from '../theme';
import { Avatar, OverlayShell } from '../components/ui';
import { t } from '../lib/i18n';

export default function StatsOverlay({ v }) {
  return (
    <OverlayShell title={t('Statistika')} onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={[st.card, { padding: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
            <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream }}>{t('Namoz — bu hafta')}</Text>
            <Text style={{ fontFamily: F.extrabold, fontSize: 22, color: C.emerald }}>{v.overallPct}%</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {v.prayerWeek.map((d, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 7, height: '100%', justifyContent: 'flex-end' }}>
                <View style={{ width: '100%', borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, minHeight: 6, height: `${d.p}%`, backgroundColor: d.color }} />
                <Text style={{ fontFamily: F.regular, fontSize: 11, color: C.sageFaint }}>{t(d.d)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[st.card, { padding: 18 }]}>
          <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream, marginBottom: 14 }}>{t('Odat streaklari')}</Text>
          <View style={{ gap: 12 }}>
            {v.habits.map((h, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ flex: 1, fontFamily: F.regular, fontSize: 14, color: '#C6D4CC' }}>{t(h.name)}</Text>
                <Text style={{ fontFamily: F.extrabold, fontSize: 13, color: C.gold }}>{h.streak} {t('kun')}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[st.card, { padding: 18, marginBottom: 0 }]}>
          <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.cream, marginBottom: 14 }}>{t(v.roleLabel)} {t('reytingi')}</Text>
          <View style={{ gap: 14 }}>
            {v.leaderboard.map(m => (
              <View key={m.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text style={{ width: 20, fontFamily: F.extrabold, fontSize: 15, color: C.sageFaint }}>{m.rank}</Text>
                <Avatar name={m.name} color={m.color} size={34} radius={11} fontSize={14} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.cream }}>{m.name}</Text>
                  <View style={st.barTrack}>
                    <View style={{ height: '100%', borderRadius: 99, width: `${m.pct}%`, backgroundColor: m.color }} />
                  </View>
                </View>
                <Text style={{ fontFamily: F.bold, fontSize: 13, color: C.sageMid }}>{m.pct}%</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </OverlayShell>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, marginBottom: 16 },
  barTrack: { height: 5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.07)', overflow: 'hidden', marginTop: 6 },
});
