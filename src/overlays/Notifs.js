import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { F, useC } from '../theme';
import { OverlayShell, StatusPill } from '../components/ui';
import { BellIcon } from '../components/icons';
import { t } from '../lib/i18n';

// Bildirishnomalar — sizga kelgan vazifa va eslatmalar. Yangi (javob berilmagan)
// vazifalar tepada, oltin nuqta bilan belgilanadi. Bosilsa vazifa ochiladi.
export default function NotifsOverlay({ v }) {
  const C = useC();
  const st = mkSt(C);
  const list = (v.myTasks || []).slice().sort((a, b) => (b.isPending ? 1 : 0) - (a.isPending ? 1 : 0));

  return (
    <OverlayShell title={t('Bildirishnomalar')} onClose={v.close}>
      {list.length === 0 ? (
        <View style={st.empty}>
          <View style={st.emptyIcon}><BellIcon color={C.sageDim} size={30} /></View>
          <Text style={st.emptyT}>{t('Hozircha bildirishnoma yo‘q')}</Text>
          <Text style={st.emptySub}>{t('Kimdir sizga vazifa yoki eslatma yuborsa, shu yerda ko‘rinadi.')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {v.newTaskCount > 0 && (
            <Text style={st.newLine}>{v.newTaskCount} {t('ta yangi vazifa javobingizni kutmoqda')}</Text>
          )}
          {list.map((task) => (
            <TouchableOpacity key={task.id} onPress={task.onOpen} activeOpacity={0.85}
              style={[st.row, task.isPending && st.rowNew]}
              accessibilityRole="button" accessibilityLabel={t(task.title)}>
              {task.isPending && <View style={st.dot} />}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={st.title}>{t(task.title)}</Text>
                <View style={st.metaRow}>
                  {!!task.wsLabel && <View style={st.wsTag}><Text style={st.wsTagText}>{t(task.wsLabel)}</Text></View>}
                  <Text numberOfLines={1} style={st.meta}>{task.assignerName} · {t(task.due)}</Text>
                </View>
              </View>
              <StatusPill meta={task.statusMeta} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </OverlayShell>
  );
}

const mkSt = (C) => StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.overlay1, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyT: { fontFamily: F.serif, fontSize: 20, color: C.cream, textAlign: 'center' },
  emptySub: { fontFamily: F.regular, fontSize: 14, color: C.sageMid, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  newLine: { fontFamily: F.bold, fontSize: 13, color: C.gold, marginBottom: 14, marginHorizontal: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 16, marginBottom: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  rowNew: { borderColor: C.borderStrong, backgroundColor: 'rgba(238,194,113,0.10)' },
  dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: C.gold },
  title: { fontFamily: F.bold, fontSize: 15, color: C.cream },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  meta: { fontFamily: F.regular, fontSize: 12, color: C.sage },
  wsTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 7, backgroundColor: 'rgba(143,200,236,0.14)' },
  wsTagText: { fontFamily: F.bold, fontSize: 10.5, color: C.blueL },
});
