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
  gold: '#E2B562', goldL: '#EFCB80', goldD: '#CFA24C', amber: '#E8B45F', emerald: '#43C08D',
  cream: '#F3EEE1',           // asosiy matn — och (glassy karta va fon ustida ko'rinadi)
  onBg: '#F3EEE1', onBgDim: '#BCCFC5',
  sage: '#A7BCB0', sageMid: '#C2D2C8', sageDim: '#7E948A', sageFaint: '#95A99E',
  red: '#E88C74', blue: '#7FBEE6', blueL: '#9BCDEE', purple: '#B39BE6',
  ink: '#123A31',             // oltin tugma ustidagi matn (to'q)
  card: 'rgba(255,255,255,0.07)', cardAlt: 'rgba(255,255,255,0.045)',
  border: 'rgba(226,181,98,0.30)', borderStrong: 'rgba(226,181,98,0.45)',
  hairline: 'rgba(255,255,255,0.09)',
  overlay1: 'rgba(255,255,255,0.05)', overlay2: 'rgba(255,255,255,0.08)', overlay3: 'rgba(255,255,255,0.12)',
  bg: ['#1A6355', '#155249', '#123F37'],   // brend teal-yashil fon
  radialTop: ['#1A6355', '#134139', '#0E332C'],  // overlay/lock/onboarding — teal
  cardGrad: ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.05)'],   // glassy feature kartalar
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
