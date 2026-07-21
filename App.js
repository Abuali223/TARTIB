import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Spectral_600SemiBold, Spectral_700Bold } from '@expo-google-fonts/spectral';
import {
  Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { Amiri_400Regular, Amiri_700Bold } from '@expo-google-fonts/amiri';
import Root from './src/Root';
import { C } from './src/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    Spectral_600SemiBold, Spectral_700Bold,
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
    Amiri_400Regular, Amiri_700Bold,
    // KFGQPC Uthmanic Hafs — Qur'on matni uchun (Madina mushafi uslubi)
    UthmanicHafs: require('./assets/fonts/UthmanicHafs.otf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a1f18', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a1f18' }}>
      <StatusBar style="light" />
      <Root />
    </View>
  );
}
