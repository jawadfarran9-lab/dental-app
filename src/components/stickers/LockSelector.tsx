import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Props {
  visible: boolean;
  isLocked: boolean;
  onToggle: (locked: boolean) => void;
  position: { x: number; y: number };
}

/** Tiny contextual lock/unlock selector that appears near the sticker on long-press. */
export default function LockSelector({ visible, isLocked, onToggle, position }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 280,
          friction: 18,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.85);
    }
  }, [visible, opacity, scale]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: position.x + 60 },
            { translateY: position.y - 30 },
            { scale },
          ],
          opacity,
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        <TouchableOpacity
          style={[styles.option, !isLocked && styles.optionActive]}
          onPress={() => onToggle(false)}
          activeOpacity={0.7}
        >
          <Ionicons name="lock-open-outline" size={18} color={!isLocked ? '#fff' : '#999'} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity
          style={[styles.option, isLocked && styles.optionActive]}
          onPress={() => onToggle(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="lock-closed" size={18} color={isLocked ? '#fff' : '#999'} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 300,
  },
  pill: {
    flexDirection: 'column',
    backgroundColor: 'rgba(30,30,30,0.92)',
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  option: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  divider: {
    width: 22,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginVertical: 2,
  },
});
