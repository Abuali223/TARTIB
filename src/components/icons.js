import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export const BackIcon = ({ color = '#D9B36A' }) => (
  <Svg width={10} height={18} viewBox="0 0 10 18">
    <Path d="M9 1 L1 9 L9 17" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChevronRight = ({ color = '#5E7268' }) => (
  <Svg width={8} height={14} viewBox="0 0 8 14">
    <Path d="M1 1 l6 6 -6 6" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const ChevronDown = ({ color = '#D9B36A' }) => (
  <Svg width={9} height={6} viewBox="0 0 10 6">
    <Path d="M1 1 L5 5 L9 1" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CheckIcon = ({ size = 15, color = '#08180F', strokeWidth = 2.6, opacity = 1 }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16" opacity={opacity}>
    <Path d="M2.5 8 L6.5 12 L13.5 4" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const BeadsIcon = ({ color = '#D9B36A', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={6} cy={7} r={2.3} fill={color} />
    <Circle cx={12} cy={10} r={2.3} fill={color} />
    <Circle cx={18} cy={7} r={2.3} fill={color} />
    <Path d="M4 19 h16" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const CompassIcon = ({ color = '#43C08D', size = 22, dot = true }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={1.6} />
    <Path d="M14.5 9.5 L10.5 13.5 L9.5 14.5 L13.5 10.5 Z" fill={color} />
    {dot && <Circle cx={12} cy={12} r={1.2} fill={color} />}
  </Svg>
);

export const BookIcon = ({ color = '#EEC271', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 5 C10 3.6 7.5 3.4 5 4 v14 c2.5-.6 5-.4 7 1 2-1.4 4.5-1.6 7-1 V4 c-2.5-.6-5-.4-7 1 Z"
      fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    <Path d="M12 5 v15" fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
  </Svg>
);

export const TrashIcon = ({ color = '#F09A82', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 7 h16 M9 7 V5 a1 1 0 0 1 1-1 h4 a1 1 0 0 1 1 1 v2 M6.5 7 l0.9 12 a1.4 1.4 0 0 0 1.4 1.3 h6.4 a1.4 1.4 0 0 0 1.4-1.3 L18.5 7"
      fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const BellIcon = ({ color = '#F2EBD9', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M18 16 H6 a1 1 0 0 1-.8-1.6 C6 13.5 6.5 12.5 6.5 10.5 a5.5 5.5 0 0 1 11 0 c0 2 .5 3 1.3 3.9 A1 1 0 0 1 18 16 Z"
      fill="none" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M10 19 a2 2 0 0 0 4 0" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);

export const MosqueIcon = ({ color = '#6FB3E0', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={2.6} r={0.9} fill={color} />
    <Path d="M8 11 a4 3.5 0 0 1 8 0" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    <Path d="M7 11 v9 M17 11 v9" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    <Path d="M3.6 20 h16.8" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    <Path d="M3.6 20 v-8 M20.4 20 v-8" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    <Circle cx={3.6} cy={11} r={1} fill={color} />
    <Circle cx={20.4} cy={11} r={1} fill={color} />
    <Path d="M10 20 v-3.4 a2 2 0 0 1 4 0 V20" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PersonIcon = ({ color = '#D9B36A', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={8} r={3.6} fill="none" stroke={color} strokeWidth={1.8} />
    <Path d="M5 20 a7 7 0 0 1 14 0" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const UsersIcon = ({ color = '#43C08D', size = 22, strokeWidth = 1.8 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={9} cy={9} r={3} fill="none" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M3.5 19 a5.5 5.5 0 0 1 11 0" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx={17} cy={10} r={2.3} fill="none" stroke={color} strokeWidth={strokeWidth - 0.2} />
    <Path d="M15.8 19 a4.5 4.5 0 0 1 5.2-4.3" fill="none" stroke={color} strokeWidth={strokeWidth - 0.2} strokeLinecap="round" />
  </Svg>
);

export const SmallUsersIcon = ({ color = '#6FB3E0', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={9} cy={9} r={3} fill="none" stroke={color} strokeWidth={1.8} />
    <Path d="M3.5 19 a5.5 5.5 0 0 1 11 0" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const GradCapIcon = ({ color = '#A98FE0', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M2 8 L12 4 L22 8 L12 12 Z" fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
    <Path d="M6 10 V15 c0 1.6 2.7 3 6 3 s6 -1.4 6 -3 V10" fill="none" stroke={color} strokeWidth={1.6} />
  </Svg>
);

export const BriefcaseIcon = ({ color = '#6FB3E0', size = 22 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={4} y={8} width={16} height={12} rx={2} fill="none" stroke={color} strokeWidth={1.8} />
    <Path d="M9 8 V6 a2 2 0 0 1 2-2 h2 a2 2 0 0 1 2 2 v2" fill="none" stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const HomeIcon = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 11 L12 4 L20 11 V20 H4 Z" fill="none" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Path d="M9 20 v-4 a3 3 0 0 1 6 0 v4" fill="none" stroke={color} strokeWidth={1.7} />
  </Svg>
);

export const CrescentIcon = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M17.5 12.5 A6 6 0 1 1 11.5 6.5 A4.6 4.6 0 1 0 17.5 12.5 Z" fill={color} />
  </Svg>
);

export const CalendarIcon = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x={4} y={5.5} width={16} height={15} rx={2.5} fill="none" stroke={color} strokeWidth={1.7} />
    <Path d="M4 10 H20 M8 3 V6.5 M16 3 V6.5" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);

export const ProfileTabIcon = ({ color, size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={8} r={3.6} fill="none" stroke={color} strokeWidth={1.7} />
    <Path d="M5 20 a7 7 0 0 1 14 0" fill="none" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </Svg>
);

export const StatsIcon = ({ color = '#D9B36A', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M4 20 V10 M10 20 V4 M16 20 V13 M22 20 V7" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
  </Svg>
);

export const BigCheckIcon = ({ color = '#43C08D', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M20 6 L9 17 L4 12" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const GearIcon = ({ color = '#A9C0B4', size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx={12} cy={12} r={3} fill="none" stroke={color} strokeWidth={1.8} />
    <Path d="M12 2 v3 M12 19 v3 M2 12 h3 M19 12 h3 M5 5 l2 2 M17 17 l2 2 M19 5 l-2 2 M7 17 l-2 2" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
  </Svg>
);

export const GoogleIcon = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M22.5 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.9c-.3 1.4-1 2.6-2.2 3.4v2.8h3.6c2.1-2 3.2-4.9 3.2-8.1z" />
    <Path fill="#34A853" d="M12 23c2.9 0 5.3-1 7.1-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.5 1.1-2.7 0-5-1.8-5.9-4.3H2.4v2.9C4.2 20.8 7.8 23 12 23z" />
    <Path fill="#FBBC05" d="M6.1 14.3c-.2-.7-.4-1.4-.4-2.3s.1-1.6.4-2.3V6.8H2.4C1.5 8.5 1 10.4 1 12s.5 3.5 1.4 5.2l3.7-2.9z" />
    <Path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.1 1.6l3-3C16.3 2.1 14.3 1 12 1 7.8 1 4.2 3.2 2.4 6.8l3.7 2.9C7 7.2 9.3 5.4 12 5.4z" />
  </Svg>
);

export const LogoMark = ({ size = 120 }) => (
  <Svg width={size} height={size} viewBox="0 0 120 120">
    <Circle cx={60} cy={60} r={52} fill="none" stroke="rgba(217,179,106,0.25)" strokeWidth={1} />
    <Path d="M78 60 A26 26 0 1 1 52 34 A20 20 0 1 0 78 60 Z" fill="#D9B36A" />
    <Path d="M84 44 l2.4 5.2 5.6 .7 -4.2 3.9 1.1 5.6 -4.9 -2.9 -4.9 2.9 1.1 -5.6 -4.2 -3.9 5.6 -.7 z" fill="#E8C87E" />
  </Svg>
);
