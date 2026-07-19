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

// Yorug' (kunduzgi) — qorong'i rejimdek UYG'UN: och sage-yashil fon + oq kartalar.
// Bir yashil oila (fon ozgina to'qroq, kartalar ochroq); teal chegara bilan ajraladi.
const light = {
  gold: '#B98C38', goldL: '#CFA24C', goldD: '#9C7328', amber: '#B9822B', emerald: '#236B5D',
  cream: '#1C2723',           // asosiy matn (och fonda to'q) — karta va fon ikkalasi och
  onBg: '#22312A', onBgDim: 'rgba(34,49,42,0.60)',  // fon (sage) ustidagi matn — to'q
  sage: '#586459', sageMid: '#45524A', sageDim: '#8A968D', sageFaint: '#6E7C72',
  red: '#C0553F', blue: '#2F7EA6', blueL: '#276487', purple: '#6E52A0',
  ink: '#173E36',             // oltin tugma ustidagi matn
  card: '#FFFFFF', cardAlt: '#EEF3EF',
  border: 'rgba(35,107,93,0.20)', borderStrong: 'rgba(35,107,93,0.42)',
  hairline: 'rgba(28,39,35,0.08)',
  overlay1: 'rgba(28,39,35,0.03)', overlay2: 'rgba(28,39,35,0.05)', overlay3: 'rgba(28,39,35,0.08)',
  bg: ['#DAE5DF', '#D0DDD6', '#C7D6CE'],    // yumshoq sage-yashil sahifa foni
  radialTop: ['#F7FAF8', '#EFF4F1', '#E8EFEA'],  // overlay/lock/onboarding — ochroq
  cardGrad: ['#FFFFFF', '#F5F9F6'],   // oq kartalar (feature)
  sheet: ['#FBFCFA', '#F2F6F3'],
  scrim: '#D0DDD6',
  statusBarStyle: 'dark',
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
