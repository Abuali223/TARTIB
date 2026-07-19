import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { BackIcon } from './icons';
import { C, F } from '../theme';
import { t } from '../lib/i18n';

// Mount fade-in, mirrors the design's `tartibFade` keyframe
export function FadeIn({ style, children, duration = 350 }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration, useNativeDriver: true }),
      Animated.timing(ty, { toValue: 0, duration, useNativeDriver: true }),
    ]).start();
  }, []);
  return <Animated.View style={[style, { opacity: op, transform: [{ translateY: ty }] }]}>{children}</Animated.View>;
}

// Full-screen overlay wrapper: gradient bg + back button + serif title
export function OverlayShell({ title, onClose, radial = false, children }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <FadeIn style={{ flex: 1 }} duration={250}>
        <LinearGradient
          colors={radial ? ['#12402d', '#0a1f17', '#071510'] : ['#0a1f18', '#050f0b']}
          style={{ flex: 1 }}
        >
          <View style={sh.header}>
            <TouchableOpacity onPress={onClose} style={sh.backBtn} activeOpacity={0.7}>
              <BackIcon />
            </TouchableOpacity>
            <Text style={sh.title}>{title}</Text>
          </View>
          {children}
        </LinearGradient>
      </FadeIn>
    </View>
  );
}

const sh = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 54, paddingHorizontal: 20, paddingBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(217,179,106,0.2)', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.serif, fontSize: 22, color: C.cream },
});

// Circular progress ring (SVG), progress: 0..1
export function ProgressRing({ size = 104, strokeWidth = 9, progress = 0, color = C.gold, track = 'rgba(255,255,255,0.07)', children }) {
  const DASH = 326.7;
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 120 120" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={60} cy={60} r={52} fill="none" stroke={track} strokeWidth={strokeWidth} />
        <Circle cx={60} cy={60} r={52} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={`${DASH}`} strokeDashoffset={DASH * (1 - clamped)} />
      </Svg>
      <View style={{ ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

// Custom switch matching the design's gold/emerald palette
export function Toggle({ on, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={{ width: 46, height: 28, borderRadius: 99, padding: 3, backgroundColor: on ? C.emerald : 'rgba(255,255,255,0.14)' }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', transform: [{ translateX: on ? 18 : 0 }] }} />
    </TouchableOpacity>
  );
}

// Selectable chip
export function Chip({ label, active, onPress, style, textStyle }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={[{
        paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1,
        backgroundColor: active ? 'rgba(217,179,106,0.16)' : 'rgba(255,255,255,0.04)',
        borderColor: active ? 'rgba(217,179,106,0.5)' : 'rgba(255,255,255,0.08)',
      }, style]}>
      <Text style={[{ fontFamily: F.bold, fontSize: 14, color: active ? C.gold : C.sage }, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function SectionTitle({ children, style }) {
  return <Text style={[{ fontFamily: F.serif, fontSize: 19, color: C.cream }, style]}>{children}</Text>;
}

// Status pill for task states
export function StatusPill({ meta }) {
  return (
    <View style={{ paddingVertical: 5, paddingHorizontal: 11, borderRadius: 99, backgroundColor: meta.bg, flexShrink: 0 }}>
      <Text style={{ fontFamily: F.bold, fontSize: 11, color: meta.color }} numberOfLines={1}>{t(meta.label)}</Text>
    </View>
  );
}

// Type badge (Vazifa / Eslatma)
export function TypeBadge({ type }) {
  const isR = type === 'eslatma';
  return (
    <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, backgroundColor: isR ? 'rgba(111,179,224,0.18)' : 'rgba(217,179,106,0.16)', alignSelf: 'flex-start' }}>
      <Text style={{ fontFamily: F.extrabold, fontSize: 10, letterSpacing: 0.3, color: isR ? C.blueL : C.gold }}>{isR ? t('Eslatma') : t('Vazifa')}</Text>
    </View>
  );
}

// Member avatar block
export function Avatar({ name, color, size = 46, radius = 14, fontSize = 18 }) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center', backgroundColor: color + '22', borderWidth: 1, borderColor: color + '55' }}>
      <Text style={{ fontFamily: F.serif, fontSize, color }}>{(name || '?')[0]}</Text>
    </View>
  );
}

// Solid primary button
export function PrimaryBtn({ label, onPress, style, color = C.gold, textColor = C.ink }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}
      style={[{ paddingVertical: 15, borderRadius: 16, backgroundColor: color, alignItems: 'center' }, style]}>
      <Text style={{ fontFamily: F.extrabold, fontSize: 15, color: textColor }}>{label}</Text>
    </TouchableOpacity>
  );
}
