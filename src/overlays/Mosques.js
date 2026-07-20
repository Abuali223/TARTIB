import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { F, useC } from '../theme';
import { OverlayShell } from '../components/ui';
import { MosqueIcon } from '../components/icons';
import { fetchNearbyMosques, fmtDistance, mapUrl, mapsSearchUrl } from '../lib/mosques';
import { t } from '../lib/i18n';

// Eng yaqin masjidlar. Google Maps — ASOSIY, doim darrov ochiladi (Google'ning
// to'liq bazasi). Ichki OSM ro'yxati — qo'shimcha, tez ishlasa ko'rinadi, bo'lmasa
// jimgina o'tadi (foydalanuvchi hech qachon aylanib qolmaydi).
export default function MosquesOverlay({ v }) {
  const C = useC();
  const st = mkSt(C);
  const [coords, setCoords] = useState(null);
  const [osm, setOsm] = useState({ phase: 'loading', list: [] });  // loading | ok | none

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.status !== 'granted') { if (alive) setOsm({ phase: 'none', list: [] }); return; }

        // Joylashuv: oxirgi ma'lum (tez) -> joriy (12s timeout)
        let pos = await Location.getLastKnownPositionAsync().catch(() => null);
        if (!pos) {
          pos = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
            new Promise((res) => setTimeout(() => res(null), 12000)),
          ]).catch(() => null);
        }
        if (!pos || !pos.coords) { if (alive) setOsm({ phase: 'none', list: [] }); return; }
        if (alive) setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });

        // OSM — bitta urinish (8km), tez. Bo'lmasa Google Maps baribir bor.
        let list = [];
        try { list = await fetchNearbyMosques(pos.coords.latitude, pos.coords.longitude, 8000); } catch (e) { list = []; }
        if (alive) setOsm({ phase: list.length ? 'ok' : 'none', list });
      } catch (e) {
        if (alive) setOsm({ phase: 'none', list: [] });
      }
    })();
    return () => { alive = false; };
  }, []);

  const openMaps = () => { Linking.openURL(mapsSearchUrl(coords && coords.lat, coords && coords.lon)).catch(() => {}); };
  const openMap = (m) => { Linking.openURL(mapUrl(m)).catch(() => {}); };

  return (
    <OverlayShell title={t('Yaqin masjidlar')} onClose={v.close}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* ASOSIY: Google Maps — doim ishlaydi */}
        <TouchableOpacity onPress={openMaps} activeOpacity={0.9} style={st.mapsBtn}
          accessibilityRole="button" accessibilityLabel={t('Google Maps’da masjidlarni ochish')}>
          <Text style={st.mapsBtnT}>🗺  {t('Google Maps’da masjidlarni ochish')}</Text>
        </TouchableOpacity>
        <Text style={st.hint}>{t('Google Maps sizga eng yaqin masjidlarni xaritada ko‘rsatadi va yo‘l soladi.')}</Text>

        {/* QO'SHIMCHA: ichki ro'yxat (OSM) */}
        {osm.phase === 'loading' && (
          <View style={st.osmLoad}>
            <ActivityIndicator color={C.sage} />
            <Text style={st.osmLoadT}>{t('Yaqin masjidlar ro‘yxati yuklanmoqda…')}</Text>
          </View>
        )}

        {osm.phase === 'ok' && (
          <>
            <Text style={st.listTitle}>{t('Sizga eng yaqin masjidlar')}</Text>
            {osm.list.map((m) => (
              <TouchableOpacity key={m.id} onPress={() => openMap(m)} activeOpacity={0.85} style={st.row}
                accessibilityRole="button" accessibilityLabel={m.name + ', ' + fmtDistance(m.km)}>
                <View style={st.icon}><MosqueIcon color={C.blueL} size={22} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={st.name}>{m.name}</Text>
                  <Text style={st.dist}>{fmtDistance(m.km)} · {t('xaritada ochish')} →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        {osm.phase === 'none' && (
          <Text style={st.noneNote}>{t('Ichki ro‘yxat hozircha mavjud emas — yuqoridagi Google Maps orqali toping.')}</Text>
        )}
      </ScrollView>
    </OverlayShell>
  );
}

const mkSt = (C) => StyleSheet.create({
  mapsBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: C.blue, marginTop: 4 },
  mapsBtnT: { fontFamily: F.extrabold, fontSize: 15.5, color: C.ink },
  hint: { fontFamily: F.regular, fontSize: 13, color: C.sage, lineHeight: 19, marginTop: 12, marginBottom: 20, textAlign: 'center' },
  osmLoad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
  osmLoadT: { fontFamily: F.regular, fontSize: 13, color: C.sage },
  listTitle: { fontFamily: F.bold, fontSize: 14, color: C.sageMid, marginBottom: 12, marginHorizontal: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16,
    borderRadius: 16, marginBottom: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border,
  },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(111,179,224,0.14)' },
  name: { fontFamily: F.bold, fontSize: 15, color: C.cream },
  dist: { fontFamily: F.regular, fontSize: 12.5, color: C.blueL, marginTop: 3 },
  noneNote: { fontFamily: F.regular, fontSize: 13, color: C.sageFaint, textAlign: 'center', lineHeight: 19, paddingHorizontal: 10, marginTop: 6 },
});
