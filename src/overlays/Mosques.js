import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { F, useC } from '../theme';
import { OverlayShell } from '../components/ui';
import { MosqueIcon } from '../components/icons';
import { fetchNearbyMosques, fmtDistance, mapUrl } from '../lib/mosques';
import { t } from '../lib/i18n';

// Eng yaqin masjidlar ro'yxati (OpenStreetMap). Joylashuvni oladi, izlaydi,
// masofa bo'yicha tartiblab ko'rsatadi. Har birini xaritada ochish mumkin.
export default function MosquesOverlay({ v }) {
  const C = useC();
  const st = mkSt(C);
  const [state, setState] = useState({ phase: 'loading', list: [], msg: '' });

  const load = async () => {
    setState({ phase: 'loading', list: [], msg: '' });
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        setState({ phase: 'noperm', list: [], msg: '' });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      let list = await fetchNearbyMosques(latitude, longitude, 5000);
      if (!list.length) list = await fetchNearbyMosques(latitude, longitude, 15000);  // radiusni kengaytirish
      setState({ phase: list.length ? 'ok' : 'empty', list, msg: '' });
    } catch (e) {
      setState({ phase: 'error', list: [], msg: '' });
    }
  };

  useEffect(() => { load(); }, []);

  const openMap = (m) => { Linking.openURL(mapUrl(m)).catch(() => {}); };

  return (
    <OverlayShell title={t('Yaqin masjidlar')} onClose={v.close}>
      <View style={{ flex: 1 }}>
        {state.phase === 'loading' && (
          <View style={st.center}>
            <ActivityIndicator color={C.gold} size="large" />
            <Text style={st.msg}>{t('Yaqin masjidlar qidirilmoqda…')}</Text>
          </View>
        )}

        {state.phase === 'noperm' && (
          <View style={st.center}>
            <Text style={st.msg}>{t('Masjidlarni topish uchun joylashuv ruxsati kerak.')}</Text>
            <TouchableOpacity onPress={load} activeOpacity={0.85} style={st.btn}>
              <Text style={st.btnT}>{t('Ruxsat berish')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {(state.phase === 'error' || state.phase === 'empty') && (
          <View style={st.center}>
            <Text style={st.msg}>
              {state.phase === 'empty'
                ? t('Yaqin atrofda masjid topilmadi.')
                : t('Internet yoki xizmatda muammo. Qaytadan urining.')}
            </Text>
            <TouchableOpacity onPress={load} activeOpacity={0.85} style={st.btn}>
              <Text style={st.btnT}>{t('Qaytadan')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {state.phase === 'ok' && (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
            <Text style={st.hint}>{t('Sizga eng yaqin masjidlar (OpenStreetMap). Bosib xaritada oching.')}</Text>
            {state.list.map((m) => (
              <TouchableOpacity key={m.id} onPress={() => openMap(m)} activeOpacity={0.85} style={st.row}
                accessibilityRole="button" accessibilityLabel={m.name + ', ' + fmtDistance(m.km)}>
                <View style={st.icon}><MosqueIcon color={C.blueL} size={22} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={st.name}>{m.name}</Text>
                  <Text style={st.dist}>{fmtDistance(m.km)} · {t('xaritada ochish')} →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </OverlayShell>
  );
}

const mkSt = (C) => StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 4 },
  msg: { fontFamily: F.regular, fontSize: 15, color: C.sageMid, textAlign: 'center', lineHeight: 22, marginTop: 14 },
  btn: { marginTop: 18, paddingVertical: 13, paddingHorizontal: 26, borderRadius: 14, backgroundColor: C.gold },
  btnT: { fontFamily: F.extrabold, fontSize: 15, color: C.ink },
  hint: { fontFamily: F.regular, fontSize: 13, color: C.sage, marginBottom: 14, lineHeight: 19 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 16, marginBottom: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(111,179,224,0.14)' },
  name: { fontFamily: F.bold, fontSize: 15, color: C.cream },
  dist: { fontFamily: F.regular, fontSize: 12.5, color: C.blueL, marginTop: 3 },
});
