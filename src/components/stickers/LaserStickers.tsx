/**
 * Laser Machine Sticker Designs — Featured Collection (Premium v2)
 *
 * 10 premium laser machine sticker designs with:
 *   • Animated pulsing glow on screens & indicator LEDs
 *   • Tilted heads for personality / character
 *   • Layered shadows, beveled highlights, reflective strips
 *   • 3-D wheels, jointed handpieces, detailed UI mockups
 *
 * Only shown to clinics where clinicType === 'laser'.
 */

import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, View } from 'react-native';

/* ─── shared pulse hook (opacity 0.55 ↔ 1, 2 s loop) ─── */
const usePulse = (min = 0.55, max = 1, duration = 1800) => {
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

export interface LaserStickerProps {
  size?: number;
}

/* ─────────────────────────────────────────────────────────
   Shared sub-components for consistent premium look
   ───────────────────────────────────────────────────────── */

/** 3-D wheel with highlight ring */
const Wheel: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: dark ? '#27272A' : '#3F3F46', borderWidth: 1.5, borderColor: dark ? '#18181B' : '#52525B', justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: dark ? '#3F3F46' : '#71717A' }} />
  </View>
);

/** Emergency-stop button with 3-D bevel */
const EStop: React.FC<{ sz?: number }> = ({ sz = 10 }) => (
  <View style={{ width: sz, height: sz, borderRadius: sz / 2, backgroundColor: '#DC2626', borderWidth: 1.5, borderTopColor: '#F87171', borderLeftColor: '#F87171', borderRightColor: '#991B1B', borderBottomColor: '#991B1B', ...Platform.select({ ios: { shadowColor: '#DC2626', shadowOpacity: 0.45, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }, android: {} }) }} />
);

/** Small indicator LED */
const LED: React.FC<{ color: string; glow: Animated.Value; size?: number }> = ({ color, glow, size: sz = 6 }) => (
  <Animated.View style={{ width: sz, height: sz, borderRadius: sz / 2, backgroundColor: color, opacity: glow, ...Platform.select({ ios: { shadowColor: color, shadowOpacity: 0.7, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
);

// ── 1. White Classic Tower ──
export const LaserSticker1: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = usePulse(0.5, 1, 2000);
  return (
    <View style={[ls.c, { transform: [{ scale: s }] }]}>
      <View style={{ alignItems: 'center', width: 96, height: 114 }}>
        {/* Screen — tilted slightly right */}
        <Animated.View style={{ width: 50, height: 26, backgroundColor: '#0F172A', borderRadius: 5, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }], zIndex: 3, opacity: glow, ...Platform.select({ ios: { shadowColor: '#0EA5E9', shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
          <LinearGradient colors={['#0EA5E9', '#2563EB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 44, height: 20, borderRadius: 3 }}>
            <View style={{ flex: 1, padding: 3, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ width: 10, height: 3, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 1 }} />
                <View style={{ width: 6, height: 3, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 16, height: 3, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 1, marginRight: 3 }} />
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        {/* Neck */}
        <View style={{ width: 16, height: 5, backgroundColor: '#D4D4D8', borderBottomLeftRadius: 2, borderBottomRightRadius: 2 }} />
        {/* Body */}
        <View style={{ width: 58, height: 56, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E5E5E5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
          <LinearGradient colors={['#FFFFFF', '#F5F5F5', '#EBEBEB']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
            {/* Reflective strip */}
            <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.7)' }} />
            {/* Buttons */}
            <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
              <LED color="#EAB308" glow={glow} />
              <View style={{ width: 10 }} />
              <EStop sz={9} />
            </View>
            {/* Ventilation */}
            {[0, 1, 2, 3].map(i => (
              <View key={i} style={{ width: 36 - i * 2, height: 1.5, backgroundColor: '#D4D4D8', borderRadius: 1, marginBottom: 3 }} />
            ))}
            {/* Label badge */}
            <LinearGradient colors={['#E5E7EB', '#D1D5DB']} style={{ position: 'absolute', bottom: 5, borderRadius: 3, paddingHorizontal: 10, paddingVertical: 2 }}>
              <Text style={{ fontSize: 5, fontWeight: '900', color: '#6B7280', letterSpacing: 1.5 }}>LASER</Text>
            </LinearGradient>
          </LinearGradient>
        </View>
        {/* Handpiece — jointed */}
        <View style={{ position: 'absolute', right: 10, top: 40, width: 2.5, height: 18, backgroundColor: '#A1A1AA', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 9, top: 56, width: 4, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF' }} />
        <View style={{ position: 'absolute', right: 8, top: 58, width: 2.5, height: 14, backgroundColor: '#A1A1AA', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 3, top: 70, width: 14, height: 7, backgroundColor: '#9CA3AF', borderRadius: 3.5, borderWidth: 1, borderColor: '#A1A1AA' }} />
        {/* Wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 48, marginTop: 3 }}>
          <Wheel /><Wheel />
        </View>
      </View>
    </View>
  );
};

// ── 2. Black LED Machine ──
export const LaserSticker2: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = usePulse(0.45, 1, 1600);
  return (
    <View style={[ls.c, { transform: [{ scale: s }] }]}>
      <View style={{ alignItems: 'center', width: 98, height: 114 }}>
        {/* Screen — tilted left */}
        <Animated.View style={{ width: 52, height: 28, backgroundColor: '#0A0A0A', borderRadius: 5, borderWidth: 1.2, borderColor: '#27272A', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#06B6D4', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
          <Animated.View style={{ width: 46, height: 22, borderRadius: 3, overflow: 'hidden', opacity: glow }}>
            <LinearGradient colors={['#06B6D4', '#0E7490']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, padding: 3 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', alignSelf: 'center', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255,255,255,0.3)' }} />
              </View>
            </LinearGradient>
          </Animated.View>
          {/* Pink accent strip */}
          <View style={{ position: 'absolute', right: 3, top: 3, width: 2.5, height: 22, borderRadius: 1.2 }}>
            <LinearGradient colors={['#EC4899', '#DB2777']} style={{ flex: 1, borderRadius: 1.2 }} />
          </View>
        </Animated.View>
        {/* Neck */}
        <View style={{ width: 20, height: 4, backgroundColor: '#171717' }} />
        {/* Body */}
        <View style={{ width: 60, height: 54, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#262626', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
          <LinearGradient colors={['#1F1F1F', '#171717', '#111111']} style={{ flex: 1, alignItems: 'center' }}>
            {/* Reflective edge */}
            <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.06)' }} />
            {/* EStop + key */}
            <View style={{ flexDirection: 'row', marginTop: 7, marginBottom: 5, alignItems: 'center' }}>
              <EStop sz={10} />
              <View style={{ width: 8 }} />
              <LED color="#EAB308" glow={glow} size={5} />
            </View>
            {/* LED strips */}
            {[0, 1, 2, 3, 4].map(i => (
              <Animated.View key={i} style={{ width: 38, height: 2.5, borderRadius: 1.2, marginBottom: 2.5, opacity: glow, ...Platform.select({ ios: { shadowColor: '#3B82F6', shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
                <LinearGradient colors={['#3B82F6', '#60A5FA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 1.2 }} />
              </Animated.View>
            ))}
          </LinearGradient>
        </View>
        {/* Handpiece — left */}
        <View style={{ position: 'absolute', left: 10, top: 42, width: 2.5, height: 16, backgroundColor: '#52525B', borderRadius: 1 }} />
        <View style={{ position: 'absolute', left: 9, top: 56, width: 4, height: 4, borderRadius: 2, backgroundColor: '#52525B' }} />
        <View style={{ position: 'absolute', left: 10, top: 58, width: 2.5, height: 12, backgroundColor: '#52525B', borderRadius: 1 }} />
        <View style={{ position: 'absolute', left: 3, top: 68, width: 16, height: 7, backgroundColor: '#3F3F46', borderRadius: 3.5, borderWidth: 1, borderColor: '#52525B' }} />
        {/* Wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 50, marginTop: 3 }}>
          <Wheel dark /><Wheel dark />
        </View>
      </View>
    </View>
  );
};

// ── 3. Dark Grey Premium ──
export const LaserSticker3: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = usePulse(0.5, 1, 2200);
  return (
    <View style={[ls.c, { transform: [{ scale: s }] }]}>
      <View style={{ alignItems: 'center', width: 96, height: 116 }}>
        {/* Large screen — tilted right */}
        <Animated.View style={{ width: 54, height: 30, backgroundColor: '#111827', borderRadius: 5, borderWidth: 1.2, borderColor: '#374151', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '5deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#14B8A6', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
          <Animated.View style={{ width: 48, height: 24, borderRadius: 3, overflow: 'hidden', opacity: glow }}>
            <LinearGradient colors={['#0D9488', '#14B8A6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, padding: 3, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ width: 10, height: 3, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 1 }} />
                <View style={{ width: 14, height: 3, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
              </View>
              <View style={{ flexDirection: 'row' }}>
                {[0, 1, 2].map(i => (<View key={i} style={{ width: 10, height: 7, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 1.5, marginRight: 2 }} />))}
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
        {/* Neck */}
        <View style={{ width: 14, height: 4, backgroundColor: '#4B5563' }} />
        {/* Upper body */}
        <View style={{ width: 54, height: 28, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderBottomWidth: 0, borderColor: '#4B5563' }}>
          <LinearGradient colors={['#4B5563', '#374151']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LED color="#EAB308" glow={glow} />
              <View style={{ width: 10 }} />
              <EStop sz={8} />
            </View>
          </LinearGradient>
        </View>
        {/* Lower body with vents */}
        <View style={{ width: 54, height: 30, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderTopWidth: 0, borderColor: '#4B5563', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
          <LinearGradient colors={['#6B7280', '#4B5563']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View key={i} style={{ width: 40 - i, height: 1.5, backgroundColor: '#374151', borderRadius: 1, marginBottom: 2 }} />
            ))}
          </LinearGradient>
        </View>
        {/* Handpiece — right, jointed */}
        <View style={{ position: 'absolute', right: 12, top: 44, width: 2.5, height: 16, backgroundColor: '#6B7280', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 11, top: 58, width: 4, height: 4, borderRadius: 2, backgroundColor: '#6B7280' }} />
        <View style={{ position: 'absolute', right: 12, top: 60, width: 2.5, height: 14, backgroundColor: '#6B7280', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 6, top: 72, width: 14, height: 7, backgroundColor: '#6B7280', borderRadius: 3.5, borderWidth: 1, borderColor: '#9CA3AF' }} />
        {/* Spider-base wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 62, marginTop: 3 }}>
          <Wheel /><Wheel /><Wheel /><Wheel />
        </View>
      </View>
    </View>
  );
};

// ── 4. White Compact Unit ──
export const LaserSticker4: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = usePulse(0.5, 1, 1900);
  return (
    <View style={[ls.c, { transform: [{ scale: s }] }]}>
      <View style={{ alignItems: 'center', width: 98, height: 110 }}>
        {/* Angled screen — tilted left */}
        <Animated.View style={{ width: 44, height: 24, backgroundColor: '#0F172A', borderRadius: 4, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-6deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#3B82F6', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
          <Animated.View style={{ width: 38, height: 18, borderRadius: 3, overflow: 'hidden', opacity: glow }}>
            <LinearGradient colors={['#2563EB', '#3B82F6']} style={{ flex: 1, padding: 2 }}>
              <View style={{ width: 12, height: 3, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 1, marginBottom: 2 }} />
              <View style={{ width: 18, height: 3, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 1 }} />
            </LinearGradient>
          </Animated.View>
        </Animated.View>
        {/* Neck */}
        <View style={{ width: 14, height: 4, backgroundColor: '#D4D4D8', marginTop: -1 }} />
        {/* Wide body with side panels */}
        <View style={{ flexDirection: 'row', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
          {/* Left vent panel */}
          <View style={{ width: 11, height: 54, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, overflow: 'hidden' }}>
            <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <View key={i} style={{ width: 7, height: 1.2, backgroundColor: '#9CA3AF', borderRadius: 0.6, marginBottom: 3 }} />
              ))}
            </LinearGradient>
          </View>
          {/* Center body */}
          <View style={{ width: 44, height: 54, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E5' }}>
            <LinearGradient colors={['#FFFFFF', '#F5F5F5', '#EEEEEE']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
              <View style={{ position: 'absolute', left: 0, top: 0, width: 2, height: '100%', backgroundColor: 'rgba(255,255,255,0.7)' }} />
              <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
                <EStop sz={8} />
                <View style={{ width: 8 }} />
                <LED color="#22C55E" glow={glow} />
              </View>
              {/* Center dial */}
              <View style={{ width: 28, height: 22, backgroundColor: '#E5E7EB', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB' }}>
                <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#9CA3AF', justifyContent: 'center', alignItems: 'center' }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#9CA3AF' }} />
                </View>
              </View>
              <Text style={{ fontSize: 4.5, fontWeight: '800', color: '#9CA3AF', letterSpacing: 1, marginTop: 4 }}>COMPACT</Text>
            </LinearGradient>
          </View>
          {/* Right vent panel */}
          <View style={{ width: 11, height: 54, borderTopRightRadius: 8, borderBottomRightRadius: 8, overflow: 'hidden' }}>
            <LinearGradient colors={['#F3F4F6', '#E5E7EB']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <View key={i} style={{ width: 7, height: 1.2, backgroundColor: '#9CA3AF', borderRadius: 0.6, marginBottom: 3 }} />
              ))}
            </LinearGradient>
          </View>
        </View>
        {/* Handpiece */}
        <View style={{ position: 'absolute', right: 8, top: 36, width: 2.5, height: 16, backgroundColor: '#9CA3AF', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 7, top: 50, width: 4, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF' }} />
        <View style={{ position: 'absolute', right: 8, top: 52, width: 2.5, height: 12, backgroundColor: '#9CA3AF', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 3, top: 62, width: 12, height: 6, backgroundColor: '#9CA3AF', borderRadius: 3, borderWidth: 1, borderColor: '#A1A1AA' }} />
        {/* Wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 52, marginTop: 3 }}>
          <Wheel /><Wheel />
        </View>
      </View>
    </View>
  );
};

// ── 5. Silver Slim Tower ──
export const LaserSticker5: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = usePulse(0.55, 1, 2100);
  return (
    <View style={[ls.c, { transform: [{ scale: s }] }]}>
      <View style={{ alignItems: 'center', width: 82, height: 116 }}>
        {/* Screen — straight */}
        <Animated.View style={{ width: 40, height: 22, backgroundColor: '#0F172A', borderRadius: 4, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', zIndex: 3, ...Platform.select({ ios: { shadowColor: '#10B981', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
          <Animated.View style={{ width: 34, height: 16, borderRadius: 3, overflow: 'hidden', opacity: glow }}>
            <LinearGradient colors={['#059669', '#10B981']} style={{ flex: 1, padding: 2 }}>
              <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginBottom: 2 }} />
              <View style={{ width: 6, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
            </LinearGradient>
          </Animated.View>
        </Animated.View>
        {/* Neck */}
        <View style={{ width: 12, height: 4, backgroundColor: '#C4C4C4' }} />
        {/* Slim body */}
        <View style={{ width: 46, height: 68, borderRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderColor: '#B0B0B0', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
          <LinearGradient colors={['#E5E7EB', '#D1D5DB', '#C4C6CC', '#D1D5DB']} locations={[0, 0.3, 0.6, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
            {/* Reflective strip */}
            <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.5)' }} />
            {/* EStop */}
            <EStop sz={10} />
            {/* Line */}
            <View style={{ width: 30, height: 1.5, backgroundColor: '#A1A1AA', borderRadius: 1, marginTop: 6, marginBottom: 8 }} />
            {/* Center dial */}
            <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#A1A1AA', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#9CA3AF' }} />
            </View>
            {/* Label */}
            <LinearGradient colors={['#D1D5DB', '#B8BCC4']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 }}>
              <Text style={{ fontSize: 4.5, fontWeight: '900', color: '#6B7280', letterSpacing: 1.5 }}>SLIM</Text>
            </LinearGradient>
          </LinearGradient>
        </View>
        {/* Wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 38, marginTop: 3 }}>
          <Wheel /><Wheel />
        </View>
      </View>
    </View>
  );
};

// ── 6. Two-Tone Professional ──
export const LaserSticker6: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = usePulse(0.5, 1, 1800);
  return (
    <View style={[ls.c, { transform: [{ scale: s }] }]}>
      <View style={{ alignItems: 'center', width: 92, height: 114 }}>
        {/* Screen — tilted right */}
        <Animated.View style={{ width: 46, height: 24, backgroundColor: '#0F172A', borderRadius: 5, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '4deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#8B5CF6', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
          <Animated.View style={{ width: 40, height: 18, borderRadius: 3, overflow: 'hidden', opacity: glow }}>
            <LinearGradient colors={['#7C3AED', '#8B5CF6']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 18, height: 10, borderRadius: 3, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.45)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1 }} />
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
        {/* Neck */}
        <View style={{ width: 14, height: 4, backgroundColor: '#D4D4D8' }} />
        {/* Upper body — white */}
        <View style={{ width: 54, height: 28, borderTopLeftRadius: 10, borderTopRightRadius: 10, overflow: 'hidden', borderWidth: 1.2, borderBottomWidth: 0, borderColor: '#E5E7EB' }}>
          <LinearGradient colors={['#FFFFFF', '#F9FAFB']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.7)' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LED color="#EAB308" glow={glow} />
              <View style={{ width: 10 }} />
              <EStop sz={8} />
            </View>
            <View style={{ width: 32, height: 1.5, backgroundColor: '#D4D4D8', borderRadius: 1, marginTop: 6 }} />
          </LinearGradient>
        </View>
        {/* Lower body — grey */}
        <View style={{ width: 54, height: 34, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderTopWidth: 0, borderColor: '#4B5563', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
          <LinearGradient colors={['#6B7280', '#4B5563']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {[0, 1, 2, 3, 4].map(i => (
              <View key={i} style={{ width: 38 - i, height: 1.5, backgroundColor: '#374151', borderRadius: 1, marginBottom: 2.5 }} />
            ))}
          </LinearGradient>
        </View>
        {/* Handpiece — right, jointed */}
        <View style={{ position: 'absolute', right: 10, top: 38, width: 2.5, height: 18, backgroundColor: '#9CA3AF', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 9, top: 54, width: 4, height: 4, borderRadius: 2, backgroundColor: '#9CA3AF' }} />
        <View style={{ position: 'absolute', right: 10, top: 56, width: 2.5, height: 14, backgroundColor: '#9CA3AF', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 5, top: 68, width: 12, height: 6, backgroundColor: '#9CA3AF', borderRadius: 3, borderWidth: 1, borderColor: '#B0B0B0' }} />
        {/* Wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 46, marginTop: 3 }}>
          <Wheel /><Wheel />
        </View>
      </View>
    </View>
  );
};

// ── 7. Navy Medical Device ──
export const LaserSticker7: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = usePulse(0.5, 1, 2000);
  return (
    <View style={[ls.c, { transform: [{ scale: s }] }]}>
      <View style={{ alignItems: 'center', width: 90, height: 114 }}>
        {/* Screen — tilted left */}
        <Animated.View style={{ width: 46, height: 26, backgroundColor: '#070E1A', borderRadius: 4, borderWidth: 1.2, borderColor: '#1F2937', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#047857', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
          <Animated.View style={{ width: 40, height: 20, borderRadius: 3, overflow: 'hidden', opacity: glow }}>
            <LinearGradient colors={['#064E3B', '#047857']} style={{ flex: 1, padding: 3, justifyContent: 'flex-end' }}>
              {/* Bar-chart UI */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                {[5, 8, 6, 9, 4].map((h, i) => (
                  <View key={i} style={{ width: 4, height: h, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 1, marginRight: 2 }} />
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
        {/* Neck */}
        <View style={{ width: 14, height: 4, backgroundColor: '#1F2937' }} />
        {/* Body */}
        <View style={{ width: 52, height: 58, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#1F2937', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
          <LinearGradient colors={['#1E3A5F', '#1E293B']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
            <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
            {/* 3 LEDs */}
            <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
              <LED color="#22C55E" glow={glow} />
              <View style={{ width: 6 }} />
              <LED color="#EAB308" glow={glow} />
              <View style={{ width: 6 }} />
              <EStop sz={8} />
            </View>
            {/* Front panel */}
            <View style={{ width: 34, height: 26, backgroundColor: '#111827', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' }}>
              <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#334155' }} />
              </View>
            </View>
            <LinearGradient colors={['#1E3A5F', '#162D4A']} style={{ borderRadius: 3, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 }}>
              <Text style={{ fontSize: 4.5, fontWeight: '900', color: '#64748B', letterSpacing: 1 }}>MEDICAL</Text>
            </LinearGradient>
          </LinearGradient>
        </View>
        {/* Handpiece — left, jointed */}
        <View style={{ position: 'absolute', left: 10, top: 40, width: 2.5, height: 16, backgroundColor: '#475569', borderRadius: 1 }} />
        <View style={{ position: 'absolute', left: 9, top: 54, width: 4, height: 4, borderRadius: 2, backgroundColor: '#475569' }} />
        <View style={{ position: 'absolute', left: 10, top: 56, width: 2.5, height: 12, backgroundColor: '#475569', borderRadius: 1 }} />
        <View style={{ position: 'absolute', left: 3, top: 66, width: 14, height: 7, backgroundColor: '#475569', borderRadius: 3.5, borderWidth: 1, borderColor: '#64748B' }} />
        {/* Wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 44, marginTop: 3 }}>
          <Wheel dark /><Wheel dark />
        </View>
      </View>
    </View>
  );
};

// ── 8. White Wide Body ──
export const LaserSticker8: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = usePulse(0.5, 1, 1700);
  return (
    <View style={[ls.c, { transform: [{ scale: s }] }]}>
      <View style={{ alignItems: 'center', width: 100, height: 112 }}>
        {/* Screen — tilted right */}
        <Animated.View style={{ width: 50, height: 24, backgroundColor: '#0F172A', borderRadius: 4, borderWidth: 1.2, borderColor: '#334155', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#F97316', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
          <Animated.View style={{ width: 44, height: 18, borderRadius: 3, overflow: 'hidden', opacity: glow }}>
            <LinearGradient colors={['#DC2626', '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, padding: 2, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 20, height: 8, borderRadius: 4, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 8, height: 2, backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 1 }} />
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>
        {/* Neck */}
        <View style={{ width: 18, height: 4, backgroundColor: '#D4D4D8' }} />
        {/* Wide body */}
        <View style={{ width: 66, height: 56, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#E5E5E5', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) }}>
          <LinearGradient colors={['#FFFFFF', '#F5F5F5', '#ECECEC']} style={{ flex: 1, alignItems: 'center', paddingTop: 8 }}>
            <View style={{ position: 'absolute', left: 0, top: 0, width: 3, height: '100%', backgroundColor: 'rgba(255,255,255,0.7)' }} />
            <View style={{ flexDirection: 'row', marginBottom: 6, alignItems: 'center' }}>
              <LED color="#EAB308" glow={glow} />
              <View style={{ width: 8 }} />
              <EStop sz={10} />
            </View>
            {/* Large vent panel */}
            <View style={{ width: 48, height: 24, backgroundColor: '#E5E7EB', borderRadius: 5, overflow: 'hidden', borderWidth: 1, borderColor: '#D1D5DB' }}>
              {[0, 1, 2, 3, 4].map(i => (
                <View key={i} style={{ width: 40, height: 1.5, backgroundColor: '#CBD5E1', borderRadius: 1, marginTop: 3, alignSelf: 'center' }} />
              ))}
            </View>
          </LinearGradient>
        </View>
        {/* Handpiece — right, jointed */}
        <View style={{ position: 'absolute', right: 8, top: 38, width: 2.5, height: 16, backgroundColor: '#A1A1AA', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 7, top: 52, width: 4, height: 4, borderRadius: 2, backgroundColor: '#A1A1AA' }} />
        <View style={{ position: 'absolute', right: 8, top: 54, width: 2.5, height: 14, backgroundColor: '#A1A1AA', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 3, top: 66, width: 14, height: 7, backgroundColor: '#A1A1AA', borderRadius: 3.5, borderWidth: 1, borderColor: '#B0B0B0' }} />
        {/* Wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 56, marginTop: 4 }}>
          <Wheel /><Wheel />
        </View>
      </View>
    </View>
  );
};

// ── 9. Matte Black Modern ──
export const LaserSticker9: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = usePulse(0.4, 1, 1500);
  return (
    <View style={[ls.c, { transform: [{ scale: s }] }]}>
      <View style={{ alignItems: 'center', width: 88, height: 114 }}>
        {/* Screen — tilted left */}
        <Animated.View style={{ width: 46, height: 24, backgroundColor: '#09090B', borderRadius: 5, borderWidth: 1.2, borderColor: '#27272A', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '-5deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#06B6D4', shadowOpacity: 0.45, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
          <Animated.View style={{ width: 40, height: 18, borderRadius: 3, overflow: 'hidden', opacity: glow }}>
            <LinearGradient colors={['#0891B2', '#06B6D4']} style={{ flex: 1, padding: 3 }}>
              <View style={{ width: 16, height: 2, backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 1, marginBottom: 3 }} />
              <View style={{ width: 10, height: 2, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
            </LinearGradient>
          </Animated.View>
        </Animated.View>
        {/* Neck */}
        <View style={{ width: 14, height: 4, backgroundColor: '#18181B' }} />
        {/* Body */}
        <View style={{ width: 50, height: 62, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#27272A', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 6 } }) }}>
          <LinearGradient colors={['#1C1C1E', '#18181B', '#121214']} style={{ flex: 1, alignItems: 'center' }}>
            {/* Cyan accent line — animated glow */}
            <Animated.View style={{ position: 'absolute', left: 6, top: 5, width: 2.5, height: 52, borderRadius: 1.2, opacity: glow }}>
              <LinearGradient colors={['#06B6D4', '#22D3EE', '#06B6D4']} style={{ flex: 1, borderRadius: 1.2, ...Platform.select({ ios: { shadowColor: '#06B6D4', shadowOpacity: 0.8, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }} />
            </Animated.View>
            {/* Edge line */}
            <View style={{ position: 'absolute', left: 0, top: 0, width: 2, height: '100%', backgroundColor: 'rgba(255,255,255,0.04)' }} />
            {/* EStop */}
            <View style={{ marginTop: 10 }}>
              <EStop sz={10} />
            </View>
            {/* Panel */}
            <View style={{ width: 26, height: 20, backgroundColor: '#27272A', borderRadius: 4, marginTop: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#3F3F46' }}>
              {[0, 1, 2].map(i => (
                <View key={i} style={{ width: 18, height: 1.5, backgroundColor: '#3F3F46', borderRadius: 1, marginBottom: 2 }} />
              ))}
            </View>
          </LinearGradient>
        </View>
        {/* Handpiece — right, jointed */}
        <View style={{ position: 'absolute', right: 10, top: 40, width: 2.5, height: 16, backgroundColor: '#3F3F46', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 9, top: 54, width: 4, height: 4, borderRadius: 2, backgroundColor: '#3F3F46' }} />
        <View style={{ position: 'absolute', right: 10, top: 56, width: 2.5, height: 14, backgroundColor: '#3F3F46', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 5, top: 68, width: 12, height: 6, backgroundColor: '#3F3F46', borderRadius: 3, borderWidth: 1, borderColor: '#52525B' }} />
        {/* Wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 42, marginTop: 3 }}>
          <Wheel dark /><Wheel dark />
        </View>
      </View>
    </View>
  );
};

// ── 10. Compact Portable ──
export const LaserSticker10: React.FC<LaserStickerProps> = ({ size = 120 }) => {
  const s = size / 120;
  const glow = usePulse(0.5, 1, 1900);
  return (
    <View style={[ls.c, { transform: [{ scale: s }] }]}>
      <View style={{ alignItems: 'center', width: 86, height: 108 }}>
        {/* Carry handle */}
        <View style={{ width: 26, height: 7, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderWidth: 2, borderBottomWidth: 0, borderColor: '#A1A1AA', marginBottom: -1 }} />
        {/* Screen — tilted right */}
        <Animated.View style={{ width: 42, height: 22, backgroundColor: '#1C1917', borderRadius: 4, borderWidth: 1.2, borderColor: '#44403C', justifyContent: 'center', alignItems: 'center', transform: [{ rotate: '3deg' }], zIndex: 3, ...Platform.select({ ios: { shadowColor: '#F59E0B', shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } }, android: {} }) }}>
          <Animated.View style={{ width: 36, height: 16, borderRadius: 3, overflow: 'hidden', opacity: glow }}>
            <LinearGradient colors={['#D97706', '#F59E0B']} style={{ flex: 1, padding: 2, justifyContent: 'center' }}>
              <View style={{ width: 12, height: 2, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 1, marginBottom: 2 }} />
              <View style={{ width: 18, height: 2, backgroundColor: 'rgba(255,255,255,0.35)', borderRadius: 1 }} />
            </LinearGradient>
          </Animated.View>
        </Animated.View>
        {/* Neck */}
        <View style={{ width: 12, height: 4, backgroundColor: '#D6D3D1' }} />
        {/* Compact body */}
        <View style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', borderWidth: 1.2, borderColor: '#D6D3D1', ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 4 } }) }}>
          <LinearGradient colors={['#FAFAF9', '#F5F5F4', '#EDEDED']} style={{ flex: 1, alignItems: 'center', paddingTop: 6 }}>
            <View style={{ position: 'absolute', left: 0, top: 0, width: 2.5, height: '100%', backgroundColor: 'rgba(255,255,255,0.7)' }} />
            {/* Buttons */}
            <View style={{ flexDirection: 'row', marginBottom: 4, alignItems: 'center' }}>
              <LED color="#22C55E" glow={glow} size={5} />
              <View style={{ width: 8 }} />
              <EStop sz={7} />
            </View>
            {/* Front dial */}
            <View style={{ width: 28, height: 18, backgroundColor: '#E7E5E4', borderRadius: 4, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#D6D3D1' }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#A8A29E', justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#A8A29E' }} />
              </View>
            </View>
            <Text style={{ fontSize: 4, fontWeight: '900', color: '#A8A29E', letterSpacing: 1, marginTop: 3 }}>PORTABLE</Text>
          </LinearGradient>
        </View>
        {/* Handpiece — right, jointed */}
        <View style={{ position: 'absolute', right: 10, top: 40, width: 2.5, height: 12, backgroundColor: '#A8A29E', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 9, top: 50, width: 4, height: 4, borderRadius: 2, backgroundColor: '#A8A29E' }} />
        <View style={{ position: 'absolute', right: 10, top: 52, width: 2.5, height: 10, backgroundColor: '#A8A29E', borderRadius: 1 }} />
        <View style={{ position: 'absolute', right: 5, top: 60, width: 12, height: 6, backgroundColor: '#A8A29E', borderRadius: 3, borderWidth: 1, borderColor: '#B0ADA8' }} />
        {/* Wheels */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 40, marginTop: 3 }}>
          <Wheel /><Wheel />
        </View>
      </View>
    </View>
  );
};

// ========== Registry ==========
export const LASER_STICKER_DESIGNS = [
  { id: 'laser_1', label: 'White Classic Tower', Component: LaserSticker1 },
  { id: 'laser_2', label: 'Black LED Machine', Component: LaserSticker2 },
  { id: 'laser_3', label: 'Dark Grey Premium', Component: LaserSticker3 },
  { id: 'laser_4', label: 'White Compact Unit', Component: LaserSticker4 },
  { id: 'laser_5', label: 'Silver Slim Tower', Component: LaserSticker5 },
  { id: 'laser_6', label: 'Two-Tone Professional', Component: LaserSticker6 },
  { id: 'laser_7', label: 'Navy Medical Device', Component: LaserSticker7 },
  { id: 'laser_8', label: 'White Wide Body', Component: LaserSticker8 },
  { id: 'laser_9', label: 'Matte Black Modern', Component: LaserSticker9 },
  { id: 'laser_10', label: 'Compact Portable', Component: LaserSticker10 },
] as const;

const ls = StyleSheet.create({
  c: { alignItems: 'center', justifyContent: 'center' },
});
