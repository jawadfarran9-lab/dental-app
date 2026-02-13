/**
 * Phone Number Sticker Designs for Story Editor — Flagship Collection
 *
 * 10 premium, visually striking phone sticker designs.
 * Each is a pure React Native component with layered styling,
 * creative layouts, and modern UI aesthetics.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

export interface PhoneStickerProps {
  phoneNumber: string;
  size?: number;
}

// ── 1. Aurora Glass Pill ──
// Multilayer glassmorphism with aurora gradient, stacked icon and number
export const PhoneSticker1: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ps.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#6366F1', '#8B5CF6', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 24, padding: 2 }}>
        <View style={{ backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 22, paddingVertical: 10, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(139,92,246,0.25)', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
            <Ionicons name="call" size={14} color="#C4B5FD" />
          </View>
          <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '800', letterSpacing: 0.8 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 2. Midnight Command ──
// Dark card with glowing cyan accent bar top + bottom, icon left
export const PhoneSticker2: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ps.c, { transform: [{ scale: s }] }]}>
      <View style={{ backgroundColor: '#0F172A', borderRadius: 14, overflow: 'hidden', borderWidth: 1.5, borderColor: '#0EA5E9' }}>
        <View style={{ height: 3, backgroundColor: '#0EA5E9' }} />
        <View style={{ paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(14,165,233,0.12)', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
            <Ionicons name="call" size={15} color="#38BDF8" />
          </View>
          <View>
            <Text style={{ color: '#64748B', fontSize: 8, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>CALL NOW</Text>
            <Text style={{ color: '#F1F5F9', fontSize: 15, fontWeight: '900', letterSpacing: 0.6 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
          </View>
        </View>
        <View style={{ height: 3, backgroundColor: '#0EA5E9' }} />
      </View>
    </View>
  );
};

// ── 3. Floating Cloud Bubble ──
// White card with offset shadow layers creating a 3D cloud effect
export const PhoneSticker3: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ps.c, { transform: [{ scale: s }] }]}>
      {/* Shadow layer */}
      <View style={{ position: 'absolute', top: 4, left: 4, right: -4, height: 52, borderRadius: 22, backgroundColor: 'rgba(236,72,153,0.08)' }} />
      <View style={{ backgroundColor: '#FFFFFF', borderRadius: 22, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#EC4899', shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#FDF2F8', justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
            <Ionicons name="chatbubble-ellipses" size={13} color="#EC4899" />
          </View>
          <Text style={{ color: '#1E293B', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
        </View>
      </View>
      {/* Tail */}
      <View style={{ width: 0, height: 0, borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#FFFFFF', marginTop: -1, marginLeft: -20, alignSelf: 'flex-start' }} />
    </View>
  );
};

// ── 4. Neon Matrix ──
// Triple-layer neon with outer glow ring, inner dark field, green text
export const PhoneSticker4: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ps.c, { transform: [{ scale: s }] }]}>
      <View style={{ borderRadius: 18, padding: 2, backgroundColor: '#22C55E',
        ...Platform.select({ ios: { shadowColor: '#22C55E', shadowOpacity: 0.5, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 8 } }) }}>
        <View style={{ backgroundColor: '#030712', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 6 }} />
            <Text style={{ color: '#4ADE80', fontSize: 8, fontWeight: '700', letterSpacing: 2 }}>ONLINE</Text>
          </View>
          <Text style={{ color: '#22C55E', fontSize: 17, fontWeight: '900', letterSpacing: 1.5, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', textShadowColor: '#22C55E', textShadowRadius: 10, textShadowOffset: { width: 0, height: 0 } }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
        </View>
      </View>
    </View>
  );
};

// ── 5. Royal Crest Banner ──
// Layered gold banner with ornamental borders and serif font
export const PhoneSticker5: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ps.c, { transform: [{ scale: s }] }]}>
      <View style={{ borderRadius: 4, borderWidth: 2, borderColor: '#D4A017', backgroundColor: '#1C1917', paddingVertical: 2, paddingHorizontal: 2 }}>
        <LinearGradient colors={['#D4A017', '#F5D060', '#D4A017']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 2, paddingVertical: 10, paddingHorizontal: 20, alignItems: 'center' }}>
          <Text style={{ color: '#3E2723', fontSize: 7, fontWeight: '700', letterSpacing: 4, marginBottom: 2 }}>━━ ✦ BOOK NOW ✦ ━━</Text>
          <Text style={{ color: '#1C1917', fontSize: 17, fontWeight: '900', letterSpacing: 1.2, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
        </LinearGradient>
      </View>
    </View>
  );
};

// ── 6. Holographic Circle ──
// Circular badge with pulsing multi-colour gradient border
export const PhoneSticker6: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  const sz = 100;
  return (
    <View style={[ps.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#EC4899', '#8B5CF6', '#06B6D4', '#10B981']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: sz + 4, height: sz + 4, borderRadius: (sz + 4) / 2, justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: sz, height: sz, borderRadius: sz / 2, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="call" size={20} color="#E2E8F0" />
          <Text style={{ color: '#E2E8F0', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginTop: 4, textAlign: 'center', paddingHorizontal: 8 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>{phoneNumber}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 7. Pastel Dreamy Card ──
// Multi-pastel layered card with soft bloom shadow
export const PhoneSticker7: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ps.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#FBCFE8', '#E9D5FF', '#BFDBFE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 1.5 }}>
        <View style={{ backgroundColor: '#FFFBFE', borderRadius: 18.5, paddingVertical: 12, paddingHorizontal: 18, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
            <Text style={{ fontSize: 14, marginRight: 5 }}>📞</Text>
            <Text style={{ color: '#BE185D', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Reach Us</Text>
          </View>
          <Text style={{ color: '#831843', fontSize: 16, fontWeight: '900', letterSpacing: 0.8 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 8. Medical Cross Tile ──
// Teal tile with frosted medical icon compartment — clinical premium
export const PhoneSticker8: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ps.c, { transform: [{ scale: s }] }]}>
      <LinearGradient colors={['#0F766E', '#14B8A6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 16, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14 }}>
          <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
            <Ionicons name="medical" size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 8, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 2 }}>APPOINTMENT</Text>
            <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '900', letterSpacing: 0.6 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
          </View>
        </View>
        {/* Bottom accent strip */}
        <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.2)' }} />
      </LinearGradient>
    </View>
  );
};

// ── 9. Craft Washi Tape ──
// Kraft texture with washi-tape aesthetic, tilted, dashed border
export const PhoneSticker9: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ps.c, { transform: [{ scale: s }] }]}>
      <View style={{ transform: [{ rotate: '-3deg' }] }}>
        <View style={{ backgroundColor: '#FEF9C3', borderRadius: 4, paddingVertical: 10, paddingHorizontal: 18, borderWidth: 1.5, borderColor: '#CA8A04', borderStyle: 'dashed', alignItems: 'center' }}>
          <Text style={{ color: '#854D0E', fontSize: 10, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Noteworthy' : 'cursive', marginBottom: 2 }}>call me! ☎️</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="call" size={13} color="#A16207" style={{ marginRight: 5 }} />
            <Text style={{ color: '#713F12', fontSize: 16, fontWeight: '900', letterSpacing: 0.5, fontFamily: Platform.OS === 'ios' ? 'Noteworthy-Bold' : 'cursive' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ── 10. Instagram Fire Ribbon ──
// Diagonal IG gradient ribbon with flame icon — attention magnet
export const PhoneSticker10: React.FC<PhoneStickerProps> = ({ phoneNumber, size = 140 }) => {
  const s = size / 140;
  return (
    <View style={[ps.c, { transform: [{ scale: s }] }]}>
      <View style={{ transform: [{ rotate: '-3deg' }] }}>
        <LinearGradient colors={['#F59E0B', '#EF4444', '#EC4899', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 6, paddingVertical: 9, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, marginRight: 6 }}>🔥</Text>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1.2 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{phoneNumber}</Text>
        </LinearGradient>
      </View>
    </View>
  );
};

// ── Export registry ────────────────────────────────────────────────────
export const PHONE_STICKER_DESIGNS = [
  { id: 'phone_1', label: 'Aurora Glass', Component: PhoneSticker1, clinicTypes: ['dental', 'laser', 'beauty'] },
  { id: 'phone_2', label: 'Midnight Command', Component: PhoneSticker2, clinicTypes: ['dental', 'laser'] },
  { id: 'phone_3', label: 'Cloud Bubble', Component: PhoneSticker3, clinicTypes: ['dental', 'beauty'] },
  { id: 'phone_4', label: 'Neon Matrix', Component: PhoneSticker4, clinicTypes: ['laser'] },
  { id: 'phone_5', label: 'Royal Crest', Component: PhoneSticker5, clinicTypes: ['dental', 'beauty'] },
  { id: 'phone_6', label: 'Holo Circle', Component: PhoneSticker6, clinicTypes: ['laser', 'beauty'] },
  { id: 'phone_7', label: 'Pastel Dream', Component: PhoneSticker7, clinicTypes: ['beauty'] },
  { id: 'phone_8', label: 'Medical Tile', Component: PhoneSticker8, clinicTypes: ['dental'] },
  { id: 'phone_9', label: 'Washi Tape', Component: PhoneSticker9, clinicTypes: ['beauty'] },
  { id: 'phone_10', label: 'Fire Ribbon', Component: PhoneSticker10, clinicTypes: ['dental', 'laser', 'beauty'] },
] as const;

const ps = StyleSheet.create({
  c: { alignItems: 'center', justifyContent: 'center' },
});
