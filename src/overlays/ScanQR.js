import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { F, useC } from '../theme';
import { OverlayShell } from '../components/ui';
import { t } from '../lib/i18n';

// QR skaner — taklif QR kodini o'qib, kodni Root'ga uzatadi (v.onScanned).
// Bu overlay FAQAT kamera moduli bor bo'lganda (yangi APK) render qilinadi.
export default function ScanQROverlay({ v }) {
  const C = useC();
  const st = mkSt(C);
  const [perm, requestPerm] = useCameraPermissions();
  const [done, setDone] = useState(false);

  const onBarcode = ({ data }) => {
    if (done) return;
    setDone(true);
    v.onScanned && v.onScanned(data);
  };

  return (
    <OverlayShell title={t('QR skanerlash')} onClose={v.close}>
      <View style={st.wrap}>
        <Text style={st.sub}>{t('Taklif QR kodini kameraga ko‘rsating')}</Text>

        {!perm ? (
          <Text style={st.msg}>{t('Kamera tekshirilmoqda…')}</Text>
        ) : !perm.granted ? (
          <View style={st.permBox}>
            <Text style={st.msg}>{t('QR kodni skanerlash uchun kamera ruxsati kerak.')}</Text>
            <TouchableOpacity onPress={requestPerm} activeOpacity={0.85} style={st.btn}>
              <Text style={st.btnT}>{t('Kamera ruxsatini berish')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={st.camBox}>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={done ? undefined : onBarcode}
            />
            <View pointerEvents="none" style={st.frame} />
            {done && (
              <View style={st.okOverlay}><Text style={st.okText}>{t('O‘qildi ✓')}</Text></View>
            )}
          </View>
        )}

        <Text style={st.hint}>{t('Yoki oldingi ekranда kodni qo‘lда kiriting.')}</Text>
      </View>
    </OverlayShell>
  );
}

const mkSt = (C) => StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 24, paddingTop: 10, alignItems: 'center' },
  sub: { fontFamily: F.regular, fontSize: 14, color: C.sageMid, textAlign: 'center', marginBottom: 22 },
  msg: { fontFamily: F.regular, fontSize: 15, color: C.sageMid, textAlign: 'center', marginTop: 30, lineHeight: 22 },
  permBox: { alignItems: 'center', marginTop: 20 },
  btn: { marginTop: 20, paddingVertical: 14, paddingHorizontal: 26, borderRadius: 16, backgroundColor: C.gold },
  btnT: { fontFamily: F.extrabold, fontSize: 15, color: C.ink },
  camBox: {
    width: 280, height: 280, borderRadius: 28, overflow: 'hidden',
    backgroundColor: '#000', borderWidth: 1, borderColor: C.border, marginTop: 6,
  },
  frame: {
    position: 'absolute', top: 30, left: 30, right: 30, bottom: 30,
    borderWidth: 3, borderColor: C.gold, borderRadius: 18, opacity: 0.9,
  },
  okOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(18,63,55,0.65)' },
  okText: { fontFamily: F.extrabold, fontSize: 20, color: C.cream },
  hint: { fontFamily: F.regular, fontSize: 13, color: C.sage, textAlign: 'center', marginTop: 26, lineHeight: 19 },
});
