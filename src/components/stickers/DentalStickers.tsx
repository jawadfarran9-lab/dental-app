/**
 * Dental Sticker Designs for Story Editor — Featured Collection
 *
 * 10 premium dental-themed sticker designs.
 * Each is a pure React Native component using layered styling,
 * gradients, and dental iconography.
 *
 * Only shown to clinics where clinicType === 'dental'.
 */

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export interface DentalStickerProps {
  size?: number;
}

// ── 1. Sparkling Tooth ──
// Glossy white tooth with sparkle accents on gradient blue bg
export const DentalSticker1: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (
    <View style={[ds.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#0EA5E9', '#38BDF8', '#7DD3FC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 100, height: 100, borderRadius: 24, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 42 }}>🦷</Text>
        <View style={{ position: 'absolute', top: 14, right: 18 }}>
          <Ionicons name="sparkles" size={16} color="#FFF9C4" />
        </View>
        <View style={{ position: 'absolute', bottom: 18, left: 16 }}>
          <Ionicons name="sparkles" size={12} color="#FFFFFF" />
        </View>
        <Text style={{ color: '#FFF', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 2 }}>SMILE!</Text>
      </LinearGradient>
    </View>
  );
};

// ── 2. Clean & Bright Badge ──
// Circular mint badge with toothbrush icon
export const DentalSticker2: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (
    <View style={[ds.c, { transform: [{ scale: s }] }]}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#ECFDF5', borderWidth: 3, borderColor: '#34D399', justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#10B981', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
        <MaterialCommunityIcons name="toothbrush-paste" size={36} color="#059669" />
        <Text style={{ color: '#065F46', fontSize: 8, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 }}>CLEAN</Text>
      </View>
    </View>
  );
};

// ── 3. Happy Tooth Card ──
// White card with happy tooth emoji + motivational text
export const DentalSticker3: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (
    <View style={[ds.c, { transform: [{ scale: s }] }]}>
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', borderWidth: 2, borderColor: '#93C5FD', ...Platform.select({ ios: { shadowColor: '#3B82F6', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <Text style={{ fontSize: 32, marginBottom: 4 }}>😁</Text>
        <Text style={{ color: '#1E3A5F', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>KEEP SMILING</Text>
        <View style={{ flexDirection: 'row', marginTop: 4 }}>
          {[0, 1, 2].map(i => <Ionicons key={i} name="star" size={10} color="#FBBF24" style={{ marginHorizontal: 1 }} />)}
        </View>
      </View>
    </View>
  );
};

// ── 4. Crown Restoration ──
// Gold gradient with dental crown icon
export const DentalSticker4: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (
    <View style={[ds.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#D4A017', '#F5D060', '#D4A017']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 16, padding: 2 }}>
        <View style={{ backgroundColor: '#1C1917', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center' }}>
          <MaterialCommunityIcons name="tooth-outline" size={28} color="#F5D060" />
          <View style={{ position: 'absolute', top: 8, left: '50%', marginLeft: -8 }}>
            <Ionicons name="ribbon" size={16} color="#D4A017" />
          </View>
          <Text style={{ color: '#F5D060', fontSize: 8, fontWeight: '800', letterSpacing: 2, marginTop: 4 }}>CROWN</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 5. Dental Checkup Stamp ──
// Green stamp-style with checkmark and tooth
export const DentalSticker5: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (
    <View style={[ds.c, { transform: [{ scale: s }] }]}>
      <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: '#22C55E', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center' }}>
          <MaterialCommunityIcons name="tooth-outline" size={30} color="#16A34A" />
          <View style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: '#22C55E', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="checkmark" size={14} color="#FFF" />
          </View>
          <Text style={{ color: '#166534', fontSize: 7, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 }}>CHECKED</Text>
        </View>
      </View>
    </View>
  );
};

// ── 6. Neon Tooth ──
// Dark background with glowing cyan tooth outline
export const DentalSticker6: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (
    <View style={[ds.c, { transform: [{ scale: s }] }]}>
      <View style={{ backgroundColor: '#0D0D0D', borderRadius: 20, width: 100, height: 100, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#06B6D4', ...Platform.select({ ios: { shadowColor: '#06B6D4', shadowOpacity: 0.7, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 8 } }) }}>
        <MaterialCommunityIcons name="tooth-outline" size={38} color="#22D3EE" style={{ textShadowColor: '#06B6D4', textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } }} />
        <Text style={{ color: '#22D3EE', fontSize: 8, fontWeight: '800', letterSpacing: 2, marginTop: 4, textShadowColor: '#06B6D4', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } }}>DENTAL</Text>
      </View>
    </View>
  );
};

// ── 7. Jaw Anatomy ──
// Medical illustration style with lower jaw
export const DentalSticker7: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (
    <View style={[ds.c, { transform: [{ scale: s }] }]}>
      <View style={{ backgroundColor: '#F8FAFC', borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#CBD5E1' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 6 }}>
          {/* Stylized lower jaw with teeth row */}
          {['🦷', '🦷', '🦷', '🦷', '🦷'].map((t, i) => (
            <Text key={i} style={{ fontSize: 14, marginHorizontal: 0.5, transform: [{ scaleX: i === 2 ? 1.1 : 0.85 }, { translateY: i === 0 || i === 4 ? 3 : i === 2 ? -2 : 0 }] }}>{t}</Text>
          ))}
        </View>
        <View style={{ height: 1.5, width: 60, backgroundColor: '#94A3B8', borderRadius: 1, marginBottom: 4 }} />
        <Text style={{ color: '#475569', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 }}>LOWER JAW</Text>
      </View>
    </View>
  );
};

// ── 8. Toothpaste Swirl ──
// Playful minty gradient with toothbrush + paste
export const DentalSticker8: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (
    <View style={[ds.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#6EE7B7', '#34D399', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 22, width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
        <MaterialCommunityIcons name="toothbrush" size={34} color="#FFFFFF" style={{ transform: [{ rotate: '-30deg' }] }} />
        <View style={{ position: 'absolute', top: 22, right: 22 }}>
          <Text style={{ fontSize: 14, transform: [{ rotate: '15deg' }] }}>✨</Text>
        </View>
        <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } }}>FRESH</Text>
      </LinearGradient>
    </View>
  );
};

// ── 9. Dental Appointment Card ──
// Professional card style with appointment/calendar icon
export const DentalSticker9: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (
    <View style={[ds.c, { transform: [{ scale: s }] }]}>
      <View style={{ backgroundColor: '#EFF6FF', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#3B82F6', ...Platform.select({ ios: { shadowColor: '#3B82F6', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="calendar" size={16} color="#2563EB" style={{ marginRight: 6 }} />
          <MaterialCommunityIcons name="tooth-outline" size={18} color="#2563EB" />
        </View>
        <Text style={{ color: '#1E40AF', fontSize: 9, fontWeight: '800', letterSpacing: 1 }}>APPOINTMENT</Text>
        <Text style={{ color: '#3B82F6', fontSize: 7, fontWeight: '600', marginTop: 2 }}>Book Today</Text>
      </View>
    </View>
  );
};

// ── 10. Pearly Whites Row ──
// Row of sparkling teeth in a stylish banner
export const DentalSticker10: React.FC<DentalStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  return (
    <View style={[ds.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#F0F9FF', '#DBEAFE', '#BFDBFE']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center', borderWidth: 1.5, borderColor: '#93C5FD' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="sparkles" size={12} color="#FBBF24" style={{ marginRight: 4 }} />
          <Text style={{ color: '#1E40AF', fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>PEARLY WHITES</Text>
          <Ionicons name="sparkles" size={12} color="#FBBF24" style={{ marginLeft: 4 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <Text key={i} style={{ fontSize: 18, marginHorizontal: 1, transform: [{ scaleX: i === 2 || i === 3 ? 1.05 : 0.9 }] }}>🦷</Text>
          ))}
        </View>
      </LinearGradient>
    </View>
  );
};

// ========== Registry ==========
export const DENTAL_STICKER_DESIGNS = [
  { id: 'dental_1', label: 'Sparkling Tooth', Component: DentalSticker1 },
  { id: 'dental_2', label: 'Clean Badge', Component: DentalSticker2 },
  { id: 'dental_3', label: 'Happy Tooth', Component: DentalSticker3 },
  { id: 'dental_4', label: 'Crown Restoration', Component: DentalSticker4 },
  { id: 'dental_5', label: 'Checkup Stamp', Component: DentalSticker5 },
  { id: 'dental_6', label: 'Neon Tooth', Component: DentalSticker6 },
  { id: 'dental_7', label: 'Jaw Anatomy', Component: DentalSticker7 },
  { id: 'dental_8', label: 'Toothpaste Swirl', Component: DentalSticker8 },
  { id: 'dental_9', label: 'Appointment Card', Component: DentalSticker9 },
  { id: 'dental_10', label: 'Pearly Whites', Component: DentalSticker10 },
] as const;

const ds = StyleSheet.create({
  c: { alignItems: 'center', justifyContent: 'center' },
});
