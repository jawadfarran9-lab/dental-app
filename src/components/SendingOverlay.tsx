import React, { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import { Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';

const RING_SIZE = 92;
const RING_STROKE = 7;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function SendingOverlay({
  visible,
  progress,
  label,
}: {
  visible: boolean;
  progress: number | null;
  label: string;
}) {
  const determinate = progress != null;
  const progressSV = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (progress != null) {
      const clamped = Math.min(1, Math.max(0, progress));
      progressSV.value = withTiming(clamped, { duration: 250 });
    }
  }, [progress, progressSV]);

  useEffect(() => {
    if (visible && progress == null) {
      spin.value = 0;
      spin.value = withRepeat(withTiming(1, { duration: 1300 }), -1, false);
    } else {
      spin.value = 0;
    }
  }, [visible, progress, spin]);

  const ringProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_C * (1 - (determinate ? progressSV.value : 0.28)),
  }));
  const spinStyle = useAnimatedStyle((): ViewStyle => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  if (!visible) return null;
  const pct = determinate ? Math.round(Math.min(1, Math.max(0, progress as number)) * 100) : null;

  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <BlurView intensity={26} tint="dark" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(6,12,24,0.45)' }} />
      <View style={{ width: 148, paddingVertical: 18, paddingHorizontal: 16, borderRadius: 24, backgroundColor: 'rgba(15,23,42,0.82)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 10 }}>
        <Animated.View style={[{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }, determinate ? null : spinStyle]}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Defs>
              <SvgLinearGradient id="sendGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#3D9EFF" />
                <Stop offset="1" stopColor="#22C55E" />
              </SvgLinearGradient>
            </Defs>
            <G rotation={-90} origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}>
              <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke="rgba(255,255,255,0.10)" strokeWidth={RING_STROKE} fill="none" />
              <AnimatedCircle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R} stroke="url(#sendGrad)" strokeWidth={RING_STROKE} fill="none" strokeLinecap="round" strokeDasharray={RING_C} animatedProps={ringProps} />
            </G>
          </Svg>
          {determinate && pct != null && (
            <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800' }}>{pct}%</Text>
            </View>
          )}
        </Animated.View>
        {label ? (
          <Text style={{ color: 'rgba(255,255,255,0.9)', marginTop: 10, fontSize: 12.5, fontWeight: '600', letterSpacing: 0.3, textAlign: 'center' }}>
            {label}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
