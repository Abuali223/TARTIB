import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { F, useC } from '../theme';
import { FadeIn, SectionTitle } from '../components/ui';
import { t } from '../lib/i18n';

const CELL_GAP = 4;

export default function Reja({ v }) {
  const C = useC();
  const st = mkSt(C);
  return (
    <FadeIn style={st.wrap}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={st.h2}>{t('Reja')}</Text>
        <TouchableOpacity onPress={v.open.assign} activeOpacity={0.85} style={st.addBtn}>
          <Text style={{ fontFamily: F.bold, fontSize: 24, color: C.ink, lineHeight: 28 }}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={st.sub}>{t(v.monthLabel)}</Text>

      {/* calendar */}
      <View style={st.calCard}>
        <View style={st.grid}>
          {v.daysUz.map((d, i) => (
            <View key={i} style={st.cellBox}>
              <Text style={{ fontFamily: F.bold, fontSize: 11, color: C.sageFaint }}>{t(d)}</Text>
            </View>
          ))}
        </View>
        <View style={st.grid}>
          {v.cells.map(c => c.blank ? (
            <View key={c.key} style={st.cellBox} />
          ) : (
            <TouchableOpacity key={c.key} onPress={c.onSelect} activeOpacity={0.7}
              style={[st.cellBox, st.dayCell,
                c.selected && { backgroundColor: C.gold },
                !c.selected && c.today && { backgroundColor: 'rgba(217,179,106,0.14)', borderWidth: 1, borderColor: 'rgba(217,179,106,0.4)' },
              ]}>
              <Text style={{
                fontFamily: c.selected ? F.extrabold : F.semibold, fontSize: 14,
                color: c.selected ? C.ink : c.today ? C.gold : C.cream,
              }}>{c.num}</Text>
              {c.hasTask && <View style={[st.taskDot, { backgroundColor: c.selected ? C.ink : C.emerald }]} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* day timeline */}
      <SectionTitle onBg style={{ marginHorizontal: 2, marginTop: 4, marginBottom: 14 }}>{t('Kun tartibi')}</SectionTitle>
      <View style={{ paddingLeft: 6 }}>
        {v.timeline.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 14, paddingBottom: 18 }}>
            <Text style={st.tlTime}>{item.time}</Text>
            <View style={{ alignItems: 'center' }}>
              <View style={[st.tlDot, { borderColor: item.color, backgroundColor: item.done ? item.color : 'transparent' }]} />
              {i < v.timeline.length - 1 && <View style={st.tlLine} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 4 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: item.done ? C.onBgDim : C.onBg, textDecorationLine: item.done ? 'line-through' : 'none' }}>{t(item.title)}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.onBgDim, marginTop: 2 }}>{t(item.type)}</Text>
            </View>
          </View>
        ))}
      </View>
    </FadeIn>
  );
}

const mkSt = (C) => StyleSheet.create({
  wrap: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28 },
  h2: { fontFamily: F.serif, fontSize: 30, color: C.onBg },
  sub: { fontFamily: F.regular, fontSize: 14, color: C.onBgDim, marginBottom: 18 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  calCard: { borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: CELL_GAP, marginBottom: 8 },
  cellBox: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCell: { borderRadius: 11 },
  taskDot: { position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: 2 },
  tlTime: { width: 52, textAlign: 'right', fontFamily: F.bold, fontSize: 13, color: C.onBgDim, paddingTop: 1, fontVariant: ['tabular-nums'] },
  tlDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 3 },
  tlLine: { width: 2, flex: 1, backgroundColor: C.overlay3, marginTop: 2 },
});
