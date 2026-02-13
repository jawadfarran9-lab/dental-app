/**
 * Extended Laser Machine Sticker Designs (11–40) — Search Collection
 *
 * 30 premium laser machine stickers with animated glow, tilted heads,
 * 3‑D wheels, bevels, and reflective highlights.
 * Shown via search in the GIF picker modal.
 * Only shown to clinics where clinicType === 'laser'.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';
import { LaserStickerProps } from './LaserStickers';

const LASER_TAGS = ['laser', 'machine', 'device', 'equipment', 'clinical', 'treatment'];

/* ─── shared pulse (matches featured file) ─── */
const usePulse = (min = 0.55, max = 1, dur = 1800) => {
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

/* ─── reusable sub-components ─── */
const W: React.FC<{ d?: boolean }> = ({ d }) => (
  <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: d ? '#27272A' : '#3F3F46', borderWidth: 1.5, borderColor: d ? '#18181B' : '#52525B', justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: d ? '#3F3F46' : '#71717A' }} />
  </View>
);
const ES: React.FC<{ sz?: number }> = ({ sz = 9 }) => (
  <View style={{ width: sz, height: sz, borderRadius: sz / 2, backgroundColor: '#DC2626', borderWidth: 1.5, borderTopColor: '#F87171', borderLeftColor: '#F87171', borderRightColor: '#991B1B', borderBottomColor: '#991B1B', ...Platform.select({ ios: { shadowColor: '#DC2626', shadowOpacity: 0.4, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }, android: {} }) }} />
);
const Ld: React.FC<{ c: string; g: Animated.Value; sz?: number }> = ({ c, g, sz = 6 }) => (
  <Animated.View style={{ width: sz, height: sz, borderRadius: sz / 2, backgroundColor: c, opacity: g, ...Platform.select({ ios: { shadowColor: c, shadowOpacity: 0.65, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
);
/* Handpiece helper */
const HP: React.FC<{ side: 'L' | 'R'; clr?: string; top?: number }> = ({ side, clr = '#9CA3AF', top = 40 }) => {
  const lr = side === 'L' ? { left: 10 } : { right: 10 };
  const lr2 = side === 'L' ? { left: 9 } : { right: 9 };
  const lr3 = side === 'L' ? { left: 10 } : { right: 10 };
  const lr4 = side === 'L' ? { left: 3 } : { right: 3 };
  return (<>
    <View style={{ position: 'absolute', ...lr, top, width: 2.5, height: 16, backgroundColor: clr, borderRadius: 1 }} />
    <View style={{ position: 'absolute', ...lr2, top: top + 14, width: 4, height: 4, borderRadius: 2, backgroundColor: clr }} />
    <View style={{ position: 'absolute', ...lr3, top: top + 16, width: 2.5, height: 12, backgroundColor: clr, borderRadius: 1 }} />
    <View style={{ position: 'absolute', ...lr4, top: top + 26, width: 14, height: 7, backgroundColor: clr, borderRadius: 3.5, borderWidth: 1, borderColor: clr }} />
  </>);
};

// ── 11. Ivory Tower Machine ──
export const LaserSticker11: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 96, height: 114 }}>
      <Animated.View style={{ width: 48, height: 24, backgroundColor: '#0F172A', borderRadius: 5, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#0EA5E9', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 42, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#0284C7', '#38BDF8']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 14, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginBottom: 2 }} />
            <View style={{ width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#E5E5DD' }} />
      <View style={{ width: 54, height: 58, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E5E5DD', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#FAFAF5', '#F0F0EA', '#E8E8E2']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 8 }} /><ES />
          </View>
          {[0, 1, 2, 3, 4].map(i => (<View key={i} style={{ width: 34 - i, height: 1.5, backgroundColor: '#D4D4CC', borderRadius: 1, marginBottom: 2.5 }} />))}
          <LinearGradient colors={['#E5E5DD', '#D4D4CC']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
            <Text style={{ fontSize: 4.5, fontWeight: '900', color: '#8B8B80', letterSpacing: 1.5 }}>IVORY</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <HP side="R" clr="#A3A39B" top={38} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 46, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 12. Carbon Black Machine ──
export const LaserSticker12: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.45, 1, 1600);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 96, height: 114 }}>
      <Animated.View style={{ width: 50, height: 26, backgroundColor: '#0A0A0A', borderRadius: 5, borderWidth: 1.2, borderColor: '#262626', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#EF4444', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 44, height: 20, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#DC2626', '#EF4444']} style={{ flex: 1, padding: 3, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 14, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)' }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 16, height: 4, backgroundColor: '#171717' }} />
      <View style={{ width: 56, height: 56, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#262626', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <LinearGradient colors={['#1A1A1A', '#141414', '#0F0F0F']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} />
          <ES sz={10} />
          {[0, 1, 2, 3].map(i => (
            <Animated.View key={i} style={{ width: 36, height: 2.5, borderRadius: 1.2, marginTop: 3, opacity: g }}>
              <LinearGradient colors={['#EF4444', '#F87171']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 1.2, ...Platform.select({ ios: { shadowColor: '#EF4444', shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
            </Animated.View>
          ))}
        </LinearGradient>
      </View>
      <HP side="L" clr="#404040" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 48, marginTop: 3 }}><W d /><W d /></View>
    </View>
  </View>);
};

// ── 13. Pearl White Wide ──
export const LaserSticker13: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 1900);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 100, height: 110 }}>
      <Animated.View style={{ width: 52, height: 24, backgroundColor: '#0F172A', borderRadius: 4, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#2563EB', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 46, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#2563EB', '#60A5FA']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginBottom: 2 }} />
            <View style={{ width: 20, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 18, height: 4, backgroundColor: '#E5E7EB' }} />
      <View style={{ width: 66, height: 52, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E5E5E5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#FAFAFA', '#F3F4F6', '#ECECEC']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 6 }} /><ES sz={10} />
          </View>
          <View style={{ width: 46, height: 22, backgroundColor: '#E5E7EB', borderRadius: 4, borderWidth: 1, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' }}>
            {[0, 1, 2, 3].map(i => (<View key={i} style={{ width: 36, height: 1.5, backgroundColor: '#CBD5E1', borderRadius: 1, marginBottom: 2 }} />))}
          </View>
        </LinearGradient>
      </View>
      <HP side="R" top={38} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 56, marginTop: 4 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 14. Gunmetal Pro ──
export const LaserSticker14: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2100);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 92, height: 114 }}>
      <Animated.View style={{ width: 46, height: 24, backgroundColor: '#111827', borderRadius: 4, borderWidth: 1.2, borderColor: '#374151', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#7C3AED', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 40, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#7C3AED', '#A78BFA']} style={{ flex: 1, padding: 2, justifyContent: 'center' }}>
            <View style={{ width: 14, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginBottom: 2 }} />
            <View style={{ width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#4B5563' }} />
      <View style={{ width: 52, height: 60, borderRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderColor: '#4B5563', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <LinearGradient colors={['#6B7280', '#4B5563', '#3B4150']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <ES sz={9} /><View style={{ width: 8 }} /><Ld c="#EAB308" g={g} />
          </View>
          <View style={{ width: 30, height: 24, backgroundColor: '#374151', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#4B5563' }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#6B7280', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#6B7280' }} />
            </View>
          </View>
        </LinearGradient>
      </View>
      <HP side="R" clr="#6B7280" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 44, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 15. Diode Tower ──
export const LaserSticker15: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 86, height: 116 }}>
      <Animated.View style={{ width: 42, height: 22, backgroundColor: '#0F172A', borderRadius: 4, borderWidth: 1.2, borderColor: '#1E293B', justifyContent: 'center', alignItems: 'center', zIndex: 3, ...Platform.select({ ios: { shadowColor: '#0891B2', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 36, height: 16, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#0891B2', '#22D3EE']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginBottom: 2 }} />
            <View style={{ width: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 12, height: 4, backgroundColor: '#F5F5F5' }} />
      <View style={{ width: 48, height: 68, borderRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E5E5E5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#FAFAFA', '#F3F4F6', '#ECECEC']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
            <Ld c="#22C55E" g={g} /><View style={{ width: 6 }} /><ES sz={7} />
          </View>
          <Animated.View style={{ width: 2, height: 16, backgroundColor: '#0891B2', borderRadius: 1, marginBottom: 4, opacity: g, ...Platform.select({ ios: { shadowColor: '#0891B2', shadowOpacity: 0.6, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
          {[0, 1, 2, 3, 4, 5].map(i => (<View key={i} style={{ width: 30, height: 1, backgroundColor: '#D4D4D8', marginBottom: 2 }} />))}
          <LinearGradient colors={['#E5E7EB', '#D1D5DB']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
            <Text style={{ fontSize: 4, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5 }}>DIODE</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 40, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 16. Rose Gold Compact ──
export const LaserSticker16: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 1800);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 90, height: 108 }}>
      <Animated.View style={{ width: 42, height: 22, backgroundColor: '#1C1917', borderRadius: 4, borderWidth: 1.2, borderColor: '#44403C', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '5deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#F59E0B', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 36, height: 16, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#F59E0B', '#FBBF24']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginBottom: 2 }} />
            <View style={{ width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 3, backgroundColor: '#E7C8B8' }} />
      <View style={{ width: 52, height: 50, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E7C8B8', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#F5E6DB', '#EDD5C8', '#E5C8B8']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.4)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
            <Ld c="#EC4899" g={g} /><View style={{ width: 6 }} /><ES sz={7} />
          </View>
          <View style={{ width: 28, height: 20, backgroundColor: '#E7C8B8', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4A08A' }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#C09A84', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#C09A84' }} />
            </View>
          </View>
        </LinearGradient>
      </View>
      <HP side="R" clr="#C09A84" top={34} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 44, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 17. Arctic White Tall ──
export const LaserSticker17: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2100);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 84, height: 116 }}>
      <Animated.View style={{ width: 40, height: 20, backgroundColor: '#0F172A', borderRadius: 4, borderWidth: 1.2, borderColor: '#1E293B', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#0EA5E9', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 34, height: 14, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#0EA5E9', '#38BDF8']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 12, height: 4, backgroundColor: '#FAFAFA' }} />
      <View style={{ width: 46, height: 70, borderRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E4E4E7', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#FAFAFA', '#F4F4F5', '#ECECEE']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.7)' }} />
          <ES sz={9} />
          <View style={{ width: 30, height: 1.5, backgroundColor: '#D4D4D8', borderRadius: 1, marginTop: 6, marginBottom: 6 }} />
          <View style={{ width: 26, height: 26, borderRadius: 5, backgroundColor: '#F4F4F5', borderWidth: 1.5, borderColor: '#D4D4D8', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#E4E4E7' }} />
          </View>
          <LinearGradient colors={['#E5E7EB', '#D1D5DB']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 }}>
            <Text style={{ fontSize: 4, fontWeight: '900', color: '#A1A1AA', letterSpacing: 1.5 }}>ARCTIC</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 38, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 18. Charcoal Split Body ──
export const LaserSticker18: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 94, height: 114 }}>
      <Animated.View style={{ width: 48, height: 24, backgroundColor: '#111827', borderRadius: 4, borderWidth: 1.2, borderColor: '#1F2937', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#059669', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 42, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#059669', '#34D399']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 14, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginBottom: 2 }} />
            <View style={{ width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 16, height: 4, backgroundColor: '#374151' }} />
      {/* Upper */}
      <View style={{ width: 56, height: 28, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderBottomWidth: 0, borderColor: '#374151' }}>
        <LinearGradient colors={['#4B5563', '#374151']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 8 }} /><ES sz={8} />
          </View>
        </LinearGradient>
      </View>
      {/* Lower */}
      <View style={{ width: 56, height: 32, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderTopWidth: 0, borderColor: '#4B5563', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#6B7280', '#4B5563']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {[0, 1, 2, 3, 4, 5].map(i => (<View key={i} style={{ width: 36 - i, height: 1.5, backgroundColor: '#374151', borderRadius: 1, marginBottom: 2 }} />))}
        </LinearGradient>
      </View>
      <HP side="R" clr="#6B7280" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 48, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 19. Sapphire Blue ──
export const LaserSticker19: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 1900);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 92, height: 112 }}>
      <Animated.View style={{ width: 46, height: 24, backgroundColor: '#0F172A', borderRadius: 5, borderWidth: 1.2, borderColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-5deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 40, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#1D4ED8', '#3B82F6']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginBottom: 2 }} />
            <View style={{ width: 18, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#1E3A5F' }} />
      <View style={{ width: 54, height: 58, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#1E3A5F', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <LinearGradient colors={['#1E40AF', '#1E3A5F', '#172554']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 8 }} /><ES sz={8} />
          </View>
          <View style={{ width: 32, height: 24, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 5, justifyContent: 'center', alignItems: 'center' }}>
            {[0, 1, 2, 3].map(i => (<View key={i} style={{ width: 24, height: 1.5, backgroundColor: 'rgba(96,165,250,0.4)', borderRadius: 1, marginBottom: 2 }} />))}
          </View>
          <LinearGradient colors={['#1E3A5F', '#162D4A']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
            <Text style={{ fontSize: 4, fontWeight: '900', color: '#93C5FD', letterSpacing: 1.5 }}>SAPPHIRE</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <HP side="L" clr="#3B82F6" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 46, marginTop: 3 }}><W d /><W d /></View>
    </View>
  </View>);
};

// ── 20. Cream Clinical ──
export const LaserSticker20: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 96, height: 110 }}>
      <Animated.View style={{ width: 48, height: 22, backgroundColor: '#292524', borderRadius: 4, borderWidth: 1.2, borderColor: '#44403C', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#DC2626', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 42, height: 16, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#DC2626', '#F87171']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 16, height: 4, backgroundColor: '#FDF6EE' }} />
      <View style={{ flexDirection: 'row', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 3 } }) }}>
        <View style={{ width: 11, height: 54, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, overflow: 'hidden' }}>
          <LinearGradient colors={['#E8DDD0', '#DDD0C0']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {[0, 1, 2, 3, 4, 5].map(i => (<View key={i} style={{ width: 7, height: 1.2, backgroundColor: '#C0A888', borderRadius: 0.6, marginBottom: 3 }} />))}
          </LinearGradient>
        </View>
        <View style={{ width: 42, height: 54, overflow: 'hidden', borderWidth: 1, borderColor: '#E8DDD0' }}>
          <LinearGradient colors={['#FDF6EE', '#F5EDDF']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
            <View style={{ position: 'absolute', left: 0, top: 0, width: 2, height: '100%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
            <ES sz={8} />
            <View style={{ width: 26, height: 22, backgroundColor: '#F0E6D8', borderRadius: 4, marginTop: 4, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D4C8B5' }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 1.5, borderColor: '#C0A080' }} />
            </View>
          </LinearGradient>
        </View>
        <View style={{ width: 11, height: 54, borderTopRightRadius: 8, borderBottomRightRadius: 8, overflow: 'hidden' }}>
          <LinearGradient colors={['#E8DDD0', '#DDD0C0']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {[0, 1, 2, 3, 4, 5].map(i => (<View key={i} style={{ width: 7, height: 1.2, backgroundColor: '#C0A888', borderRadius: 0.6, marginBottom: 3 }} />))}
          </LinearGradient>
        </View>
      </View>
      <HP side="R" clr="#C0A080" top={34} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 52, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ========== BATCH 2: 21–30 ==========

// ── 21. Onyx Dual Panel ──
export const LaserSticker21: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.45, 1, 1700);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 94, height: 114 }}>
      <Animated.View style={{ width: 48, height: 24, backgroundColor: '#0A0A0A', borderRadius: 5, borderWidth: 1.2, borderColor: '#262626', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#06B6D4', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 42, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#06B6D4', '#22D3EE']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 1, marginBottom: 2 }} />
            <View style={{ width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#171717' }} />
      <View style={{ flexDirection: 'row', borderRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderColor: '#262626', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <View style={{ width: 28, height: 58, backgroundColor: '#171717', justifyContent: 'center', alignItems: 'center' }}>
          {[0, 1, 2, 3, 4].map(i => (
            <Animated.View key={i} style={{ width: 18, height: 2, borderRadius: 1, marginBottom: 3, opacity: g }}>
              <LinearGradient colors={['#06B6D4', '#22D3EE']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 1, ...Platform.select({ ios: { shadowColor: '#06B6D4', shadowOpacity: 0.5, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
            </Animated.View>
          ))}
        </View>
        <View style={{ width: 28, height: 58, backgroundColor: '#1A1A1A', borderLeftWidth: 1, borderColor: '#262626', alignItems: 'center', paddingTop: 8 }}>
          <ES sz={8} />
          <View style={{ marginTop: 4 }}><Ld c="#EAB308" g={g} /></View>
          <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: '#262626', marginTop: 4, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#404040' }} />
          </View>
        </View>
      </View>
      <HP side="R" clr="#404040" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 48, marginTop: 3 }}><W d /><W d /></View>
    </View>
  </View>);
};

// ── 22. Platinum Series ──
export const LaserSticker22: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 92, height: 114 }}>
      <Animated.View style={{ width: 48, height: 26, backgroundColor: '#1E293B', borderRadius: 5, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#6366F1', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 42, height: 20, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#4338CA', '#6366F1']} style={{ flex: 1, padding: 3 }}>
            <View style={{ width: 14, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#C0C0C0' }} />
      <View style={{ width: 54, height: 58, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#A1A1AA', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <LinearGradient colors={['#D4D4D8', '#C0C0C0', '#B0B0B8', '#C0C0C0']} locations={[0, 0.3, 0.6, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
            <ES sz={9} /><View style={{ width: 8 }} /><Ld c="#EAB308" g={g} />
          </View>
          <View style={{ width: 30, height: 1.5, backgroundColor: '#9CA3AF', marginBottom: 6 }} />
          {[0, 1, 2, 3, 4, 5].map(i => (<View key={i} style={{ width: 32, height: 1, backgroundColor: '#A1A1AA', marginBottom: 2 }} />))}
          <LinearGradient colors={['#B0B0B8', '#A0A0A8']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
            <Text style={{ fontSize: 4, fontWeight: '900', color: '#71717A', letterSpacing: 1.5 }}>PLATINUM</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 46, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 23. IPL Wide Screen ──
export const LaserSticker23: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 1800);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 100, height: 112 }}>
      <Animated.View style={{ width: 60, height: 30, backgroundColor: '#0F172A', borderRadius: 5, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#F59E0B', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 54, height: 24, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#F59E0B', '#D97706']} style={{ flex: 1, padding: 3, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: 12, height: 3, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
              <View style={{ width: 10, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
            </View>
            <View style={{ width: 22, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 18, height: 4, backgroundColor: '#F5F5F5' }} />
      <View style={{ width: 58, height: 50, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E5E5E5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#FAFAFA', '#F3F4F6', '#ECECEC']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
            <Ld c="#F59E0B" g={g} /><View style={{ width: 8 }} /><ES sz={9} />
          </View>
          <View style={{ width: 38, height: 20, backgroundColor: '#E5E7EB', borderRadius: 4, borderWidth: 1, borderColor: '#D1D5DB' }}>
            {[0, 1, 2, 3].map(i => (<View key={i} style={{ width: 30, height: 1, backgroundColor: '#CBD5E1', marginTop: 3, alignSelf: 'center' }} />))}
          </View>
        </LinearGradient>
      </View>
      <HP side="R" top={42} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 50, marginTop: 4 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 24. Stealth Dark ──
export const LaserSticker24: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.4, 1, 1500);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 90, height: 114 }}>
      <Animated.View style={{ width: 44, height: 22, backgroundColor: '#0A0A0A', borderRadius: 4, borderWidth: 1.2, borderColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '5deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#22C55E', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 38, height: 16, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#22C55E', '#16A34A']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#18181B' }} />
      <View style={{ width: 50, height: 62, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#27272A', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <LinearGradient colors={['#1C1C1E', '#18181B', '#121214']} style={{ flex: 1, alignItems: 'center' }}>
          <Animated.View style={{ position: 'absolute', right: 6, top: 6, width: 2.5, height: 50, borderRadius: 1.2, opacity: g }}>
            <LinearGradient colors={['#22C55E', '#4ADE80', '#22C55E']} style={{ flex: 1, borderRadius: 1.2, ...Platform.select({ ios: { shadowColor: '#22C55E', shadowOpacity: 0.7, shadowRadius: 6, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
          </Animated.View>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2, height: '100%', backgroundColor: 'rgba(255,255,255,0.03)' }} />
          <View style={{ marginTop: 10 }}><ES sz={9} /></View>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#27272A', marginTop: 6, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#3F3F46', justifyContent: 'center', alignItems: 'center' }}>
              <Ld c="#22C55E" g={g} sz={5} />
            </View>
          </View>
        </LinearGradient>
      </View>
      <HP side="L" clr="#3F3F46" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 42, marginTop: 3 }}><W d /><W d /></View>
    </View>
  </View>);
};

// ── 25. Snow White Mini ──
export const LaserSticker25: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 86, height: 104 }}>
      <View style={{ width: 24, height: 7, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderWidth: 2, borderBottomWidth: 0, borderColor: '#D4D4D8', marginBottom: -1 }} />
      <Animated.View style={{ width: 40, height: 20, backgroundColor: '#0F172A', borderRadius: 4, borderWidth: 1.2, borderColor: '#1E293B', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#0EA5E9', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 34, height: 14, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#0EA5E9', '#7DD3FC']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 12, height: 3, backgroundColor: '#FAFAFA' }} />
      <View style={{ width: 46, height: 44, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E4E4E7', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }) }}>
        <LinearGradient colors={['#FAFAFA', '#F4F4F5', '#ECECEE']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.7)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
            <Ld c="#22C55E" g={g} sz={5} /><View style={{ width: 6 }} /><ES sz={7} />
          </View>
          <View style={{ width: 24, height: 16, backgroundColor: '#F4F4F5', borderRadius: 3, borderWidth: 1, borderColor: '#D4D4D8' }} />
        </LinearGradient>
      </View>
      <HP side="R" clr="#A1A1AA" top={32} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 38, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 26. Obsidian Tall ──
export const LaserSticker26: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.45, 1, 1600);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 88, height: 116 }}>
      <Animated.View style={{ width: 46, height: 26, backgroundColor: '#0A0A0A', borderRadius: 5, borderWidth: 1.2, borderColor: '#262626', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-5deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#7C3AED', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 40, height: 20, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#7C3AED', '#A78BFA']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#171717' }} />
      <View style={{ width: 50, height: 64, borderRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderColor: '#262626', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <LinearGradient colors={['#141414', '#0D0D0D', '#080808']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <Animated.View style={{ width: 2.5, height: 24, backgroundColor: '#7C3AED', borderRadius: 1.2, marginBottom: 6, opacity: g, ...Platform.select({ ios: { shadowColor: '#7C3AED', shadowOpacity: 0.6, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
          <ES sz={10} />
          {[0, 1, 2, 3].map(i => (<View key={i} style={{ width: 30, height: 1, backgroundColor: '#262626', marginTop: 3 }} />))}
        </LinearGradient>
      </View>
      <HP side="R" clr="#404040" top={42} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 42, marginTop: 3 }}><W d /><W d /></View>
    </View>
  </View>);
};

// ── 27. Beige Medical ──
export const LaserSticker27: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 94, height: 112 }}>
      <Animated.View style={{ width: 46, height: 22, backgroundColor: '#292524', borderRadius: 4, borderWidth: 1.2, borderColor: '#44403C', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 40, height: 16, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#2563EB', '#60A5FA']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#F5F0E8' }} />
      <View style={{ width: 56, height: 58, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E5DDD0', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#F5F0E8', '#EDE5D8', '#E5DDD0']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.4)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 6 }} /><ES sz={9} />
          </View>
          <View style={{ width: 34, height: 26, backgroundColor: '#EDE5D8', borderRadius: 5, borderWidth: 1, borderColor: '#D4C8B5' }}>
            {[0, 1, 2, 3, 4].map(i => (<View key={i} style={{ width: 26, height: 1, backgroundColor: '#D4C8B5', marginTop: 3, alignSelf: 'center' }} />))}
          </View>
        </LinearGradient>
      </View>
      <HP side="R" clr="#C0A888" top={38} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 48, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 28. Graphite Wide ──
export const LaserSticker28: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 1900);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 102, height: 110 }}>
      <Animated.View style={{ width: 54, height: 26, backgroundColor: '#111827', borderRadius: 5, borderWidth: 1.2, borderColor: '#1F2937', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#0891B2', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 48, height: 20, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#0891B2', '#06B6D4']} style={{ flex: 1, padding: 3 }}>
            <View style={{ width: 18, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 18, height: 4, backgroundColor: '#374151' }} />
      <View style={{ width: 66, height: 52, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#4B5563', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <LinearGradient colors={['#4B5563', '#374151', '#2D3748']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
            <Ld c="#22C55E" g={g} sz={5} /><View style={{ width: 4 }} /><Ld c="#EAB308" g={g} sz={5} /><View style={{ width: 4 }} /><ES sz={10} />
          </View>
          <View style={{ width: 46, height: 24, backgroundColor: '#2D3748', borderRadius: 4 }}>
            {[0, 1, 2, 3, 4].map(i => (<View key={i} style={{ width: 38, height: 1, backgroundColor: '#4B5563', marginTop: 3, alignSelf: 'center' }} />))}
          </View>
        </LinearGradient>
      </View>
      <HP side="R" clr="#6B7280" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 56, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 29. White Trio Panel ──
export const LaserSticker29: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 98, height: 114 }}>
      <Animated.View style={{ width: 50, height: 24, backgroundColor: '#0F172A', borderRadius: 4, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#F97316', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 44, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#DC2626', '#F97316', '#EAB308']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, padding: 2 }}>
            <Text style={{ fontSize: 5, color: 'rgba(255,255,255,0.7)', fontWeight: '800' }}>755+808+1064</Text>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 16, height: 4, backgroundColor: '#F5F5F5' }} />
      {/* 3-segment body */}
      <View style={{ width: 58, height: 16, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderBottomWidth: 0, borderColor: '#E5E5E5' }}>
        <LinearGradient colors={['#FAFAFA', '#F5F5F5']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 8 }} /><ES sz={7} />
          </View>
        </LinearGradient>
      </View>
      <View style={{ width: 58, height: 22, overflow: 'hidden', borderWidth: 1.2, borderTopWidth: 0, borderBottomWidth: 0, borderColor: '#D4D4D8' }}>
        <LinearGradient colors={['#EEEEEE', '#E8E8E8']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: '#C0C0C0' }} />
        </LinearGradient>
      </View>
      <View style={{ width: 58, height: 22, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderTopWidth: 0, borderColor: '#E5E5E5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 3 } }) }}>
        <LinearGradient colors={['#F5F5F5', '#ECECEC']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          {[0, 1, 2].map(i => (<View key={i} style={{ width: 38, height: 1.5, backgroundColor: '#D4D4D8', borderRadius: 1, marginBottom: 2 }} />))}
        </LinearGradient>
      </View>
      <HP side="R" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 50, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 30. Titanium Curved ──
export const LaserSticker30: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2100);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 92, height: 114 }}>
      <Animated.View style={{ width: 46, height: 24, backgroundColor: '#1E293B', borderRadius: 5, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#14B8A6', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 40, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#0D9488', '#14B8A6']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#9CA3AF' }} />
      <View style={{ width: 54, height: 62, borderRadius: 18, overflow: 'hidden', borderWidth: 1.2, borderColor: '#A1A1AA', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <LinearGradient colors={['#B0B8C4', '#9CA3AF', '#8A929E', '#9CA3AF']} locations={[0, 0.3, 0.6, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.4)' }} />
          <ES sz={9} />
          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.3)', marginTop: 4, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.35)' }} />
          </View>
          <LinearGradient colors={['#A1A1AA', '#8A929E']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
            <Text style={{ fontSize: 4, fontWeight: '900', color: '#6B7280', letterSpacing: 1.5 }}>TITANIUM</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <HP side="R" clr="#78818E" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 46, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ========== BATCH 3: 31–40 ==========

// ── 31. Midnight Blue Tower ──
export const LaserSticker31: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 88, height: 116 }}>
      <Animated.View style={{ width: 44, height: 22, backgroundColor: '#0F172A', borderRadius: 4, borderWidth: 1.2, borderColor: '#1E293B', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 38, height: 16, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#3B82F6', '#93C5FD']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 12, height: 4, backgroundColor: '#1E3A5F' }} />
      <View style={{ width: 50, height: 66, borderRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderColor: '#2D4A70', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <LinearGradient colors={['#1E3A5F', '#172D4A', '#122040']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 8 }} /><ES sz={8} />
          </View>
          <Animated.View style={{ width: 2, height: 14, backgroundColor: '#3B82F6', borderRadius: 1, marginBottom: 4, opacity: g, ...Platform.select({ ios: { shadowColor: '#3B82F6', shadowOpacity: 0.5, shadowRadius: 3, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
          {[0, 1, 2, 3, 4, 5].map(i => (<View key={i} style={{ width: 30, height: 1, backgroundColor: '#2D4A70', marginBottom: 2 }} />))}
        </LinearGradient>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 42, marginTop: 3 }}><W d /><W d /></View>
    </View>
  </View>);
};

// ── 32. White Split Screen ──
export const LaserSticker32: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 1900);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 96, height: 112 }}>
      <View style={{ flexDirection: 'row', zIndex: 3, transform: [{ rotate: '-3deg' }] }}>
        <Animated.View style={{ width: 24, height: 24, backgroundColor: '#0F172A', borderTopLeftRadius: 4, borderBottomLeftRadius: 4, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View style={{ width: 20, height: 18, borderRadius: 2, overflow: 'hidden', opacity: g }}>
            <LinearGradient colors={['#2563EB', '#60A5FA']} style={{ flex: 1 }} />
          </Animated.View>
        </Animated.View>
        <Animated.View style={{ width: 24, height: 24, backgroundColor: '#0F172A', borderTopRightRadius: 4, borderBottomRightRadius: 4, borderLeftWidth: 1, borderColor: '#334155', justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View style={{ width: 20, height: 18, borderRadius: 2, overflow: 'hidden', opacity: g }}>
            <LinearGradient colors={['#DC2626', '#F87171']} style={{ flex: 1 }} />
          </Animated.View>
        </Animated.View>
      </View>
      <View style={{ width: 16, height: 4, backgroundColor: '#F5F5F5' }} />
      <View style={{ width: 58, height: 56, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E5E5E5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#FAFAFA', '#F3F4F6', '#ECECEC']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 6 }} /><ES sz={8} />
          </View>
          {[0, 1, 2, 3].map(i => (<View key={i} style={{ width: 36, height: 1.5, backgroundColor: '#D4D4D8', borderRadius: 1, marginBottom: 2.5 }} />))}
          <LinearGradient colors={['#E5E7EB', '#D1D5DB']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
            <Text style={{ fontSize: 4, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1 }}>DUAL</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <HP side="L" top={38} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 50, marginTop: 4 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 33. Sand Dune Compact ──
export const LaserSticker33: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 88, height: 108 }}>
      <Animated.View style={{ width: 42, height: 22, backgroundColor: '#292524', borderRadius: 4, borderWidth: 1.2, borderColor: '#44403C', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#0EA5E9', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 36, height: 16, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#0EA5E9', '#38BDF8']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 12, height: 3, backgroundColor: '#D6CFC4' }} />
      <View style={{ width: 52, height: 50, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#D6CFC4', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 3 } }) }}>
        <LinearGradient colors={['#E8E0D4', '#DDD5C8', '#D2CAB8']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.35)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 6 }} /><ES sz={7} />
          </View>
          <View style={{ width: 30, height: 20, backgroundColor: '#D6CFC4', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#B8AFA0' }}>
            <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: '#B8AFA0' }} />
          </View>
        </LinearGradient>
      </View>
      <HP side="R" clr="#B8AFA0" top={34} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 44, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 34. Jet Black Spider Base ──
export const LaserSticker34: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.45, 1, 1700);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 96, height: 116 }}>
      <Animated.View style={{ width: 50, height: 26, backgroundColor: '#0A0A0A', borderRadius: 5, borderWidth: 1.2, borderColor: '#262626', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-5deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#EC4899', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 44, height: 20, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#EC4899', '#F472B6']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#171717' }} />
      <View style={{ width: 54, height: 56, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#262626', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
        <LinearGradient colors={['#141414', '#0D0D0D', '#080808']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2, height: '100%', backgroundColor: 'rgba(255,255,255,0.03)' }} />
          <ES sz={10} />
          <View style={{ marginTop: 4 }}><Ld c="#EAB308" g={g} /></View>
          <View style={{ width: 32, height: 20, backgroundColor: '#171717', borderRadius: 4, marginTop: 4 }}>
            {[0, 1, 2, 3].map(i => (<View key={i} style={{ width: 24, height: 1, backgroundColor: '#262626', marginTop: 3, alignSelf: 'center' }} />))}
          </View>
        </LinearGradient>
      </View>
      <HP side="L" clr="#404040" top={42} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 62, marginTop: 3 }}><W d /><W d /><W d /><W d /></View>
    </View>
  </View>);
};

// ── 35. Frost Grey Slim ──
export const LaserSticker35: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2100);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 82, height: 116 }}>
      <Animated.View style={{ width: 40, height: 20, backgroundColor: '#1E293B', borderRadius: 4, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', zIndex: 3, ...Platform.select({ ios: { shadowColor: '#2563EB', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 34, height: 14, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#2563EB', '#3B82F6']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 10, height: 4, backgroundColor: '#D1D5DB' }} />
      <View style={{ width: 42, height: 70, borderRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderColor: '#D1D5DB', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#F3F4F6', '#E5E7EB', '#D1D5DB', '#E5E7EB']} locations={[0, 0.3, 0.6, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
          <ES sz={8} />
          <View style={{ width: 26, height: 1.5, backgroundColor: '#C7CED6', borderRadius: 1, marginTop: 6, marginBottom: 4 }} />
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (<View key={i} style={{ width: 26, height: 1, backgroundColor: '#D1D5DB', marginBottom: 2 }} />))}
          <LinearGradient colors={['#D1D5DB', '#C0C4CC']} style={{ borderRadius: 3, paddingHorizontal: 6, paddingVertical: 2, marginTop: 4 }}>
            <Text style={{ fontSize: 4, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 }}>FROST</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 34, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 36. Cherry Red Accent ──
export const LaserSticker36: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 1800);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 92, height: 112 }}>
      <Animated.View style={{ width: 48, height: 24, backgroundColor: '#0F172A', borderRadius: 4, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#DC2626', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 42, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#DC2626', '#EF4444']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 14, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#F5F5F5' }} />
      <View style={{ width: 56, height: 58, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E5E5E5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#FAFAFA', '#F3F4F6', '#ECECEC']} style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ width: 56, height: 3, backgroundColor: '#DC2626', borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
          <View style={{ position: 'absolute', left: 0, top: 3, width: 3, height: '85%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <View style={{ flexDirection: 'row', marginTop: 6, marginBottom: 4, alignItems: 'center' }}>
            <ES sz={9} /><View style={{ width: 8 }} /><Ld c="#EAB308" g={g} />
          </View>
          {[0, 1, 2, 3].map(i => (<View key={i} style={{ width: 34, height: 1.5, backgroundColor: '#D4D4D8', borderRadius: 1, marginBottom: 2.5 }} />))}
          <LinearGradient colors={['#FEE2E2', '#FECACA']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
            <Text style={{ fontSize: 4, fontWeight: '800', color: '#DC2626', letterSpacing: 1 }}>CHERRY</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <HP side="R" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 48, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 37. White Triple Wheel ──
export const LaserSticker37: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 90, height: 112 }}>
      <Animated.View style={{ width: 46, height: 24, backgroundColor: '#0F172A', borderRadius: 5, borderWidth: 1.2, borderColor: '#1E293B', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#0891B2', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 40, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#0891B2', '#22D3EE']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#F5F5F5' }} />
      <View style={{ width: 54, height: 54, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E5E5E5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#FAFAFA', '#F3F4F6', '#ECECEC']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.6)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
            <ES sz={8} /><View style={{ width: 6 }} /><Ld c="#22C55E" g={g} />
          </View>
          <View style={{ width: 32, height: 22, backgroundColor: '#E5E7EB', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' }}>
            <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#D1D5DB' }} />
          </View>
        </LinearGradient>
      </View>
      <HP side="R" top={38} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 54, marginTop: 4 }}><W /><W /><W /></View>
    </View>
  </View>);
};

// ── 38. Olive Green Machine ──
export const LaserSticker38: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2100);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 92, height: 114 }}>
      <Animated.View style={{ width: 46, height: 22, backgroundColor: '#1C1917', borderRadius: 4, borderWidth: 1.2, borderColor: '#292524', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#22C55E', shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 40, height: 16, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#22C55E', '#4ADE80']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#4B5F3D' }} />
      <View style={{ width: 54, height: 60, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#4B5F3D', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#5A7049', '#4B5F3D', '#3B4A2D']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 8 }} /><ES sz={8} />
          </View>
          <View style={{ width: 30, height: 26, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 5 }}>
            {[0, 1, 2, 3, 4].map(i => (<View key={i} style={{ width: 22, height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 3, alignSelf: 'center' }} />))}
          </View>
        </LinearGradient>
      </View>
      <HP side="L" clr="#6B8050" top={40} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 46, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 39. White Clinical Plus ──
export const LaserSticker39: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 1900);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 96, height: 114 }}>
      <Animated.View style={{ width: 50, height: 26, backgroundColor: '#0F172A', borderRadius: 5, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#0EA5E9', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 44, height: 20, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#0EA5E9', '#38BDF8']} style={{ flex: 1, padding: 3, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
              <View style={{ width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
            </View>
            <View style={{ width: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 16, height: 4, backgroundColor: '#F5F5F5' }} />
      <View style={{ width: 60, height: 58, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E5E7EB', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#FAFAFA', '#F5F5F5', '#ECECEC']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.7)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
            <Ld c="#EAB308" g={g} /><View style={{ width: 4 }} /><ES sz={10} /><View style={{ width: 4 }} />
            <View style={{ width: 4, height: 10, backgroundColor: '#6B7280', borderRadius: 1, transform: [{ rotate: '15deg' }] }} />
          </View>
          <View style={{ width: 38, height: 26, backgroundColor: '#E5E7EB', borderRadius: 5, borderWidth: 1, borderColor: '#D1D5DB' }}>
            {[0, 1, 2, 3, 4].map(i => (<View key={i} style={{ width: 30, height: 1, backgroundColor: '#D1D5DB', marginTop: 3, alignSelf: 'center' }} />))}
          </View>
        </LinearGradient>
      </View>
      <HP side="R" top={42} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 52, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ── 40. Gold Seal Edition ──
export const LaserSticker40: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120; const g = usePulse(0.5, 1, 2000);
  return (<View style={[x.c, { transform: [{ scale: s }] }]}>
    <View style={{ alignItems: 'center', width: 94, height: 114 }}>
      <Animated.View style={{ width: 48, height: 24, backgroundColor: '#292524', borderRadius: 5, borderWidth: 1.2, borderColor: '#44403C', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#F59E0B', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
        <Animated.View style={{ width: 42, height: 18, borderRadius: 3, overflow: 'hidden', opacity: g }}>
          <LinearGradient colors={['#D97706', '#F59E0B']} style={{ flex: 1, padding: 2 }}>
            <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>
      <View style={{ width: 14, height: 4, backgroundColor: '#F5F0E8' }} />
      <View style={{ width: 56, height: 60, borderRadius: 12, overflow: 'hidden', borderWidth: 1.5, borderColor: '#E5DDD0', ...Platform.select({ ios: { shadowColor: '#D97706', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 4 } }) }}>
        <LinearGradient colors={['#FDF6EE', '#F5EDDF', '#EDE5D5']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
          <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
          <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
            <Ld c="#D97706" g={g} /><View style={{ width: 8 }} /><ES sz={8} />
          </View>
          <View style={{ width: 30, height: 22, backgroundColor: '#F0E6D8', borderRadius: 5, borderWidth: 1, borderColor: '#D4C8B5' }}>
            {[0, 1, 2, 3].map(i => (<View key={i} style={{ width: 22, height: 1, backgroundColor: '#D4C8B5', marginTop: 3, alignSelf: 'center' }} />))}
          </View>
          <LinearGradient colors={['#F5E6C8', '#EDD5A5']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
            <Text style={{ fontSize: 4, fontWeight: '900', color: '#B8960A', letterSpacing: 1.5 }}>GOLD</Text>
          </LinearGradient>
        </LinearGradient>
      </View>
      <HP side="R" clr="#C0A060" top={42} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 48, marginTop: 3 }}><W /><W /></View>
    </View>
  </View>);
};

// ========== Registry ==========
export const LASER_STICKER_DESIGNS_EXTENDED = [
  { id: 'laser_11', label: 'Ivory Tower', tags: [...LASER_TAGS, 'ivory', 'white', 'tower', 'classic'], Component: LaserSticker11 },
  { id: 'laser_12', label: 'Carbon Black', tags: [...LASER_TAGS, 'carbon', 'black', 'dark', 'red'], Component: LaserSticker12 },
  { id: 'laser_13', label: 'Pearl White Wide', tags: [...LASER_TAGS, 'pearl', 'white', 'wide', 'large'], Component: LaserSticker13 },
  { id: 'laser_14', label: 'Gunmetal Pro', tags: [...LASER_TAGS, 'gunmetal', 'grey', 'pro', 'metal'], Component: LaserSticker14 },
  { id: 'laser_15', label: 'Diode Tower', tags: [...LASER_TAGS, 'diode', 'tower', 'tall', 'slim'], Component: LaserSticker15 },
  { id: 'laser_16', label: 'Rose Gold Compact', tags: [...LASER_TAGS, 'rose', 'gold', 'compact', 'pink'], Component: LaserSticker16 },
  { id: 'laser_17', label: 'Arctic White Tall', tags: [...LASER_TAGS, 'arctic', 'white', 'tall', 'clean'], Component: LaserSticker17 },
  { id: 'laser_18', label: 'Charcoal Split', tags: [...LASER_TAGS, 'charcoal', 'split', 'two-tone', 'dark'], Component: LaserSticker18 },
  { id: 'laser_19', label: 'Sapphire Blue', tags: [...LASER_TAGS, 'sapphire', 'blue', 'navy', 'premium'], Component: LaserSticker19 },
  { id: 'laser_20', label: 'Cream Clinical', tags: [...LASER_TAGS, 'cream', 'clinical', 'beige', 'vent'], Component: LaserSticker20 },
  { id: 'laser_21', label: 'Onyx Dual Panel', tags: [...LASER_TAGS, 'onyx', 'dual', 'panel', 'led'], Component: LaserSticker21 },
  { id: 'laser_22', label: 'Platinum Series', tags: [...LASER_TAGS, 'platinum', 'silver', 'metallic', 'series'], Component: LaserSticker22 },
  { id: 'laser_23', label: 'IPL Wide Screen', tags: [...LASER_TAGS, 'ipl', 'wide', 'screen', 'flash'], Component: LaserSticker23 },
  { id: 'laser_24', label: 'Stealth Dark', tags: [...LASER_TAGS, 'stealth', 'dark', 'green', 'accent'], Component: LaserSticker24 },
  { id: 'laser_25', label: 'Snow White Mini', tags: [...LASER_TAGS, 'snow', 'white', 'mini', 'portable'], Component: LaserSticker25 },
  { id: 'laser_26', label: 'Obsidian Tall', tags: [...LASER_TAGS, 'obsidian', 'black', 'tall', 'purple'], Component: LaserSticker26 },
  { id: 'laser_27', label: 'Beige Medical', tags: [...LASER_TAGS, 'beige', 'medical', 'cream', 'warm'], Component: LaserSticker27 },
  { id: 'laser_28', label: 'Graphite Wide', tags: [...LASER_TAGS, 'graphite', 'wide', 'grey', 'large'], Component: LaserSticker28 },
  { id: 'laser_29', label: 'White Trio Panel', tags: [...LASER_TAGS, 'trio', 'white', 'panel', '755', '808', '1064'], Component: LaserSticker29 },
  { id: 'laser_30', label: 'Titanium Curved', tags: [...LASER_TAGS, 'titanium', 'curved', 'silver', 'round'], Component: LaserSticker30 },
  { id: 'laser_31', label: 'Midnight Blue', tags: [...LASER_TAGS, 'midnight', 'blue', 'tower', 'navy'], Component: LaserSticker31 },
  { id: 'laser_32', label: 'White Split Screen', tags: [...LASER_TAGS, 'split', 'dual', 'screen', 'white'], Component: LaserSticker32 },
  { id: 'laser_33', label: 'Sand Dune', tags: [...LASER_TAGS, 'sand', 'dune', 'beige', 'compact'], Component: LaserSticker33 },
  { id: 'laser_34', label: 'Jet Black Spider', tags: [...LASER_TAGS, 'jet', 'black', 'spider', 'base'], Component: LaserSticker34 },
  { id: 'laser_35', label: 'Frost Grey Slim', tags: [...LASER_TAGS, 'frost', 'grey', 'slim', 'narrow'], Component: LaserSticker35 },
  { id: 'laser_36', label: 'Cherry Red Accent', tags: [...LASER_TAGS, 'cherry', 'red', 'accent', 'white'], Component: LaserSticker36 },
  { id: 'laser_37', label: 'White Triple Wheel', tags: [...LASER_TAGS, 'triple', 'wheel', 'white', 'caster'], Component: LaserSticker37 },
  { id: 'laser_38', label: 'Olive Green', tags: [...LASER_TAGS, 'olive', 'green', 'military', 'dark'], Component: LaserSticker38 },
  { id: 'laser_39', label: 'White Clinical Plus', tags: [...LASER_TAGS, 'clinical', 'plus', 'white', 'premium'], Component: LaserSticker39 },
  { id: 'laser_40', label: 'Gold Seal Edition', tags: [...LASER_TAGS, 'gold', 'seal', 'edition', 'luxury'], Component: LaserSticker40 },
];

const x = StyleSheet.create({ c: { alignItems: 'center', justifyContent: 'center' } });
