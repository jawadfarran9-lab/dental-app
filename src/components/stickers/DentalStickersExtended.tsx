/**
 * Extended Dental Sticker Designs (11–40) — Search Collection
 *
 * 30 premium dental-themed stickers with layered visuals, gradients,
 * dental iconography, and creative typography.
 * Shown via search in the GIF picker modal (dental, tooth, teeth, etc).
 *
 * Only shown to clinics where clinicType === 'dental'.
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { DentalStickerProps } from './DentalStickers';

const DENTAL_TAGS = ['dental', 'tooth', 'teeth', 'dentist', 'oral', 'smile', 'clinic'];

// ── 11. Upper Jaw Arc ──
export const DentalSticker11: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 20, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', borderWidth: 1.5, borderColor: '#A5B4FC' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {['🦷', '🦷', '🦷', '🦷', '🦷', '🦷'].map((t, i) => (
          <Text key={i} style={{ fontSize: 13, marginHorizontal: 0.5, transform: [{ scaleY: -1 }, { translateY: i === 0 || i === 5 ? 4 : i === 2 || i === 3 ? -1 : 1 }] }}>{t}</Text>
        ))}
      </View>
      <View style={{ height: 1.5, width: 64, backgroundColor: '#A5B4FC', borderRadius: 1, marginVertical: 4 }} />
      <Text style={{ color: '#4338CA', fontSize: 7, fontWeight: '800', letterSpacing: 1.5 }}>UPPER JAW</Text>
    </View>
  </View>);
};

// ── 12. Molar Closeup ──
export const DentalSticker12: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#6366F1', '#818CF8']} style={{ borderRadius: 18, width: 96, height: 96, justifyContent: 'center', alignItems: 'center' }}>
      <MaterialCommunityIcons name="tooth-outline" size={40} color="#FFF" />
      <Text style={{ color: '#E0E7FF', fontSize: 8, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 }}>MOLAR</Text>
    </LinearGradient>
  </View>);
};

// ── 13. Braces Fun ──
export const DentalSticker13: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#FFF1F2', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderWidth: 2, borderColor: '#FDA4AF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <View key={i} style={{ width: 14, height: 14, borderRadius: 3, borderWidth: 1.5, borderColor: '#F43F5E', backgroundColor: '#FFF', marginHorizontal: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#F43F5E' }} />
          </View>
        ))}
      </View>
      <View style={{ height: 1.5, width: 70, backgroundColor: '#FDA4AF', marginBottom: 4 }} />
      <Text style={{ color: '#BE123C', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>BRACES</Text>
    </View>
  </View>);
};

// ── 14. Whitening Glow ──
export const DentalSticker14: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#FEF9C3', '#FDE68A', '#FCD34D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 36 }}>🦷</Text>
      <View style={{ position: 'absolute', top: 10, right: 14 }}>
        <Text style={{ fontSize: 18 }}>✨</Text>
      </View>
      <View style={{ position: 'absolute', bottom: 10, left: 14 }}>
        <Text style={{ fontSize: 14 }}>⭐</Text>
      </View>
      <Text style={{ color: '#92400E', fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 2 }}>WHITENING</Text>
    </LinearGradient>
  </View>);
};

// ── 15. Dental Shield ──
export const DentalSticker15: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 96, height: 110, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="shield" size={80} color="#3B82F6" />
      <View style={{ position: 'absolute', top: 24 }}>
        <MaterialCommunityIcons name="tooth-outline" size={28} color="#FFF" />
      </View>
      <Text style={{ color: '#1D4ED8', fontSize: 7, fontWeight: '800', letterSpacing: 1.5, marginTop: -8 }}>PROTECTED</Text>
    </View>
  </View>);
};

// ── 16. Brushing Timer ──
export const DentalSticker16: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#F0FDFA', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderWidth: 2, borderColor: '#5EEAD4' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Ionicons name="timer" size={18} color="#0D9488" style={{ marginRight: 6 }} />
        <Text style={{ color: '#0F766E', fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] }}>2:00</Text>
      </View>
      <Text style={{ color: '#115E59', fontSize: 7, fontWeight: '700', letterSpacing: 1 }}>BRUSH TIME</Text>
    </View>
  </View>);
};

// ── 17. Cavity Free Badge ──
export const DentalSticker17: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#22C55E', '#16A34A']} style={{ borderRadius: 50, width: 96, height: 96, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 82, height: 82, borderRadius: 41, borderWidth: 2.5, borderColor: '#FFF', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcons name="tooth-outline" size={28} color="#FFF" />
        <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 2 }}>CAVITY</Text>
        <Text style={{ color: '#DCFCE7', fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>FREE!</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ── 18. Dental X-Ray ──
export const DentalSticker18: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#111827', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#4B5563' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <MaterialCommunityIcons key={i} name="tooth-outline" size={16} color={i === 2 ? '#60A5FA' : '#6B7280'} style={{ marginHorizontal: 1, opacity: i === 0 || i === 4 ? 0.5 : 0.8 }} />
        ))}
      </View>
      <Text style={{ color: '#9CA3AF', fontSize: 7, fontWeight: '700', letterSpacing: 2 }}>X-RAY SCAN</Text>
    </View>
  </View>);
};

// ── 19. Floss Reminder ──
export const DentalSticker19: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#EFF6FF', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', borderWidth: 2, borderColor: '#60A5FA' }}>
      <Text style={{ fontSize: 24, marginBottom: 4 }}>🧵</Text>
      <Text style={{ color: '#1D4ED8', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }}>DON'T FORGET</Text>
      <Text style={{ color: '#3B82F6', fontSize: 7, fontWeight: '700', letterSpacing: 1 }}>TO FLOSS!</Text>
    </View>
  </View>);
};

// ── 20. Dental Team ──
export const DentalSticker20: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#7C3AED', '#A78BFA']} style={{ borderRadius: 18, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Ionicons name="people" size={18} color="#FFF" style={{ marginRight: 6 }} />
        <MaterialCommunityIcons name="tooth-outline" size={18} color="#FFF" />
      </View>
      <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800', letterSpacing: 1.5 }}>DENTAL TEAM</Text>
    </LinearGradient>
  </View>);
};

// ── 21. Implant Tech ──
export const DentalSticker21: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#0F172A', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', borderWidth: 2, borderColor: '#38BDF8' }}>
      <View style={{ alignItems: 'center', marginBottom: 4 }}>
        <MaterialCommunityIcons name="tooth-outline" size={24} color="#38BDF8" />
        <View style={{ width: 3, height: 12, backgroundColor: '#38BDF8', borderRadius: 1, marginTop: -2 }} />
      </View>
      <Text style={{ color: '#7DD3FC', fontSize: 8, fontWeight: '800', letterSpacing: 1.5 }}>IMPLANT</Text>
    </View>
  </View>);
};

// ── 22. Root Canal ──
export const DentalSticker22: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#FEF2F2', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#FCA5A5' }}>
      <MaterialCommunityIcons name="tooth-outline" size={30} color="#EF4444" />
      <View style={{ position: 'absolute', top: 22, width: 2, height: 16, backgroundColor: '#EF4444', borderRadius: 1 }} />
      <Text style={{ color: '#991B1B', fontSize: 7, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 }}>ROOT CANAL</Text>
    </View>
  </View>);
};

// ── 23. Mint Fresh ──
export const DentalSticker23: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#99F6E4', '#5EEAD4', '#2DD4BF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 50, width: 96, height: 96, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 16, marginBottom: 2 }}>🌿</Text>
      <MaterialCommunityIcons name="tooth-outline" size={24} color="#FFF" />
      <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } }}>MINT FRESH</Text>
    </LinearGradient>
  </View>);
};

// ── 24. Orthodontics ──
export const DentalSticker24: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#FEFCE8', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', borderWidth: 2, borderColor: '#FDE047' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={{ marginHorizontal: 2, alignItems: 'center' }}>
            <Text style={{ fontSize: 12 }}>🦷</Text>
            <View style={{ width: 12, height: 2, backgroundColor: '#EAB308', borderRadius: 1, marginTop: -2 }} />
          </View>
        ))}
      </View>
      <Text style={{ color: '#854D0E', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>ORTHODONTICS</Text>
    </View>
  </View>);
};

// ── 25. Smile Meter ──
export const DentalSticker25: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#FFF', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', borderWidth: 2, borderColor: '#86EFAC', ...Platform.select({ ios: { shadowColor: '#22C55E', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }) }}>
      <Text style={{ color: '#166534', fontSize: 8, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>SMILE METER</Text>
      <View style={{ width: 70, height: 8, borderRadius: 4, backgroundColor: '#DCFCE7', overflow: 'hidden' }}>
        <LinearGradient colors={['#22C55E', '#4ADE80']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: '85%', height: '100%', borderRadius: 4 }} />
      </View>
      <Text style={{ color: '#16A34A', fontSize: 10, fontWeight: '900', marginTop: 4 }}>85% 😁</Text>
    </View>
  </View>);
};

// ── 26. Dental Care Heart ──
export const DentalSticker26: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 96, height: 100, justifyContent: 'center', alignItems: 'center' }}>
      <Ionicons name="heart" size={72} color="#F43F5E" />
      <View style={{ position: 'absolute', top: 22 }}>
        <MaterialCommunityIcons name="tooth-outline" size={26} color="#FFF" />
      </View>
      <Text style={{ color: '#BE123C', fontSize: 7, fontWeight: '800', letterSpacing: 1, marginTop: -6 }}>WE CARE</Text>
    </View>
  </View>);
};

// ── 27. Fluoride Boost ──
export const DentalSticker27: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#0EA5E9', '#0284C7', '#0369A1']} style={{ borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
        <Ionicons name="water" size={14} color="#BAE6FD" style={{ marginRight: 4 }} />
        <Text style={{ color: '#BAE6FD', fontSize: 8, fontWeight: '700', letterSpacing: 1 }}>FLUORIDE</Text>
      </View>
      <MaterialCommunityIcons name="tooth-outline" size={24} color="#FFF" />
      <Text style={{ color: '#E0F2FE', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 2 }}>BOOST</Text>
    </LinearGradient>
  </View>);
};

// ── 28. Dental Mirror ──
export const DentalSticker28: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#F8FAFC', borderRadius: 50, width: 96, height: 96, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#CBD5E1' }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#94A3B8' }}>
        <MaterialCommunityIcons name="tooth-outline" size={20} color="#64748B" />
      </View>
      <View style={{ width: 3, height: 16, backgroundColor: '#94A3B8', borderRadius: 1, marginTop: -1 }} />
      <Text style={{ color: '#475569', fontSize: 7, fontWeight: '700', letterSpacing: 1, marginTop: 2 }}>EXAM</Text>
    </View>
  </View>);
};

// ── 29. Smile Makeover ──
export const DentalSticker29: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#EC4899', '#F472B6', '#FBCFE8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' }}>
      <Text style={{ fontSize: 22, marginBottom: 2 }}>💄</Text>
      <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }}>SMILE</Text>
      <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }}>MAKEOVER</Text>
    </LinearGradient>
  </View>);
};

// ── 30. Dental Hygiene ──
export const DentalSticker30: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#ECFDF5', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderWidth: 2, borderColor: '#6EE7B7' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <MaterialCommunityIcons name="toothbrush-paste" size={20} color="#059669" />
        <View style={{ width: 1.5, height: 16, backgroundColor: '#A7F3D0', marginHorizontal: 8 }} />
        <MaterialCommunityIcons name="tooth-outline" size={20} color="#059669" />
      </View>
      <Text style={{ color: '#065F46', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>HYGIENE FIRST</Text>
    </View>
  </View>);
};

// ── 31. Tooth Fairy ──
export const DentalSticker31: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#C084FC', '#E9D5FF', '#F5F3FF']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ borderRadius: 20, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>🧚</Text>
      <Text style={{ fontSize: 14, marginTop: 2 }}>🦷</Text>
      <Text style={{ color: '#6B21A8', fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 2 }}>TOOTH FAIRY</Text>
    </LinearGradient>
  </View>);
};

// ── 32. Veneer Preview ──
export const DentalSticker32: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#FFFBEB', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', borderWidth: 2, borderColor: '#FDE68A' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <View style={{ width: 18, height: 22, borderRadius: 4, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#FBBF24', marginHorizontal: 2, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 10 }}>🦷</Text>
        </View>
        <Ionicons name="arrow-forward" size={12} color="#D97706" />
        <View style={{ width: 18, height: 22, borderRadius: 4, backgroundColor: '#FEF3C7', borderWidth: 1.5, borderColor: '#F59E0B', marginHorizontal: 2, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="sparkles" size={10} color="#F59E0B" />
        </View>
      </View>
      <Text style={{ color: '#92400E', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>VENEERS</Text>
    </View>
  </View>);
};

// ── 33. Emergency Dental ──
export const DentalSticker33: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#FEF2F2', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', borderWidth: 2.5, borderColor: '#EF4444' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Ionicons name="alert-circle" size={16} color="#DC2626" style={{ marginRight: 4 }} />
        <MaterialCommunityIcons name="tooth-outline" size={20} color="#DC2626" />
      </View>
      <Text style={{ color: '#991B1B', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>EMERGENCY</Text>
      <Text style={{ color: '#EF4444', fontSize: 7, fontWeight: '700', letterSpacing: 1 }}>DENTAL CARE</Text>
    </View>
  </View>);
};

// ── 34. Night Guard ──
export const DentalSticker34: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#1E1B4B', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', borderWidth: 1.5, borderColor: '#6366F1' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Ionicons name="moon" size={14} color="#A5B4FC" style={{ marginRight: 6 }} />
        <MaterialCommunityIcons name="tooth-outline" size={22} color="#C7D2FE" />
      </View>
      <Text style={{ color: '#C7D2FE', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>NIGHT GUARD</Text>
    </View>
  </View>);
};

// ── 35. Kids Dental ──
export const DentalSticker35: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#FBBF24', '#F59E0B']} style={{ borderRadius: 22, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 18, marginRight: 4 }}>👦</Text>
        <Text style={{ fontSize: 18 }}>🦷</Text>
      </View>
      <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.8, textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } }}>KIDS DENTAL</Text>
    </LinearGradient>
  </View>);
};

// ── 36. Dental Laser ──
export const DentalSticker36: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#0C0A09', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', borderWidth: 1.5, borderColor: '#EF4444', ...Platform.select({ ios: { shadowColor: '#EF4444', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 6 } }) }}>
      <View style={{ alignItems: 'center', marginBottom: 4 }}>
        <View style={{ width: 2, height: 14, backgroundColor: '#EF4444', borderRadius: 1, position: 'absolute', top: -2 }} />
        <MaterialCommunityIcons name="tooth-outline" size={26} color="#FCA5A5" style={{ marginTop: 10 }} />
      </View>
      <Text style={{ color: '#FCA5A5', fontSize: 7, fontWeight: '800', letterSpacing: 1.5, textShadowColor: '#EF4444', textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } }}>LASER DENTISTRY</Text>
    </View>
  </View>);
};

// ── 37. Perfect Bite ──
export const DentalSticker37: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#FFF', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', borderWidth: 2, borderColor: '#A78BFA', ...Platform.select({ ios: { shadowColor: '#7C3AED', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
        {[0, 1, 2].map(i => (
          <Text key={i} style={{ fontSize: 14, marginHorizontal: 0.5 }}>🦷</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        {[0, 1, 2].map(i => (
          <Text key={i} style={{ fontSize: 14, marginHorizontal: 0.5, transform: [{ scaleY: -1 }] }}>🦷</Text>
        ))}
      </View>
      <Text style={{ color: '#5B21B6', fontSize: 8, fontWeight: '900', letterSpacing: 1 }}>PERFECT BITE</Text>
    </View>
  </View>);
};

// ── 38. Gum Health ──
export const DentalSticker38: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#FB7185', '#F43F5E']} style={{ borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4 }}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={{ marginHorizontal: 1 }}>
            <View style={{ width: 12, height: 6 + i * 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
            <Text style={{ fontSize: 10, marginTop: -3 }}>🦷</Text>
          </View>
        ))}
      </View>
      <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>GUM HEALTH</Text>
    </LinearGradient>
  </View>);
};

// ── 39. Wisdom Tooth ──
export const DentalSticker39: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#F5F3FF', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', borderWidth: 2, borderColor: '#A78BFA' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Text style={{ fontSize: 18 }}>🎓</Text>
        <Text style={{ fontSize: 22, marginLeft: 4 }}>🦷</Text>
      </View>
      <Text style={{ color: '#5B21B6', fontSize: 8, fontWeight: '800', letterSpacing: 1 }}>WISDOM TOOTH</Text>
    </View>
  </View>);
};

// ── 40. Dental Award ──
export const DentalSticker40: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#D4A017', '#F5D060', '#FFE082']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 50, width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: '#FFFBEB', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#D4A017' }}>
        <Ionicons name="trophy" size={20} color="#D4A017" />
        <MaterialCommunityIcons name="tooth-outline" size={20} color="#92400E" style={{ marginTop: -2 }} />
        <Text style={{ color: '#78350F', fontSize: 7, fontWeight: '900', letterSpacing: 1, marginTop: 2 }}>AWARD</Text>
      </View>
    </LinearGradient>
  </View>);
};

// ========== Registry ==========
export const DENTAL_STICKER_DESIGNS_EXTENDED = [
  { id: 'dental_11', label: 'Upper Jaw Arc', tags: [...DENTAL_TAGS, 'jaw', 'upper', 'arch', 'anatomy'], Component: DentalSticker11 },
  { id: 'dental_12', label: 'Molar Closeup', tags: [...DENTAL_TAGS, 'molar', 'closeup', 'purple', 'gradient'], Component: DentalSticker12 },
  { id: 'dental_13', label: 'Braces Fun', tags: [...DENTAL_TAGS, 'braces', 'orthodontic', 'wire', 'brackets'], Component: DentalSticker13 },
  { id: 'dental_14', label: 'Whitening Glow', tags: [...DENTAL_TAGS, 'whitening', 'glow', 'sparkle', 'bright'], Component: DentalSticker14 },
  { id: 'dental_15', label: 'Dental Shield', tags: [...DENTAL_TAGS, 'shield', 'protect', 'guard', 'safe'], Component: DentalSticker15 },
  { id: 'dental_16', label: 'Brushing Timer', tags: [...DENTAL_TAGS, 'brush', 'timer', 'hygiene', 'routine'], Component: DentalSticker16 },
  { id: 'dental_17', label: 'Cavity Free', tags: [...DENTAL_TAGS, 'cavity', 'free', 'healthy', 'badge'], Component: DentalSticker17 },
  { id: 'dental_18', label: 'Dental X-Ray', tags: [...DENTAL_TAGS, 'xray', 'scan', 'radiograph', 'dark'], Component: DentalSticker18 },
  { id: 'dental_19', label: 'Floss Reminder', tags: [...DENTAL_TAGS, 'floss', 'reminder', 'string', 'clean'], Component: DentalSticker19 },
  { id: 'dental_20', label: 'Dental Team', tags: [...DENTAL_TAGS, 'team', 'staff', 'people', 'group'], Component: DentalSticker20 },
  { id: 'dental_21', label: 'Implant Tech', tags: [...DENTAL_TAGS, 'implant', 'tech', 'surgery', 'screw'], Component: DentalSticker21 },
  { id: 'dental_22', label: 'Root Canal', tags: [...DENTAL_TAGS, 'root', 'canal', 'treatment', 'endo'], Component: DentalSticker22 },
  { id: 'dental_23', label: 'Mint Fresh', tags: [...DENTAL_TAGS, 'mint', 'fresh', 'breath', 'green'], Component: DentalSticker23 },
  { id: 'dental_24', label: 'Orthodontics', tags: [...DENTAL_TAGS, 'orthodontics', 'align', 'straight', 'wire'], Component: DentalSticker24 },
  { id: 'dental_25', label: 'Smile Meter', tags: [...DENTAL_TAGS, 'meter', 'progress', 'bar', 'score'], Component: DentalSticker25 },
  { id: 'dental_26', label: 'Dental Care Heart', tags: [...DENTAL_TAGS, 'care', 'heart', 'love', 'health'], Component: DentalSticker26 },
  { id: 'dental_27', label: 'Fluoride Boost', tags: [...DENTAL_TAGS, 'fluoride', 'boost', 'water', 'mineral'], Component: DentalSticker27 },
  { id: 'dental_28', label: 'Dental Mirror', tags: [...DENTAL_TAGS, 'mirror', 'exam', 'checkup', 'tool'], Component: DentalSticker28 },
  { id: 'dental_29', label: 'Smile Makeover', tags: [...DENTAL_TAGS, 'makeover', 'cosmetic', 'beauty', 'transform'], Component: DentalSticker29 },
  { id: 'dental_30', label: 'Dental Hygiene', tags: [...DENTAL_TAGS, 'hygiene', 'brush', 'paste', 'clean'], Component: DentalSticker30 },
  { id: 'dental_31', label: 'Tooth Fairy', tags: [...DENTAL_TAGS, 'fairy', 'kids', 'magic', 'fantasy'], Component: DentalSticker31 },
  { id: 'dental_32', label: 'Veneer Preview', tags: [...DENTAL_TAGS, 'veneer', 'cosmetic', 'porcelain', 'laminate'], Component: DentalSticker32 },
  { id: 'dental_33', label: 'Emergency Dental', tags: [...DENTAL_TAGS, 'emergency', 'urgent', 'pain', 'alert'], Component: DentalSticker33 },
  { id: 'dental_34', label: 'Night Guard', tags: [...DENTAL_TAGS, 'night', 'guard', 'grind', 'bruxism'], Component: DentalSticker34 },
  { id: 'dental_35', label: 'Kids Dental', tags: [...DENTAL_TAGS, 'kids', 'children', 'pediatric', 'fun'], Component: DentalSticker35 },
  { id: 'dental_36', label: 'Dental Laser', tags: [...DENTAL_TAGS, 'laser', 'technology', 'precision', 'modern'], Component: DentalSticker36 },
  { id: 'dental_37', label: 'Perfect Bite', tags: [...DENTAL_TAGS, 'bite', 'occlusion', 'alignment', 'jaw'], Component: DentalSticker37 },
  { id: 'dental_38', label: 'Gum Health', tags: [...DENTAL_TAGS, 'gum', 'periodontal', 'gingival', 'pink'], Component: DentalSticker38 },
  { id: 'dental_39', label: 'Wisdom Tooth', tags: [...DENTAL_TAGS, 'wisdom', 'extraction', 'third', 'molar'], Component: DentalSticker39 },
  { id: 'dental_40', label: 'Dental Award', tags: [...DENTAL_TAGS, 'award', 'trophy', 'gold', 'best'], Component: DentalSticker40 },
];

const x = StyleSheet.create({ c: { alignItems: 'center', justifyContent: 'center' } });
