/**
 * Beauty / Aesthetic Clinic Sticker Designs — Featured Collection (Premium)
 *
 * 10 premium beauty-themed decorative stickers with:
 *   • Soft luxury aesthetic — rose gold, nude, pastel gradients
 *   • Glass / glossy effects with elegant shadows
 *   • Subtle animated glow, shimmer, and float effects
 *   • Feminine but professional aesthetic clinic visuals
 *
 * Only shown to clinics where clinicType === 'beauty'.
 * Decorative only — no clinic name, phone number, or interactive features.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

/* ─── shared pulse hook (soft glow oscillation) ─── */
const useGlow = (min = 0.6, max = 1, duration = 2400) => {
  const anim = useRef(new Animated.Value(max)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: min, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: max, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
};

/* ─── shared float hook (gentle up/down movement) ─── */
const useFloat = (amplitude = 3, duration = 3000) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: -amplitude, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: amplitude, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return anim;
};

export interface BeautyStickerProps {
  size?: number;
}

// ── 1. Rose Gold Syringe — Minimal syringe with soft glow ──
export const BeautySticker1: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = useGlow(0.5, 1, 2800);
  return (
    <View style={[bs.c, { transform: [{ scale: s }] }]}>
      <Animated.View style={{ opacity: glow }}>
        <LinearGradient
          colors={['#F9E4D4', '#F5C6AA', '#E8A87C']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            width: 100, height: 100, borderRadius: 26,
            justifyContent: 'center', alignItems: 'center',
            ...Platform.select({
              ios: { shadowColor: '#E8A87C', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
              android: { elevation: 8 },
            }),
          }}
        >
          {/* Syringe body */}
          <View style={{ alignItems: 'center' }}>
            {/* Plunger top */}
            <View style={{ width: 3, height: 8, backgroundColor: '#C9947A', borderRadius: 1.5, marginBottom: 1 }} />
            <View style={{ width: 14, height: 3, backgroundColor: '#C9947A', borderRadius: 1 }} />
            {/* Barrel */}
            <View style={{
              width: 12, height: 28, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 3,
              borderWidth: 1, borderColor: 'rgba(201,148,122,0.4)',
              justifyContent: 'center', alignItems: 'center',
            }}>
              {/* Liquid fill */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, backgroundColor: 'rgba(232,168,124,0.3)', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
              {/* Measurement lines */}
              {[6, 12, 18].map((t, i) => (
                <View key={i} style={{ position: 'absolute', top: t, left: 2, width: 4, height: 0.8, backgroundColor: 'rgba(201,148,122,0.5)' }} />
              ))}
            </View>
            {/* Needle */}
            <View style={{ width: 1.5, height: 14, backgroundColor: '#C9947A', borderRadius: 0.5 }} />
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: 'rgba(232,168,124,0.6)' }} />
          </View>
          {/* Sparkles */}
          <View style={{ position: 'absolute', top: 16, right: 18 }}>
            <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.9)" />
          </View>
          <View style={{ position: 'absolute', bottom: 20, left: 16 }}>
            <Ionicons name="sparkles" size={10} color="rgba(255,255,255,0.7)" />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ── 2. Glass Syringe — Glass-effect syringe with highlights ──
export const BeautySticker2: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = useGlow(0.65, 1, 3000);
  return (
    <View style={[bs.c, { transform: [{ scale: s }] }]}>
      <View style={{
        width: 100, height: 100, borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center', alignItems: 'center',
        ...Platform.select({
          ios: { shadowColor: '#D4A5FF', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 6 } },
          android: { elevation: 6 },
        }),
      }}>
        <LinearGradient
          colors={['rgba(255,255,255,0.25)', 'rgba(212,165,255,0.15)', 'rgba(255,255,255,0.08)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{ ...StyleSheet.absoluteFillObject, borderRadius: 28 }}
        />
        {/* Glass syringe */}
        <View style={{ alignItems: 'center', transform: [{ rotate: '-15deg' }] }}>
          <View style={{ width: 3, height: 6, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          <View style={{ width: 16, height: 3, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 1 }} />
          <Animated.View style={{
            width: 14, height: 30, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4,
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
            opacity: glow,
          }}>
            {/* Glass reflection */}
            <View style={{ position: 'absolute', top: 2, left: 2, width: 3, height: 20, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
            {/* Liquid */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 12, backgroundColor: 'rgba(212,165,255,0.25)', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
          </Animated.View>
          <View style={{ width: 1.5, height: 16, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 0.5 }} />
        </View>
        {/* Light reflection */}
        <View style={{ position: 'absolute', top: 10, left: 14, width: 18, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, transform: [{ rotate: '-25deg' }] }} />
      </View>
    </View>
  );
};

// ── 3. Lip Gloss — Lips with luxurious gloss shine ──
export const BeautySticker3: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = useGlow(0.7, 1, 2200);
  const float = useFloat(2, 3500);
  return (
    <View style={[bs.c, { transform: [{ scale: s }] }]}>
      <Animated.View style={{ transform: [{ translateY: float }] }}>
        <LinearGradient
          colors={['#FFB6C1', '#FF69B4', '#DB7093']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            width: 100, height: 100, borderRadius: 50,
            justifyContent: 'center', alignItems: 'center',
            ...Platform.select({
              ios: { shadowColor: '#FF69B4', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
              android: { elevation: 8 },
            }),
          }}
        >
          <Text style={{ fontSize: 38 }}>💋</Text>
          {/* Gloss shine */}
          <Animated.View style={{
            position: 'absolute', top: 18, right: 20,
            width: 14, height: 8, backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: 4, transform: [{ rotate: '-30deg' }],
            opacity: glow,
          }} />
          <View style={{ position: 'absolute', bottom: 18, left: 22 }}>
            <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.8)" />
          </View>
          <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800', letterSpacing: 2, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 4, textShadowOffset: { width: 0, height: 1 } }}>GLOSS</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ── 4. Golden Face Silhouette — Luxury face profile with glow ──
export const BeautySticker4: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = useGlow(0.55, 1, 3200);
  return (
    <View style={[bs.c, { transform: [{ scale: s }] }]}>
      <LinearGradient
        colors={['#2D2926', '#1A1714']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={{
          width: 100, height: 100, borderRadius: 22,
          justifyContent: 'center', alignItems: 'center',
          borderWidth: 1.5, borderColor: '#D4A017',
          ...Platform.select({
            ios: { shadowColor: '#D4A017', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 6 },
          }),
        }}
      >
        {/* Face silhouette - side profile */}
        <View style={{ alignItems: 'center' }}>
          {/* Forehead */}
          <View style={{ width: 28, height: 16, borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: 'transparent', borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#D4A017', marginBottom: -2 }} />
          {/* Face contour */}
          <View style={{ width: 28, height: 24, borderBottomLeftRadius: 12, borderBottomRightRadius: 8, backgroundColor: 'transparent', borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: '#D4A017' }} />
          {/* Nose highlight */}
          <Animated.View style={{
            position: 'absolute', right: 32, top: 14,
            width: 4, height: 10, borderRadius: 2,
            backgroundColor: 'rgba(212,160,23,0.4)',
            opacity: glow,
          }} />
        </View>
        {/* Glow point on cheekbone */}
        <Animated.View style={{
          position: 'absolute', right: 26, top: 36,
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: 'rgba(212,160,23,0.25)',
          opacity: glow,
          ...Platform.select({
            ios: { shadowColor: '#D4A017', shadowOpacity: 0.6, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
            android: {},
          }),
        }} />
        <Text style={{ color: '#D4A017', fontSize: 7, fontWeight: '700', letterSpacing: 3, marginTop: 6 }}>AESTHETIC</Text>
      </LinearGradient>
    </View>
  );
};

// ── 5. Filler Badge — Elegant circular badge with soft glow ──
export const BeautySticker5: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = useGlow(0.6, 1, 2600);
  return (
    <View style={[bs.c, { transform: [{ scale: s }] }]}>
      <Animated.View style={{ opacity: glow }}>
        <LinearGradient
          colors={['#F5E6F0', '#E8C5D8', '#D4A5C0']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            width: 96, height: 96, borderRadius: 48,
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
            ...Platform.select({
              ios: { shadowColor: '#D4A5C0', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
              android: { elevation: 8 },
            }),
          }}
        >
          {/* Inner circle with glass effect */}
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: 'rgba(255,255,255,0.3)',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
            justifyContent: 'center', alignItems: 'center',
          }}>
            {/* Syringe icon */}
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 2, height: 5, backgroundColor: '#9B6B8A', borderRadius: 1 }} />
              <View style={{ width: 10, height: 2, backgroundColor: '#9B6B8A', borderRadius: 1 }} />
              <View style={{ width: 8, height: 18, backgroundColor: 'rgba(155,107,138,0.3)', borderRadius: 2, borderWidth: 1, borderColor: '#9B6B8A' }} />
              <View style={{ width: 1, height: 8, backgroundColor: '#9B6B8A' }} />
            </View>
            <Text style={{ color: '#7B4B6A', fontSize: 7, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 }}>FILLER</Text>
          </View>
          {/* Glass highlight */}
          <View style={{ position: 'absolute', top: 8, left: 16, width: 20, height: 4, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, transform: [{ rotate: '-20deg' }] }} />
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ── 6. Collagen Drop — Premium serum drop icon ──
export const BeautySticker6: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const float = useFloat(2.5, 2800);
  const glow = useGlow(0.6, 1, 2400);
  return (
    <View style={[bs.c, { transform: [{ scale: s }] }]}>
      <Animated.View style={{ transform: [{ translateY: float }] }}>
        <View style={{
          width: 100, height: 100, borderRadius: 24,
          backgroundColor: '#FFF8F0',
          justifyContent: 'center', alignItems: 'center',
          borderWidth: 1.5, borderColor: '#F0D5B8',
          ...Platform.select({
            ios: { shadowColor: '#E8C5A0', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 5 },
          }),
        }}>
          {/* Drop shape */}
          <View style={{ alignItems: 'center' }}>
            <View style={{
              width: 0, height: 0,
              borderLeftWidth: 16, borderRightWidth: 16,
              borderBottomWidth: 24,
              borderLeftColor: 'transparent', borderRightColor: 'transparent',
              borderBottomColor: 'rgba(232,197,160,0.4)',
              marginBottom: -4,
            }} />
            <Animated.View style={{
              width: 32, height: 28, borderRadius: 16,
              backgroundColor: 'rgba(232,197,160,0.3)',
              borderWidth: 1.5, borderColor: '#E8C5A0',
              opacity: glow,
            }}>
              {/* Glass reflection */}
              <View style={{ position: 'absolute', top: 6, left: 6, width: 6, height: 10, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 3 }} />
            </Animated.View>
          </View>
          <Text style={{ color: '#C49A6C', fontSize: 7, fontWeight: '800', letterSpacing: 1.5, marginTop: 6 }}>COLLAGEN</Text>
          <View style={{ position: 'absolute', top: 14, right: 14 }}>
            <Ionicons name="sparkles" size={12} color="#E8C5A0" />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// ── 7. Contour Guide — Face contour mapping with glow points ──
export const BeautySticker7: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = useGlow(0.4, 1, 2000);
  return (
    <View style={[bs.c, { transform: [{ scale: s }] }]}>
      <LinearGradient
        colors={['#1A1A2E', '#16213E']}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={{
          width: 100, height: 100, borderRadius: 22,
          justifyContent: 'center', alignItems: 'center',
          ...Platform.select({
            ios: { shadowColor: '#FF6B9D', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 6 },
          }),
        }}
      >
        {/* Face outline */}
        <View style={{
          width: 36, height: 46, borderRadius: 18,
          backgroundColor: 'transparent',
          borderWidth: 1.5, borderColor: 'rgba(255,107,157,0.5)',
        }}>
          {/* Contour highlight points */}
          {[
            { top: 8, left: -3 },   // temple L
            { top: 8, right: -3 },   // temple R
            { top: 20, left: -4 },   // cheek L
            { top: 20, right: -4 },  // cheek R
            { bottom: 4, left: 10 }, // jawline L
            { bottom: 4, right: 10 }, // jawline R
          ].map((pos, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute', ...pos,
                width: 5, height: 5, borderRadius: 2.5,
                backgroundColor: i < 2 ? '#FF6B9D' : i < 4 ? '#FFB347' : '#FF6B9D',
                opacity: glow,
                ...Platform.select({
                  ios: { shadowColor: '#FF6B9D', shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
                  android: {},
                }),
              }}
            />
          ))}
        </View>
        <Text style={{ color: 'rgba(255,107,157,0.8)', fontSize: 7, fontWeight: '700', letterSpacing: 2, marginTop: 6 }}>CONTOUR</Text>
      </LinearGradient>
    </View>
  );
};

// ── 8. Serum Bottle — Minimal luxury serum bottle ──
export const BeautySticker8: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = useGlow(0.55, 1, 3000);
  const float = useFloat(1.5, 3200);
  return (
    <View style={[bs.c, { transform: [{ scale: s }] }]}>
      <Animated.View style={{ transform: [{ translateY: float }] }}>
        <LinearGradient
          colors={['#F7E8EF', '#F0D4E1', '#E8BCD0']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={{
            width: 88, height: 100, borderRadius: 20,
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
            ...Platform.select({
              ios: { shadowColor: '#E8BCD0', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } },
              android: { elevation: 6 },
            }),
          }}
        >
          {/* Bottle */}
          <View style={{ alignItems: 'center' }}>
            {/* Dropper cap */}
            <View style={{ width: 4, height: 8, backgroundColor: '#C49A7C', borderRadius: 2, marginBottom: 1 }} />
            <View style={{ width: 12, height: 4, backgroundColor: '#C49A7C', borderRadius: 2 }} />
            {/* Neck */}
            <View style={{ width: 10, height: 6, backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(196,154,124,0.4)' }} />
            {/* Body */}
            <Animated.View style={{
              width: 28, height: 36, borderRadius: 6,
              backgroundColor: 'rgba(255,255,255,0.35)',
              borderWidth: 1.5, borderColor: 'rgba(196,154,124,0.3)',
              opacity: glow,
            }}>
              {/* Glass reflection */}
              <View style={{ position: 'absolute', top: 3, left: 3, width: 4, height: 22, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
              {/* Liquid */}
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 20, backgroundColor: 'rgba(232,188,208,0.3)', borderBottomLeftRadius: 6, borderBottomRightRadius: 6 }} />
            </Animated.View>
          </View>
          <Text style={{ color: '#9B6B7A', fontSize: 7, fontWeight: '700', letterSpacing: 2, marginTop: 4 }}>SERUM</Text>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

// ── 9. Crown Beauty — Luxury crown with face outline ──
export const BeautySticker9: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = useGlow(0.5, 1, 2400);
  return (
    <View style={[bs.c, { transform: [{ scale: s }] }]}>
      <LinearGradient
        colors={['#D4A017', '#F5D060', '#D4A017']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ borderRadius: 18, padding: 2 }}
      >
        <View style={{
          backgroundColor: '#1C1917',
          borderRadius: 16, paddingVertical: 14, paddingHorizontal: 18,
          alignItems: 'center',
          ...Platform.select({
            ios: { shadowColor: '#D4A017', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 6 },
          }),
        }}>
          {/* Crown */}
          <Animated.View style={{ opacity: glow, marginBottom: 4 }}>
            <Text style={{ fontSize: 22 }}>👑</Text>
          </Animated.View>
          {/* Face outline */}
          <View style={{
            width: 24, height: 28, borderRadius: 12,
            backgroundColor: 'transparent',
            borderWidth: 1.5, borderColor: '#D4A017',
          }} />
          <Text style={{ color: '#F5D060', fontSize: 7, fontWeight: '800', letterSpacing: 2, marginTop: 4 }}>LUXURY</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

// ── 10. Blush Glow — Soft blush circles with sparkle shimmer ──
export const BeautySticker10: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = useGlow(0.5, 1, 2600);
  const float = useFloat(1.5, 3600);
  return (
    <View style={[bs.c, { transform: [{ scale: s }] }]}>
      <Animated.View style={{ transform: [{ translateY: float }] }}>
        <View style={{
          width: 100, height: 100, borderRadius: 50,
          backgroundColor: '#FFF5F5',
          justifyContent: 'center', alignItems: 'center',
          borderWidth: 1.5, borderColor: 'rgba(255,182,193,0.5)',
          ...Platform.select({
            ios: { shadowColor: '#FFB6C1', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
            android: { elevation: 6 },
          }),
        }}>
          {/* Blush circles */}
          <Animated.View style={{
            position: 'absolute', left: 16, top: 28,
            width: 28, height: 22, borderRadius: 11,
            backgroundColor: 'rgba(255,182,193,0.35)',
            opacity: glow,
          }} />
          <Animated.View style={{
            position: 'absolute', right: 16, top: 28,
            width: 28, height: 22, borderRadius: 11,
            backgroundColor: 'rgba(255,182,193,0.35)',
            opacity: glow,
          }} />
          {/* Sparkles */}
          <View style={{ position: 'absolute', top: 12 }}>
            <Ionicons name="sparkles" size={16} color="rgba(255,107,157,0.6)" />
          </View>
          <Text style={{ color: '#DB7093', fontSize: 8, fontWeight: '800', letterSpacing: 2, marginTop: 26 }}>GLOW</Text>
          <View style={{ position: 'absolute', bottom: 14, right: 18 }}>
            <Ionicons name="sparkles" size={10} color="rgba(255,182,193,0.7)" />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

// ========== Registry ==========
export const BEAUTY_STICKER_DESIGNS = [
  { id: 'beauty_1', label: 'Rose Gold Syringe', Component: BeautySticker1 },
  { id: 'beauty_2', label: 'Glass Syringe', Component: BeautySticker2 },
  { id: 'beauty_3', label: 'Lip Gloss', Component: BeautySticker3 },
  { id: 'beauty_4', label: 'Gold Face Silhouette', Component: BeautySticker4 },
  { id: 'beauty_5', label: 'Filler Badge', Component: BeautySticker5 },
  { id: 'beauty_6', label: 'Collagen Drop', Component: BeautySticker6 },
  { id: 'beauty_7', label: 'Contour Guide', Component: BeautySticker7 },
  { id: 'beauty_8', label: 'Serum Bottle', Component: BeautySticker8 },
  { id: 'beauty_9', label: 'Crown Beauty', Component: BeautySticker9 },
  { id: 'beauty_10', label: 'Blush Glow', Component: BeautySticker10 },
] as const;

const bs = StyleSheet.create({
  c: { alignItems: 'center', justifyContent: 'center' },
});
