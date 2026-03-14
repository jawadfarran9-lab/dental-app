import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');

/** Sparkle positions — clustered around the card area (bottom ~45 % of screen) */
const SPARKLES = [
  { left: 0.08, top: 0.46, size: 5, color: '#FFFFFF', delay: 0 },
  { left: 0.88, top: 0.50, size: 4, color: '#E6F2FF', delay: 300 },
  { left: 0.22, top: 0.54, size: 6, color: '#E6F2FF', delay: 600 },
  { left: 0.75, top: 0.44, size: 5, color: '#FFFFFF', delay: 150 },
  { left: 0.50, top: 0.42, size: 4, color: '#E6F2FF', delay: 450 },
] as const;

const DURATION = 2400;

type Props = { visible: boolean };

function SparkleOverlay({ visible }: Props) {
  const anims = useRef(SPARKLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!visible) {
      anims.forEach((a) => a.setValue(0));
      return;
    }

    const loops = anims.map((anim, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(SPARKLES[i].delay),
          Animated.timing(anim, { toValue: 1, duration: DURATION, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: DURATION, useNativeDriver: true }),
        ]),
      );
      loop.start();
      return loop;
    });

    return () => loops.forEach((l) => l.stop());
  }, [visible, anims]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {SPARKLES.map((s, i) => {
        const opacity = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0.15, 0.35],
        });
        const translateY = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: s.size,
                height: s.size,
                borderRadius: s.size / 2,
                backgroundColor: s.color,
                left: s.left * SCREEN_W,
                top: s.top * SCREEN_H,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export default React.memo(SparkleOverlay);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 45,
  },
  dot: {
    position: 'absolute',
  },
});
