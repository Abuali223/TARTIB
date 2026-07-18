import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { Magnetometer } from 'expo-sensors';
import { C, F } from '../theme';
import { OverlayShell } from '../components/ui';

const SIZE = 290;

// Shortest-arc low-pass filter so the needle doesn't jitter or spin the long way round
function smoothHeading(prev, next, alpha = 0.25) {
  let d = ((next - prev + 540) % 360) - 180;
  return (prev + d * alpha + 360) % 360;
}

export default function QiblaOverlay({ v }) {
  const bearing = v.qibla.bearing;
  const [heading, setHeading] = useState(0);
  const [sensorOk, setSensorOk] = useState(null); // null = probing, true, false
  const headingRef = useRef(0);
  const centerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let sub = null, alive = true;
    (async () => {
      const available = await Magnetometer.isAvailableAsync().catch(() => false);
      if (!alive) return;
      if (!available) { setSensorOk(false); return; }
      setSensorOk(true);
      Magnetometer.setUpdateInterval(80);
      sub = Magnetometer.addListener(({ x, y }) => {
        // Device held flat, portrait: angle of magnetic north
        let deg = Math.atan2(y, x) * (180 / Math.PI);
        deg = (deg + 360 + 270) % 360; // rotate into screen-up = north convention
        const h = smoothHeading(headingRef.current, 360 - deg);
        headingRef.current = h;
        setHeading(h);
      });
    })();
    return () => { alive = false; sub && sub.remove(); };
  }, []);

  // Emulator / no-sensor fallback: rotate the rose with a finger, like the mockup
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      centerRef.current = { x: locationX, y: locationY };
    },
    onPanResponderMove: (e) => {
      const { locationX, locationY } = e.nativeEvent;
      const cx = SIZE / 2, cy = SIZE / 2;
      let a = Math.atan2(locationY - cy, locationX - cx) * 180 / Math.PI + 90;
      a = (a + 360) % 360;
      headingRef.current = a;
      setHeading(a);
    },
  })).current;

  const marker = ((bearing - heading) % 360 + 360) % 360;
  const aligned = marker < 8 || marker > 352;
  const manual = sensorOk === false;

  return (
    <OverlayShell title="Qibla" onClose={v.close} radial>
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 14, paddingHorizontal: 24, paddingBottom: 40 }}>
        <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.sage }}>{v.qibla.cityName} · Qibla {bearing}°</Text>
        <Text style={{ fontFamily: F.bold, fontSize: 16, marginTop: 8, color: aligned ? C.emerald : C.sage }}>
          {aligned ? "Qibla to'g'ri yo'nalishda ✓" : 'Telefonni aylantiring'}
        </Text>

        <View style={{ width: SIZE, height: SIZE, marginTop: 26, marginBottom: 20 }} {...(manual ? pan.panHandlers : {})}>
          {/* fixed top pointer */}
          <View style={st.pointer} />
          {/* rotating rose */}
          <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${-heading}deg` }] }]}>
            <View style={st.rose} />
            <Text style={[st.cardinal, { top: 12, alignSelf: 'center', color: C.red }]}>N</Text>
            <Text style={[st.cardinal, { bottom: 12, alignSelf: 'center' }]}>S</Text>
            <Text style={[st.cardinal, { left: 12, top: SIZE / 2 - 10 }]}>W</Text>
            <Text style={[st.cardinal, { right: 12, top: SIZE / 2 - 10 }]}>E</Text>
            {/* Kaaba marker at the qibla bearing */}
            <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${bearing}deg` }] }]}>
              <View style={st.kaabaWrap}>
                <View style={st.kaaba}><View style={st.kaabaBand} /></View>
                <Text style={{ fontFamily: F.extrabold, fontSize: 10, color: C.gold, letterSpacing: 0.5 }}>QIBLA</Text>
              </View>
            </View>
          </View>
          {/* needle pointing at the qibla relative to heading */}
          <View style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${marker}deg` }] }]}>
            <View style={st.needle} />
          </View>
          <View style={st.hub} />
        </View>

        <Text style={{ fontFamily: F.extrabold, fontSize: 40, color: C.cream, fontVariant: ['tabular-nums'] }}>{Math.round(heading)}°</Text>
        <Text style={{ fontFamily: F.regular, fontSize: 13, color: C.sageFaint, marginTop: 6, textAlign: 'center', lineHeight: 19 }}>
          {manual
            ? "Sensor topilmadi — kompasni barmoq bilan aylantirib,\nQibla belgisini yuqoridagi o'qqa moslang"
            : "Telefonni tekis ushlab aylantiring —\nQibla belgisi yuqoridagi o'qqa kelsin"}
        </Text>
      </View>
    </OverlayShell>
  );
}

const st = StyleSheet.create({
  pointer: {
    position: 'absolute', top: -4, alignSelf: 'center', zIndex: 5,
    width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 14,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: C.gold,
  },
  rose: {
    ...StyleSheet.absoluteFillObject, borderRadius: SIZE / 2,
    backgroundColor: '#0b241b', borderWidth: 1, borderColor: 'rgba(217,179,106,0.25)',
  },
  cardinal: { position: 'absolute', fontFamily: F.bold, fontSize: 14, color: C.sage },
  kaabaWrap: { position: 'absolute', top: 34, alignSelf: 'center', alignItems: 'center', gap: 5 },
  kaaba: {
    width: 34, height: 34, borderRadius: 7, backgroundColor: '#0d0d0d',
    borderWidth: 2, borderColor: C.gold, overflow: 'hidden',
    shadowColor: C.gold, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  kaabaBand: { position: 'absolute', top: 9, left: 0, right: 0, height: 5, backgroundColor: C.gold },
  needle: {
    position: 'absolute', top: SIZE / 2 - 105, left: SIZE / 2 - 1.5,
    width: 3, height: 105, borderRadius: 3, backgroundColor: C.gold, opacity: 0.9,
  },
  hub: {
    position: 'absolute', top: SIZE / 2 - 8, left: SIZE / 2 - 8, width: 16, height: 16, borderRadius: 8,
    backgroundColor: C.gold, zIndex: 6,
    shadowColor: C.gold, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
});
