/**
 * Extended Beauty / Aesthetic Clinic Sticker Designs (11–40) — Search Collection
 *
 * 30 premium beauty-themed decorative stickers with:
 *   • Soft luxury aesthetic — rose gold, nude, pastel gradients
 *   • Glass / glossy effects with elegant shadows
 *   • Subtle animated glow, shimmer, and float effects
 *   • Premium injection, skincare, and cosmetic visuals
 *
 * Shown via search in the GIF picker modal.
 * Only shown to clinics where clinicType === 'beauty'.
 * Decorative only — no clinic name, phone number, or interactive features.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { BeautyStickerProps } from './BeautyStickers';

const BEAUTY_TAGS = ['beauty', 'aesthetic', 'cosmetic', 'skin', 'glow', 'luxury', 'clinic'];

/* ─── shared pulse (matches featured file) ─── */
const useGlow = (min = 0.6, max = 1, dur = 2400) => {
  const a = useRef(new Animated.Value(max)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: min, duration: dur, useNativeDriver: true }),
      Animated.timing(a, { toValue: max, duration: dur, useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return a;
};

/* ─── shared float ─── */
const useFloat = (amp = 3, dur = 3000) => {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const l = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: -amp, duration: dur, useNativeDriver: true }),
      Animated.timing(a, { toValue: amp, duration: dur, useNativeDriver: true }),
    ]));
    l.start();
    return () => l.stop();
  }, []);
  return a;
};

// ── 11. Lip Injector — Lip outline + tiny injector ──
export const BeautySticker11: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2600);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#FFD1DC', '#FFAAC4', '#FF87AB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: 100, height: 100, borderRadius: 26, justifyContent: 'center', alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#FF87AB', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 7 } }) }}>
      {/* Lip outline */}
      <View style={{ width: 40, height: 20, borderRadius: 10, backgroundColor: 'transparent', borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' }}>
        <View style={{ position: 'absolute', top: 8, left: 4, right: 4, height: 1.5, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
      </View>
      {/* Tiny syringe */}
      <Animated.View style={{ position: 'absolute', right: 18, top: 18, opacity: g, transform: [{ rotate: '-45deg' }] }}>
        <View style={{ width: 6, height: 16, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, borderWidth: 0.8, borderColor: 'rgba(255,255,255,0.7)' }} />
        <View style={{ width: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.6)', alignSelf: 'center' }} />
      </Animated.View>
      <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800', letterSpacing: 2, marginTop: 8, textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } }}>LIP FILLER</Text>
    </LinearGradient>
  </View>);
};

// ── 12. Anti-Aging Glow — Line smoothing effect ──
export const BeautySticker12: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.4, 1, 3000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#2D2040', '#1A1028']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      style={{ width: 100, height: 100, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#AF52DE', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
      {/* Wrinkle lines fading */}
      {[0, 1, 2].map(i => (
        <Animated.View key={i} style={{ width: 30 - i * 6, height: 1.5, backgroundColor: 'rgba(175,82,222,0.4)', borderRadius: 1, marginVertical: 3, opacity: i === 2 ? g : 0.3 + i * 0.2,
          ...Platform.select({ ios: { shadowColor: '#AF52DE', shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
      ))}
      {/* Smooth arrow */}
      <Animated.View style={{ opacity: g, marginTop: 6 }}>
        <Ionicons name="arrow-forward" size={16} color="#AF52DE" />
      </Animated.View>
      {/* Result — smooth lines */}
      {[0, 1, 2].map(i => (
        <View key={`s${i}`} style={{ width: 30, height: 1, backgroundColor: 'rgba(175,82,222,0.15)', borderRadius: 1, marginVertical: 2 }} />
      ))}
      <Text style={{ color: '#AF52DE', fontSize: 7, fontWeight: '700', letterSpacing: 2, marginTop: 4 }}>ANTI-AGING</Text>
    </LinearGradient>
  </View>);
};

// ── 13. Cheek Highlight — Blush glow on face ──
export const BeautySticker13: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.45, 1, 2200); const f = useFloat(1.5, 3200);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ transform: [{ translateY: f }] }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFF0F3', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,182,193,0.4)',
        ...Platform.select({ ios: { shadowColor: '#FFB6C1', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        {/* Face shape */}
        <View style={{ width: 32, height: 40, borderRadius: 16, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(219,112,147,0.4)' }}>
          {/* Cheek blush L */}
          <Animated.View style={{ position: 'absolute', left: -6, top: 16, width: 14, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,182,193,0.45)', opacity: g }} />
          {/* Cheek blush R */}
          <Animated.View style={{ position: 'absolute', right: -6, top: 16, width: 14, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,182,193,0.45)', opacity: g }} />
        </View>
        <Ionicons name="sparkles" size={12} color="rgba(255,107,157,0.5)" style={{ position: 'absolute', top: 14, right: 16 }} />
        <Text style={{ color: '#DB7093', fontSize: 7, fontWeight: '700', letterSpacing: 2, marginTop: 6 }}>HIGHLIGHT</Text>
      </View>
    </Animated.View>
  </View>);
};

// ── 14. Jawline Contour — Sharp jawline outline ──
export const BeautySticker14: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2800);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#1A1A2E', '#0F0F1A']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      style={{ width: 100, height: 100, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(212,160,23,0.3)',
        ...Platform.select({ ios: { shadowColor: '#D4A017', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 5 } }) }}>
      {/* V-line jaw */}
      <Animated.View style={{ opacity: g }}>
        <View style={{ width: 36, height: 22, borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: 'transparent', borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(212,160,23,0.6)' }} />
        <View style={{ width: 36, height: 20, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: 'transparent', borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(212,160,23,0.6)' }} />
        {/* V-chin point */}
        <View style={{ width: 0, height: 0, alignSelf: 'center', marginTop: -2, borderLeftWidth: 10, borderRightWidth: 10, borderTopWidth: 12, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'rgba(212,160,23,0.5)' }} />
      </Animated.View>
      <Text style={{ color: '#D4A017', fontSize: 7, fontWeight: '700', letterSpacing: 2, marginTop: 6 }}>JAWLINE</Text>
    </LinearGradient>
  </View>);
};

// ── 15. Sparkle Face Mask — Luxurious face mask icon ──
export const BeautySticker15: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2400); const f = useFloat(2, 3400);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ transform: [{ translateY: f }] }}>
      <LinearGradient colors={['#E8F5E8', '#C8E6C9', '#A5D6A7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
          ...Platform.select({ ios: { shadowColor: '#66BB6A', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
        {/* Mask shape */}
        <View style={{ width: 38, height: 44, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.35)', borderWidth: 1.5, borderColor: 'rgba(102,187,106,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          {/* Eyes */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: -6 }}>
            <View style={{ width: 8, height: 4, borderRadius: 2, backgroundColor: 'rgba(102,187,106,0.4)' }} />
            <View style={{ width: 8, height: 4, borderRadius: 2, backgroundColor: 'rgba(102,187,106,0.4)' }} />
          </View>
        </View>
        <Animated.View style={{ position: 'absolute', top: 12, right: 16, opacity: g }}>
          <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.8)" />
        </Animated.View>
        <Animated.View style={{ position: 'absolute', bottom: 18, left: 16, opacity: g }}>
          <Ionicons name="sparkles" size={10} color="rgba(255,255,255,0.6)" />
        </Animated.View>
        <Text style={{ color: '#2E7D32', fontSize: 7, fontWeight: '800', letterSpacing: 1.5, marginTop: 4 }}>FACE MASK</Text>
      </LinearGradient>
    </Animated.View>
  </View>);
};

// ── 16. Hydra Mist — Hydra facial mist glow ──
export const BeautySticker16: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.4, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 100, height: 100, borderRadius: 24, backgroundColor: '#F0F8FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(135,206,250,0.4)',
      ...Platform.select({ ios: { shadowColor: '#87CEEB', shadowOpacity: 0.25, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
      {/* Mist particles */}
      {[
        { top: 14, left: 30, size: 4 }, { top: 20, left: 44, size: 3 }, { top: 10, left: 56, size: 5 },
        { top: 26, left: 22, size: 3 }, { top: 18, left: 64, size: 4 }, { top: 30, left: 50, size: 3 },
      ].map((p, i) => (
        <Animated.View key={i} style={{ position: 'absolute', top: p.top, left: p.left, width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: 'rgba(135,206,250,0.4)', opacity: g,
          ...Platform.select({ ios: { shadowColor: '#87CEEB', shadowOpacity: 0.5, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
      ))}
      {/* Spray icon */}
      <View style={{ alignItems: 'center', marginTop: 10 }}>
        <View style={{ width: 16, height: 32, borderRadius: 4, backgroundColor: 'rgba(135,206,250,0.3)', borderWidth: 1.5, borderColor: 'rgba(135,206,250,0.6)', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 4 }}>
          <Text style={{ fontSize: 10 }}>💧</Text>
        </View>
        <View style={{ width: 8, height: 6, backgroundColor: 'rgba(135,206,250,0.5)', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 }} />
      </View>
      <Text style={{ color: '#4A9CCF', fontSize: 7, fontWeight: '700', letterSpacing: 2, marginTop: 4 }}>HYDRA</Text>
    </View>
  </View>);
};

// ── 17. Silk Skin Badge — Premium skin quality badge ──
export const BeautySticker17: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.55, 1, 2800);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ opacity: g }}>
      <LinearGradient colors={['#FFF5EE', '#FFE4D6', '#FFDAB9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,218,185,0.6)',
          ...Platform.select({ ios: { shadowColor: '#FFDAB9', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 7 } }) }}>
        <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.4)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 22 }}>✨</Text>
          <Text style={{ color: '#C49A6C', fontSize: 8, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 }}>SILK SKIN</Text>
        </View>
        <View style={{ position: 'absolute', top: 6, left: 14, width: 22, height: 4, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 2, transform: [{ rotate: '-20deg' }] }} />
      </LinearGradient>
    </Animated.View>
  </View>);
};

// ── 18. Beauty Drop + Injector — Combined beauty element ──
export const BeautySticker18: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2600); const f = useFloat(2, 3200);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ transform: [{ translateY: f }] }}>
      <LinearGradient colors={['#F8E8F0', '#F0D0E0', '#E0B0C8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: 100, height: 100, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
          ...Platform.select({ ios: { shadowColor: '#E0B0C8', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {/* Drop */}
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(175,82,222,0.3)', marginBottom: -3 }} />
            <Animated.View style={{ width: 20, height: 18, borderRadius: 10, backgroundColor: 'rgba(175,82,222,0.25)', borderWidth: 1, borderColor: 'rgba(175,82,222,0.5)', opacity: g }}>
              <View style={{ position: 'absolute', top: 3, left: 4, width: 4, height: 6, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 2 }} />
            </Animated.View>
          </View>
          {/* Injector */}
          <View style={{ alignItems: 'center', transform: [{ rotate: '-10deg' }] }}>
            <View style={{ width: 2, height: 5, backgroundColor: '#B07A9A', borderRadius: 1 }} />
            <View style={{ width: 8, height: 2, backgroundColor: '#B07A9A', borderRadius: 1 }} />
            <View style={{ width: 7, height: 18, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, borderWidth: 1, borderColor: '#B07A9A' }} />
            <View style={{ width: 1, height: 8, backgroundColor: '#B07A9A' }} />
          </View>
        </View>
        <Text style={{ color: '#8B5A7A', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 }}>BEAUTY DROP</Text>
      </LinearGradient>
    </Animated.View>
  </View>);
};

// ── 19. Face Profile Line-Art — Elegant profile with glow point ──
export const BeautySticker19: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.4, 1, 2400);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 100, height: 100, borderRadius: 22, backgroundColor: '#FFF8F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(232,168,124,0.3)',
      ...Platform.select({ ios: { shadowColor: '#E8A87C', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 5 } }) }}>
      {/* Profile face — side view using curves */}
      <View style={{ width: 40, height: 50, alignItems: 'flex-start', justifyContent: 'center' }}>
        {/* Forehead curve */}
        <View style={{ width: 20, height: 12, borderTopLeftRadius: 12, backgroundColor: 'transparent', borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: '#C49A6C' }} />
        {/* Nose */}
        <View style={{ width: 12, height: 8, backgroundColor: 'transparent', borderLeftWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#C49A6C', marginTop: -1 }} />
        {/* Lip/Chin */}
        <View style={{ width: 16, height: 10, backgroundColor: 'transparent', borderLeftWidth: 1.5, borderBottomLeftRadius: 8, borderColor: '#C49A6C', marginLeft: 4 }} />
        {/* Glow point on face */}
        <Animated.View style={{ position: 'absolute', left: 22, top: 18, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(232,168,124,0.4)', opacity: g,
          ...Platform.select({ ios: { shadowColor: '#E8A87C', shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
      </View>
      <Text style={{ color: '#C49A6C', fontSize: 7, fontWeight: '700', letterSpacing: 2, marginTop: 2 }}>PROFILE</Text>
    </View>
  </View>);
};

// ── 20. Neon Lips — Dark background glowing lips ──
export const BeautySticker20: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 100, height: 100, borderRadius: 22, backgroundColor: '#0D0D0D', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FF2D55',
      ...Platform.select({ ios: { shadowColor: '#FF2D55', shadowOpacity: 0.6, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 8 } }) }}>
      <Animated.View style={{ opacity: g }}>
        <Text style={{ fontSize: 36, textShadowColor: '#FF2D55', textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } }}>💋</Text>
      </Animated.View>
      <Text style={{ color: '#FF2D55', fontSize: 8, fontWeight: '800', letterSpacing: 2, marginTop: 4, textShadowColor: '#FF2D55', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } }}>LIPS</Text>
    </View>
  </View>);
};

// ── 21. Rose Gold Needle + Sparkles — Elegant needle icon ──
export const BeautySticker21: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2600); const f = useFloat(1.5, 3000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ transform: [{ translateY: f }] }}>
      <LinearGradient colors={['#F5E6D8', '#E8C8A8', '#D4A878']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 16, paddingHorizontal: 20, borderRadius: 18, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
          ...Platform.select({ ios: { shadowColor: '#D4A878', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Animated.View style={{ opacity: g }}>
            <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.8)" />
          </Animated.View>
          {/* Needle */}
          <View style={{ alignItems: 'center', transform: [{ rotate: '45deg' }] }}>
            <View style={{ width: 2, height: 20, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 1 }} />
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' }} />
          </View>
          <Animated.View style={{ opacity: g }}>
            <Ionicons name="sparkles" size={10} color="rgba(255,255,255,0.6)" />
          </Animated.View>
        </View>
        <Text style={{ color: '#FFF', fontSize: 7, fontWeight: '800', letterSpacing: 2, marginTop: 6, textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } }}>ROSE GOLD</Text>
      </LinearGradient>
    </Animated.View>
  </View>);
};

// ── 22. Botox Badge — Clean premium botox indicator ──
export const BeautySticker22: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.6, 1, 2800);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ opacity: g }}>
      <View style={{ width: 96, height: 96, borderRadius: 48, borderWidth: 2, borderColor: '#AF52DE', justifyContent: 'center', alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#AF52DE', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 6 } }) }}>
        <LinearGradient colors={['rgba(175,82,222,0.08)', 'rgba(175,82,222,0.02)']} style={{ ...StyleSheet.absoluteFillObject, borderRadius: 48 }} />
        <View style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, borderColor: 'rgba(175,82,222,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#AF52DE', fontSize: 16, fontWeight: '900', letterSpacing: 2 }}>BTX</Text>
          <View style={{ width: 30, height: 1, backgroundColor: 'rgba(175,82,222,0.3)', marginVertical: 3 }} />
          <Text style={{ color: 'rgba(175,82,222,0.6)', fontSize: 6, fontWeight: '600', letterSpacing: 1.5 }}>PREMIUM</Text>
        </View>
      </View>
    </Animated.View>
  </View>);
};

// ── 23. Skin Glow Circle — Radiant skin badge ──
export const BeautySticker23: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.45, 1, 2200);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFFAF0', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,215,0,0.3)',
      ...Platform.select({ ios: { shadowColor: '#FFD700', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
      {/* Glow rings */}
      <Animated.View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)', justifyContent: 'center', alignItems: 'center', opacity: g }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,215,0,0.15)' }}>
            <View style={{ position: 'absolute', top: 3, left: 4, width: 5, height: 8, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 3 }} />
          </View>
        </View>
      </Animated.View>
      <Text style={{ color: '#B8860B', fontSize: 7, fontWeight: '700', letterSpacing: 2, marginTop: 4 }}>RADIANT</Text>
    </View>
  </View>);
};

// ── 24. Hyaluronic Acid Drop — HA molecule drop ──
export const BeautySticker24: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 3000); const f = useFloat(2.5, 3400);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ transform: [{ translateY: f }] }}>
      <LinearGradient colors={['#E0F7FA', '#B2EBF2', '#80DEEA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: 88, height: 100, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
          ...Platform.select({ ios: { shadowColor: '#26C6DA', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
        {/* HA Drop */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 0, height: 0, borderLeftWidth: 14, borderRightWidth: 14, borderBottomWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(0,172,193,0.3)', marginBottom: -4 }} />
          <Animated.View style={{ width: 28, height: 24, borderRadius: 14, backgroundColor: 'rgba(0,172,193,0.2)', borderWidth: 1.5, borderColor: 'rgba(0,172,193,0.5)', opacity: g }}>
            <View style={{ position: 'absolute', top: 4, left: 5, width: 5, height: 8, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 3 }} />
          </Animated.View>
        </View>
        <Text style={{ color: '#00838F', fontSize: 7, fontWeight: '800', letterSpacing: 1, marginTop: 6 }}>HA</Text>
        <Text style={{ color: '#00838F', fontSize: 5, fontWeight: '600', letterSpacing: 1 }}>HYALURONIC</Text>
      </LinearGradient>
    </Animated.View>
  </View>);
};

// ── 25. Lip Plump — Full lip icon with gloss ──
export const BeautySticker25: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.6, 1, 2200);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#FF6B9D', '#FF4081', '#E91E63']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ paddingVertical: 14, paddingHorizontal: 22, borderRadius: 20, alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#E91E63', shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 7 } }) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name="sparkles" size={12} color="rgba(255,255,255,0.7)" />
        <Text style={{ fontSize: 26 }}>👄</Text>
        <Ionicons name="sparkles" size={12} color="rgba(255,255,255,0.7)" />
      </View>
      {/* Gloss shine */}
      <Animated.View style={{ position: 'absolute', top: 10, right: 28, width: 12, height: 6, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 3, transform: [{ rotate: '-25deg' }], opacity: g }} />
      <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800', letterSpacing: 2, marginTop: 4, textShadowColor: 'rgba(0,0,0,0.2)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } }}>PLUMP</Text>
    </LinearGradient>
  </View>);
};

// ── 26. Micro-Needling Grid — Professional treatment icon ──
export const BeautySticker26: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.4, 1, 2800);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 100, height: 100, borderRadius: 22, backgroundColor: '#FAF5FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.3)',
      ...Platform.select({ ios: { shadowColor: '#A78BFA', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 5 } }) }}>
      {/* Micro-needle grid */}
      <View style={{ width: 44, height: 44, justifyContent: 'center', alignItems: 'center' }}>
        {[0, 1, 2, 3].map(row => (
          <View key={row} style={{ flexDirection: 'row', gap: 6, marginVertical: 2 }}>
            {[0, 1, 2, 3].map(col => (
              <Animated.View key={col} style={{ width: 3, height: 8, backgroundColor: 'rgba(167,139,250,0.5)', borderRadius: 1, opacity: (row + col) % 2 === 0 ? g : 0.5 }} />
            ))}
          </View>
        ))}
      </View>
      <Text style={{ color: '#7C3AED', fontSize: 6, fontWeight: '700', letterSpacing: 1.5, marginTop: 6 }}>MICRO-NEEDLING</Text>
    </View>
  </View>);
};

// ── 27. Vitamin C Serum — Premium vitamin bottle ──
export const BeautySticker27: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const f = useFloat(2, 3000); const g = useGlow(0.55, 1, 2600);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ transform: [{ translateY: f }] }}>
      <LinearGradient colors={['#FFF8E1', '#FFE082', '#FFB300']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ width: 80, height: 100, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
          ...Platform.select({ ios: { shadowColor: '#FFB300', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
        {/* Bottle */}
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 4, height: 6, backgroundColor: '#C49A1C', borderRadius: 2 }} />
          <View style={{ width: 12, height: 3, backgroundColor: '#C49A1C', borderRadius: 1 }} />
          <Animated.View style={{ width: 24, height: 34, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.35)', borderWidth: 1.5, borderColor: 'rgba(196,154,28,0.4)', opacity: g }}>
            <View style={{ position: 'absolute', top: 3, left: 3, width: 3, height: 18, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1.5 }} />
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ color: '#B8860B', fontSize: 14, fontWeight: '900' }}>C</Text>
            </View>
          </Animated.View>
        </View>
        <Text style={{ color: '#8B6914', fontSize: 6, fontWeight: '700', letterSpacing: 1, marginTop: 4 }}>VITAMIN C</Text>
      </LinearGradient>
    </Animated.View>
  </View>);
};

// ── 28. Dermal Filler Vial — Medical filler vial icon ──
export const BeautySticker28: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2400);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ backgroundColor: '#FFF', borderRadius: 18, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(219,112,147,0.4)',
      ...Platform.select({ ios: { shadowColor: '#DB7093', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 5 } }) }}>
      {/* Vial */}
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 22, height: 6, backgroundColor: '#E0A0B8', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
        <Animated.View style={{ width: 22, height: 32, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 4, borderWidth: 1.5, borderColor: '#E0A0B8', opacity: g }}>
          {/* Label */}
          <View style={{ position: 'absolute', top: 6, left: 3, right: 3, height: 12, backgroundColor: 'rgba(219,112,147,0.1)', borderRadius: 2 }} />
          {/* Liquid */}
          <View style={{ position: 'absolute', bottom: 2, left: 2, right: 2, height: 10, backgroundColor: 'rgba(219,112,147,0.2)', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 }} />
        </Animated.View>
      </View>
      <Text style={{ color: '#DB7093', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 6 }}>DERMAL</Text>
      <Text style={{ color: 'rgba(219,112,147,0.6)', fontSize: 5, fontWeight: '600', letterSpacing: 1 }}>FILLER</Text>
    </View>
  </View>);
};

// ── 29. Glow Up Badge — Social media glow up badge ──
export const BeautySticker29: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2000); const f = useFloat(1.5, 3200);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ transform: [{ translateY: f }] }}>
      <LinearGradient colors={['#FF9A9E', '#FECFEF', '#FECFEF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingVertical: 16, paddingHorizontal: 24, borderRadius: 22, alignItems: 'center',
          ...Platform.select({ ios: { shadowColor: '#FF9A9E', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 7 } }) }}>
        <Animated.View style={{ opacity: g, marginBottom: 2 }}>
          <Ionicons name="sparkles" size={18} color="rgba(255,255,255,0.9)" />
        </Animated.View>
        <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.1)', textShadowRadius: 3, textShadowOffset: { width: 0, height: 1 } }}>GLOW UP</Text>
        <View style={{ width: 40, height: 1.5, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginTop: 4 }} />
      </LinearGradient>
    </Animated.View>
  </View>);
};

// ── 30. PRP Tube — Platelet-rich plasma tube icon ──
export const BeautySticker30: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2800);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 80, height: 100, borderRadius: 18, backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.3)',
      ...Platform.select({ ios: { shadowColor: '#FF6B6B', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 5 } }) }}>
      {/* Test tube */}
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 18, height: 5, backgroundColor: '#FF8A80', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
        <Animated.View style={{ width: 18, height: 40, backgroundColor: 'rgba(255,255,255,0.4)', borderBottomLeftRadius: 9, borderBottomRightRadius: 9, borderWidth: 1.5, borderColor: 'rgba(255,138,128,0.5)', overflow: 'hidden', opacity: g }}>
          {/* Blood layers */}
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 14, backgroundColor: 'rgba(255,107,107,0.3)', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }} />
          <View style={{ position: 'absolute', bottom: 14, left: 0, right: 0, height: 8, backgroundColor: 'rgba(255,215,0,0.25)' }} />
          <View style={{ position: 'absolute', bottom: 22, left: 0, right: 0, height: 10, backgroundColor: 'rgba(255,183,77,0.15)' }} />
        </Animated.View>
      </View>
      <Text style={{ color: '#D32F2F', fontSize: 7, fontWeight: '800', letterSpacing: 2, marginTop: 6 }}>PRP</Text>
    </View>
  </View>);
};

// ── 31. Mesotherapy Glow — Skin rejuvenation icon ──
export const BeautySticker31: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.45, 1, 2400);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#FCE4EC', '#F8BBD0', '#F48FB1']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
        ...Platform.select({ ios: { shadowColor: '#F48FB1', shadowOpacity: 0.3, shadowRadius: 14, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
      {/* Multiple glow dots */}
      {[
        { top: 20, left: 24, s: 5 }, { top: 32, left: 38, s: 6 }, { top: 26, left: 54, s: 4 },
        { top: 42, left: 28, s: 4 }, { top: 44, left: 48, s: 5 }, { top: 36, left: 62, s: 3 },
      ].map((p, i) => (
        <Animated.View key={i} style={{ position: 'absolute', top: p.top, left: p.left, width: p.s, height: p.s, borderRadius: p.s / 2, backgroundColor: 'rgba(255,255,255,0.6)', opacity: i % 2 === 0 ? g : 0.6,
          ...Platform.select({ ios: { shadowColor: '#FFF', shadowOpacity: 0.5, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
      ))}
      <Text style={{ color: '#FFF', fontSize: 6, fontWeight: '700', letterSpacing: 1.5, marginTop: 16, textShadowColor: 'rgba(0,0,0,0.1)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 1 } }}>MESOTHERAPY</Text>
    </LinearGradient>
  </View>);
};

// ── 32. Chemical Peel — Skin layers icon ──
export const BeautySticker32: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2600);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 100, height: 100, borderRadius: 22, backgroundColor: '#FFF3E0', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,152,0,0.3)',
      ...Platform.select({ ios: { shadowColor: '#FF9800', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 5 } }) }}>
      {/* Skin layers */}
      {[
        { color: 'rgba(255,183,77,0.4)', w: 50, r: 4 },
        { color: 'rgba(255,167,38,0.35)', w: 46, r: 4 },
        { color: 'rgba(251,140,0,0.3)', w: 42, r: 4 },
      ].map((layer, i) => (
        <Animated.View key={i} style={{ width: layer.w, height: 10, backgroundColor: layer.color, borderRadius: layer.r, marginVertical: 2, opacity: i === 0 ? g : 0.5 + i * 0.15,
          transform: [{ translateX: i * 2 - 2 }] }} />
      ))}
      {/* Peel curl */}
      <View style={{ position: 'absolute', right: 22, top: 28, width: 16, height: 10, borderTopRightRadius: 8, backgroundColor: 'transparent', borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(255,152,0,0.4)', transform: [{ rotate: '15deg' }] }} />
      <Text style={{ color: '#E65100', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 8 }}>PEEL</Text>
    </View>
  </View>);
};

// ── 33. LED Light Therapy — Color therapy dots ──
export const BeautySticker33: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.4, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#1A1A2E', justifyContent: 'center', alignItems: 'center',
      ...Platform.select({ ios: { shadowColor: '#7C4DFF', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 8 } }) }}>
      {/* LED dots */}
      {[
        { color: '#FF1744', top: 22, left: 36 }, { color: '#FF1744', top: 22, left: 50 },
        { color: '#651FFF', top: 34, left: 28 }, { color: '#651FFF', top: 34, left: 42 }, { color: '#651FFF', top: 34, left: 56 },
        { color: '#00BFA5', top: 46, left: 32 }, { color: '#00BFA5', top: 46, left: 46 }, { color: '#00BFA5', top: 46, left: 60 },
        { color: '#FFD600', top: 58, left: 38 }, { color: '#FFD600', top: 58, left: 52 },
      ].map((dot, i) => (
        <Animated.View key={i} style={{ position: 'absolute', top: dot.top, left: dot.left, width: 6, height: 6, borderRadius: 3, backgroundColor: dot.color, opacity: g,
          ...Platform.select({ ios: { shadowColor: dot.color, shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
      ))}
      <Text style={{ color: '#B388FF', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 26, textShadowColor: '#7C4DFF', textShadowRadius: 6, textShadowOffset: { width: 0, height: 0 } }}>LED THERAPY</Text>
    </View>
  </View>);
};

// ── 34. Under Eye Treatment — Eye rejuvenation icon ──
export const BeautySticker34: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2600);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 100, height: 86, borderRadius: 20, backgroundColor: '#F5F0FF', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(147,130,220,0.3)',
      ...Platform.select({ ios: { shadowColor: '#9382DC', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 5 } }) }}>
      {/* Eye shape */}
      <View style={{ width: 44, height: 20, borderRadius: 10, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(147,130,220,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(147,130,220,0.3)' }} />
      </View>
      {/* Under-eye treatment glow */}
      <Animated.View style={{ width: 36, height: 8, borderRadius: 4, backgroundColor: 'rgba(147,130,220,0.2)', marginTop: 4, opacity: g,
        ...Platform.select({ ios: { shadowColor: '#9382DC', shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
      <Text style={{ color: '#7C6BC4', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 6 }}>UNDER EYE</Text>
    </View>
  </View>);
};

// ── 35. Thread Lift — Lifting thread lines icon ──
export const BeautySticker35: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.45, 1, 2800);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#1A1A2E', '#16213E']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      style={{ width: 100, height: 100, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
        ...Platform.select({ ios: { shadowColor: '#D4A017', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 5 } }) }}>
      {/* Face outline with lift lines */}
      <View style={{ width: 34, height: 44, borderRadius: 17, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(212,160,23,0.4)' }}>
        {/* Thread lines going up */}
        {[12, 22, 32].map((top, i) => (
          <Animated.View key={i} style={{ position: 'absolute', right: -8, top, width: 14, height: 1, backgroundColor: 'rgba(212,160,23,0.5)', opacity: g, transform: [{ rotate: '-30deg' }] }} />
        ))}
        {/* Arrow indicators */}
        <Animated.View style={{ position: 'absolute', right: -14, top: 8, opacity: g }}>
          <Ionicons name="arrow-up" size={10} color="rgba(212,160,23,0.6)" />
        </Animated.View>
      </View>
      <Text style={{ color: '#D4A017', fontSize: 7, fontWeight: '700', letterSpacing: 2, marginTop: 6 }}>THREAD LIFT</Text>
    </LinearGradient>
  </View>);
};

// ── 36. Nose Filler — Nose profile refinement icon ──
export const BeautySticker36: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2600);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ width: 88, height: 100, borderRadius: 20, backgroundColor: '#FFF8F5', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(232,168,124,0.3)',
      ...Platform.select({ ios: { shadowColor: '#E8A87C', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 5 } }) }}>
      {/* Nose outline side profile */}
      <View style={{ alignItems: 'center' }}>
        {/* Bridge */}
        <View style={{ width: 2, height: 24, backgroundColor: '#D4A278', borderRadius: 1 }} />
        {/* Tip */}
        <View style={{ width: 14, height: 8, borderBottomLeftRadius: 6, borderBottomRightRadius: 4, backgroundColor: 'transparent', borderBottomWidth: 2, borderLeftWidth: 2, borderColor: '#D4A278' }} />
        {/* Refinement glow */}
        <Animated.View style={{ position: 'absolute', top: 10, left: 6, width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(232,168,124,0.4)', opacity: g,
          ...Platform.select({ ios: { shadowColor: '#E8A87C', shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
      </View>
      {/* Before/After dotted line */}
      <View style={{ width: 30, height: 1, borderWidth: 0.5, borderStyle: 'dashed', borderColor: 'rgba(212,162,120,0.4)', marginTop: 8 }} />
      <Text style={{ color: '#C49A6C', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 4 }}>NOSE FILLER</Text>
    </View>
  </View>);
};

// ── 37. Skin Tightening — RF treatment icon ──
export const BeautySticker37: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.4, 1, 2200);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#FFF0F5', '#FFE4EC', '#FFD1DC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,105,135,0.3)',
        ...Platform.select({ ios: { shadowColor: '#FF6987', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
      {/* RF waves */}
      {[28, 36, 44].map((size2, i) => (
        <Animated.View key={i} style={{ position: 'absolute', width: size2, height: size2, borderRadius: size2 / 2, borderWidth: 1, borderColor: `rgba(255,105,135,${0.3 - i * 0.08})`, opacity: g }} />
      ))}
      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,105,135,0.25)' }} />
      <Text style={{ color: '#E91E63', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 24 }}>TIGHTEN</Text>
    </LinearGradient>
  </View>);
};

// ── 38. Luxury Eye Cream — Premium eye treatment icon ──
export const BeautySticker38: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const f = useFloat(1.5, 3400); const g = useGlow(0.55, 1, 2800);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ transform: [{ translateY: f }] }}>
      <LinearGradient colors={['#E8D5B7', '#D4B896', '#C49A6C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={{ borderRadius: 16, padding: 2 }}>
        <View style={{ backgroundColor: '#FFF8F2', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' }}>
          {/* Jar */}
          <View style={{ alignItems: 'center' }}>
            <View style={{ width: 30, height: 4, backgroundColor: '#D4B896', borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
            <Animated.View style={{ width: 28, height: 16, backgroundColor: 'rgba(232,213,183,0.4)', borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderWidth: 1, borderColor: '#D4B896', opacity: g }}>
              <View style={{ position: 'absolute', top: 2, left: 4, width: 6, height: 3, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1.5 }} />
            </Animated.View>
          </View>
          <Text style={{ color: '#8B6914', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 6 }}>EYE CREAM</Text>
          <View style={{ flexDirection: 'row', marginTop: 3 }}>
            {[0, 1, 2].map(i => <Ionicons key={i} name="star" size={8} color="#D4A017" style={{ marginHorizontal: 0.5 }} />)}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  </View>);
};

// ── 39. Sculpt Clinic — Body sculpting icon ──
export const BeautySticker39: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.5, 1, 2400);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <LinearGradient colors={['#16213E', '#1A1A2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: 100, height: 100, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,107,157,0.3)',
        ...Platform.select({ ios: { shadowColor: '#FF6B9D', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 5 } }) }}>
      {/* Body silhouette curves */}
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 24, height: 6, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: 'transparent', borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,107,157,0.5)' }} />
        <View style={{ width: 20, height: 16, backgroundColor: 'transparent', borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,107,157,0.5)' }} />
        <Animated.View style={{ width: 28, height: 14, borderTopLeftRadius: 14, borderTopRightRadius: 14, backgroundColor: 'transparent', borderTopWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: 'rgba(255,107,157,0.5)', opacity: g }} />
      </View>
      {/* Sculpt markers */}
      {[{ top: 40, left: 28 }, { top: 40, right: 28 }].map((p, i) => (
        <Animated.View key={i} style={{ position: 'absolute', ...p, width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,107,157,0.4)', opacity: g }} />
      ))}
      <Text style={{ color: '#FF6B9D', fontSize: 7, fontWeight: '700', letterSpacing: 2, marginTop: 8 }}>SCULPT</Text>
    </LinearGradient>
  </View>);
};

// ── 40. Premium Beauty Star — Ultimate luxury star badge ──
export const BeautySticker40: React.FC<BeautyStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = useGlow(0.45, 1, 2200); const f = useFloat(2, 3600);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <Animated.View style={{ transform: [{ translateY: f }] }}>
      <LinearGradient colors={['#D4A017', '#F5D060', '#D4A017']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ borderRadius: 50, padding: 2 }}>
        <View style={{ width: 92, height: 92, borderRadius: 46, backgroundColor: '#1C1917', justifyContent: 'center', alignItems: 'center',
          ...Platform.select({ ios: { shadowColor: '#D4A017', shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 0 } }, android: { elevation: 8 } }) }}>
          <Animated.View style={{ opacity: g }}>
            <Text style={{ fontSize: 28 }}>⭐</Text>
          </Animated.View>
          <Text style={{ color: '#F5D060', fontSize: 8, fontWeight: '900', letterSpacing: 2, marginTop: 2 }}>PREMIUM</Text>
          <View style={{ width: 36, height: 1, backgroundColor: 'rgba(245,208,96,0.4)', marginTop: 3 }} />
          <Text style={{ color: 'rgba(245,208,96,0.6)', fontSize: 6, fontWeight: '600', letterSpacing: 1.5, marginTop: 2 }}>BEAUTY</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  </View>);
};

// ========== Registry ==========
export const BEAUTY_STICKER_DESIGNS_EXTENDED = [
  { id: 'beauty_11', label: 'Lip Injector', tags: [...BEAUTY_TAGS, 'lip', 'filler', 'injector', 'plump'], Component: BeautySticker11 },
  { id: 'beauty_12', label: 'Anti-Aging Glow', tags: [...BEAUTY_TAGS, 'anti-aging', 'wrinkle', 'smooth', 'rejuvenation'], Component: BeautySticker12 },
  { id: 'beauty_13', label: 'Cheek Highlight', tags: [...BEAUTY_TAGS, 'cheek', 'highlight', 'blush', 'face'], Component: BeautySticker13 },
  { id: 'beauty_14', label: 'Jawline Contour', tags: [...BEAUTY_TAGS, 'jawline', 'contour', 'v-line', 'face'], Component: BeautySticker14 },
  { id: 'beauty_15', label: 'Sparkle Face Mask', tags: [...BEAUTY_TAGS, 'mask', 'facial', 'sparkle', 'treatment'], Component: BeautySticker15 },
  { id: 'beauty_16', label: 'Hydra Mist', tags: [...BEAUTY_TAGS, 'hydra', 'mist', 'facial', 'moisture', 'spray'], Component: BeautySticker16 },
  { id: 'beauty_17', label: 'Silk Skin Badge', tags: [...BEAUTY_TAGS, 'silk', 'skin', 'smooth', 'badge', 'premium'], Component: BeautySticker17 },
  { id: 'beauty_18', label: 'Beauty Drop', tags: [...BEAUTY_TAGS, 'drop', 'injector', 'serum', 'filler'], Component: BeautySticker18 },
  { id: 'beauty_19', label: 'Face Profile', tags: [...BEAUTY_TAGS, 'face', 'profile', 'line-art', 'elegant'], Component: BeautySticker19 },
  { id: 'beauty_20', label: 'Neon Lips', tags: [...BEAUTY_TAGS, 'neon', 'lips', 'dark', 'glow', 'bold'], Component: BeautySticker20 },
  { id: 'beauty_21', label: 'Rose Gold Needle', tags: [...BEAUTY_TAGS, 'needle', 'rose-gold', 'sparkle', 'injection'], Component: BeautySticker21 },
  { id: 'beauty_22', label: 'Botox Badge', tags: [...BEAUTY_TAGS, 'botox', 'badge', 'premium', 'btx'], Component: BeautySticker22 },
  { id: 'beauty_23', label: 'Skin Glow', tags: [...BEAUTY_TAGS, 'skin', 'glow', 'radiant', 'golden'], Component: BeautySticker23 },
  { id: 'beauty_24', label: 'Hyaluronic Acid', tags: [...BEAUTY_TAGS, 'hyaluronic', 'acid', 'ha', 'hydration'], Component: BeautySticker24 },
  { id: 'beauty_25', label: 'Lip Plump', tags: [...BEAUTY_TAGS, 'lip', 'plump', 'full', 'gloss'], Component: BeautySticker25 },
  { id: 'beauty_26', label: 'Micro-Needling', tags: [...BEAUTY_TAGS, 'micro-needling', 'derma', 'collagen', 'treatment'], Component: BeautySticker26 },
  { id: 'beauty_27', label: 'Vitamin C Serum', tags: [...BEAUTY_TAGS, 'vitamin', 'serum', 'bottle', 'skincare'], Component: BeautySticker27 },
  { id: 'beauty_28', label: 'Dermal Filler', tags: [...BEAUTY_TAGS, 'dermal', 'filler', 'vial', 'injection'], Component: BeautySticker28 },
  { id: 'beauty_29', label: 'Glow Up', tags: [...BEAUTY_TAGS, 'glow-up', 'transform', 'sparkle', 'social'], Component: BeautySticker29 },
  { id: 'beauty_30', label: 'PRP Tube', tags: [...BEAUTY_TAGS, 'prp', 'plasma', 'blood', 'rejuvenation'], Component: BeautySticker30 },
  { id: 'beauty_31', label: 'Mesotherapy', tags: [...BEAUTY_TAGS, 'mesotherapy', 'rejuvenation', 'glow', 'treatment'], Component: BeautySticker31 },
  { id: 'beauty_32', label: 'Chemical Peel', tags: [...BEAUTY_TAGS, 'chemical', 'peel', 'exfoliation', 'skin-layers'], Component: BeautySticker32 },
  { id: 'beauty_33', label: 'LED Therapy', tags: [...BEAUTY_TAGS, 'led', 'light', 'therapy', 'photon', 'color'], Component: BeautySticker33 },
  { id: 'beauty_34', label: 'Under Eye', tags: [...BEAUTY_TAGS, 'under-eye', 'dark-circles', 'eye', 'treatment'], Component: BeautySticker34 },
  { id: 'beauty_35', label: 'Thread Lift', tags: [...BEAUTY_TAGS, 'thread', 'lift', 'pdo', 'tightening'], Component: BeautySticker35 },
  { id: 'beauty_36', label: 'Nose Filler', tags: [...BEAUTY_TAGS, 'nose', 'rhinoplasty', 'filler', 'refinement'], Component: BeautySticker36 },
  { id: 'beauty_37', label: 'Skin Tightening', tags: [...BEAUTY_TAGS, 'tightening', 'rf', 'radiofrequency', 'firm'], Component: BeautySticker37 },
  { id: 'beauty_38', label: 'Eye Cream', tags: [...BEAUTY_TAGS, 'eye', 'cream', 'jar', 'luxury', 'gold'], Component: BeautySticker38 },
  { id: 'beauty_39', label: 'Sculpt Clinic', tags: [...BEAUTY_TAGS, 'sculpt', 'body', 'contour', 'shape'], Component: BeautySticker39 },
  { id: 'beauty_40', label: 'Premium Star', tags: [...BEAUTY_TAGS, 'premium', 'star', 'gold', 'luxury', 'badge'], Component: BeautySticker40 },
];

const x = StyleSheet.create({ c: { alignItems: 'center', justifyContent: 'center' } });
