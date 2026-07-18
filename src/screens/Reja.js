import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { C, F } from '../theme';
import { FadeIn, SectionTitle } from '../components/ui';

const CELL_GAP = 4;

export default function Reja({ v }) {
  return (
    <FadeIn style={st.wrap}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={st.h2}>Reja</Text>
        <TouchableOpacity onPress={v.open.assign} activeOpacity={0.85} style={st.addBtn}>
          <Text style={{ fontFamily: F.bold, fontSize: 24, color: C.ink, lineHeight: 28 }}>+</Text>
        </TouchableOpacity>
      </View>
      <Text style={st.sub}>{v.monthLabel}</Text>

      {/* calendar */}
      <View style={st.calCard}>
        <View style={st.grid}>
          {v.daysUz.map((d, i) => (
            <View key={i} style={st.cellBox}>
              <Text style={{ fontFamily: F.bold, fontSize: 11, color: C.sageFaint }}>{d}</Text>
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
      <SectionTitle style={{ marginHorizontal: 2, marginTop: 4, marginBottom: 14 }}>Kun tartibi</SectionTitle>
      <View style={{ paddingLeft: 6 }}>
        {v.timeline.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 14, paddingBottom: 18 }}>
            <Text style={st.tlTime}>{t.time}</Text>
            <View style={{ alignItems: 'center' }}>
              <View style={[st.tlDot, { borderColor: t.color, backgroundColor: t.done ? t.color : 'transparent' }]} />
              {i < v.timeline.length - 1 && <View style={st.tlLine} />}
            </View>
            <View style={{ flex: 1, paddingBottom: 4 }}>
              <Text style={{ fontFamily: F.semibold, fontSize: 15, color: t.done ? C.sage : C.cream, textDecorationLine: t.done ? 'line-through' : 'none' }}>{t.title}</Text>
              <Text style={{ fontFamily: F.regular, fontSize: 12, color: C.sageFaint, marginTop: 2 }}>{t.type}</Text>
            </View>
          </View>
        ))}
      </View>
    </FadeIn>
  );
}

const st = StyleSheet.create({
  wrap: { paddingTop: 52, paddingHorizontal: 20, paddingBottom: 28 },
  h2: { fontFamily: F.serif, fontSize: 30, color: C.cream },
  sub: { fontFamily: F.regular, fontSize: 14, color: C.sage, marginBottom: 18 },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  calCard: { borderRadius: 22, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: CELL_GAP, marginBottom: 8 },
  cellBox: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayCell: { borderRadius: 11 },
  taskDot: { position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: 2 },
  tlTime: { width: 52, textAlign: 'right', fontFamily: F.bold, fontSize: 13, color: C.sage, paddingTop: 1, fontVariant: ['tabular-nums'] },
  tlDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, marginTop: 3 },
  tlLine: { width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 2 },
});
