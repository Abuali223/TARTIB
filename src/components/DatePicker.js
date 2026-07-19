import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { F, useC } from '../theme';
import { t } from '../lib/i18n';

const DOW = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
const MO = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

// JS-only oy kalendar tanlagich (native modul kerak emas — Expo Go'da ishlaydi).
// value: Date|null, onPick: (Date) => void. O'tgan kunlar tanlab bo'lmaydi.
export default function DatePicker({ value, onPick }) {
  const C = useC();
  const st = mkSt(C);
  const base = value || new Date();
  const [ym, setYm] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const firstDow = (new Date(ym.y, ym.m, 1).getDay() + 6) % 7; // 0 = Dushanba
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => setYm(s => (s.m <= 0 ? { y: s.y - 1, m: 11 } : { y: s.y, m: s.m - 1 }));
  const next = () => setYm(s => (s.m >= 11 ? { y: s.y + 1, m: 0 } : { y: s.y, m: s.m + 1 }));
  const sel = value ? { y: value.getFullYear(), m: value.getMonth(), d: value.getDate() } : null;

  return (
    <View style={st.card}>
      <View style={st.header}>
        <TouchableOpacity onPress={prev} activeOpacity={0.7} style={st.nav}><Text style={st.navT}>‹</Text></TouchableOpacity>
        <Text style={st.month}>{t(MO[ym.m])} {ym.y}</Text>
        <TouchableOpacity onPress={next} activeOpacity={0.7} style={st.nav}><Text style={st.navT}>›</Text></TouchableOpacity>
      </View>
      <View style={st.grid}>
        {DOW.map((d, i) => (<View key={'h' + i} style={st.cell}><Text style={st.dow}>{t(d)}</Text></View>))}
      </View>
      <View style={st.grid}>
        {cells.map((d, i) => {
          if (d === null) return <View key={'b' + i} style={st.cell} />;
          const date = new Date(ym.y, ym.m, d);
          const isPast = date < today;
          const isSel = sel && sel.y === ym.y && sel.m === ym.m && sel.d === d;
          const isToday = date.getTime() === today.getTime();
          return (
            <TouchableOpacity key={'d' + i} disabled={isPast} activeOpacity={0.7} onPress={() => onPick(date)} style={st.cell}>
              <View style={[
                st.day,
                isSel && { backgroundColor: C.gold },
                !isSel && isToday && { borderWidth: 1, borderColor: 'rgba(217,179,106,0.4)' },
              ]}>
                <Text style={{ fontFamily: isSel ? F.extrabold : F.semibold, fontSize: 14, color: isPast ? C.sageDim : isSel ? C.ink : isToday ? C.gold : C.cream }}>{d}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const mkSt = (C) => StyleSheet.create({
  card: { borderRadius: 18, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 14, marginBottom: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  nav: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.overlay2, alignItems: 'center', justifyContent: 'center' },
  navT: { fontFamily: F.bold, fontSize: 22, color: C.gold, lineHeight: 24 },
  month: { fontFamily: F.bold, fontSize: 15, color: C.cream },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dow: { fontFamily: F.bold, fontSize: 11, color: C.sageFaint },
  day: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});
