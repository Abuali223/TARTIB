// TARTIB palette & typography — mavzuli (to'q / yorug').
// Muhim: ikkala palitrada KALITLAR bir xil — faqat qiymatlar farq qiladi.
// Shu bois butun ilovada C.gold, C.cream, C.sage... nomlari o'zgarmaydi;
// useC() joriy mavzuning palitrasini qaytaradi.
import { createContext, useContext } from 'react';

// To'q yashil (asl / standart)
const dark = {
  gold: '#D9B36A', goldL: '#E8C87E', goldD: '#C79A4E', amber: '#E8B45F', emerald: '#43C08D',
  cream: '#F2EBD9',            // asosiy matn (kartada)
  onBg: '#F2EBD9', onBgDim: '#A9C0B4',   // fon ustidagi matn (to'qda = kartadagidek)
  sage: '#8CA298', sageMid: '#A9C0B4', sageDim: '#5E7268', sageFaint: '#7E958A',
  red: '#E0785F', blue: '#6FB3E0', blueL: '#8FC4E8', purple: '#A98FE0',
  ink: '#08180F',             // oltin tugma ustidagi matn
  card: '#0e271f', cardAlt: '#0b241b',
  border: 'rgba(217,179,106,0.12)', borderStrong: 'rgba(217,179,106,0.25)',
  hairline: 'rgba(255,255,255,0.05)',
  overlay1: 'rgba(255,255,255,0.03)', overlay2: 'rgba(255,255,255,0.06)', overlay3: 'rgba(255,255,255,0.10)',
  bg: ['#0a1f18', '#071510', '#050f0b'],
  radialTop: ['#12402d', '#0a2117', '#050f0a'],
  cardGrad: ['#14402f', '#0b2a1f'],
  sheet: ['#102c22', '#0a1f18'],
  scrim: '#0a1f18',
  statusBarStyle: 'light',
};

// Yorug' (kunduzgi) — brend teal-yashil fon + YARIM-SHAFFOF (glassy) kartalar.
// Kartalar fon bilan uyg'un (fon ko'rinib turadi), oltin chegara bilan ajraladi.
// Matn — OCH (ko'rinadi), qorong'i rejimdagidek.
const light = {
  gold: '#EEC271', goldL: '#F3D089', goldD: '#DDB055', amber: '#F0BE6A', emerald: '#5CD3A2',
  cream: '#FCFAF4',           // asosiy matn — yorqin oq (to'liq ko'rinadi)
  onBg: '#FCFAF4', onBgDim: '#D4E0D9',
  sage: '#C6D6CC', sageMid: '#DBE6DF', sageDim: '#A6B8AE', sageFaint: '#B6C6BD',
  red: '#F09A82', blue: '#8FC8EC', blueL: '#A8D4F0', purple: '#C0AAEC',
  ink: '#123A31',             // oltin tugma ustidagi matn (to'q)
  card: 'rgba(255,255,255,0.10)', cardAlt: 'rgba(255,255,255,0.06)',
  border: 'rgba(238,194,113,0.34)', borderStrong: 'rgba(238,194,113,0.5)',
  hairline: 'rgba(255,255,255,0.11)',
  overlay1: 'rgba(255,255,255,0.06)', overlay2: 'rgba(255,255,255,0.09)', overlay3: 'rgba(255,255,255,0.13)',
  bg: ['#1A6355', '#155249', '#123F37'],   // brend teal-yashil fon
  radialTop: ['#1A6355', '#134139', '#0E332C'],  // overlay/lock/onboarding — teal
  cardGrad: ['rgba(255,255,255,0.13)', 'rgba(255,255,255,0.07)'],   // glassy feature kartalar
  sheet: ['#175448', '#123F37'],
  scrim: '#1A6355',
  statusBarStyle: 'light',
};

export const THEMES = { dark, light };

// Font oilalari (App.js'da yuklanadi) — mavzudan mustaqil
export const F = {
  serif: 'Spectral_600SemiBold',
  serifBold: 'Spectral_700Bold',
  arabic: 'Amiri_400Regular',
  arabicBold: 'Amiri_700Bold',
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
};

// Standart (to'q) palitra — kontekstsiz import qilinganda ham xavfsiz ishlaydi.
// Modul darajasidagi StyleSheet.create'lar shu (to'q) qiymatlarni oladi;
// komponent ichida useC() bilan joriy mavzu ranglari qo'llanadi.
export const C = dark;

const ThemeContext = createContext(dark);
export const ThemeProvider = ThemeContext.Provider;
export function useC() { return useContext(ThemeContext); }
