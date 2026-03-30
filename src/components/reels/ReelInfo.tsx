import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface ReelInfoProps {
  style?: ViewStyle;
  clinicName?: string;
  caption?: string;
  isActive?: boolean;
  onCaptionPress?: () => void;
}

const ReelInfo = ({ style, clinicName, caption, isActive, onCaptionPress }: ReelInfoProps) => {
  const displayCaption = caption ?? 'This is a sample caption for the reel';
  const wordCount = displayCaption.trim().split(/\s+/).length;
  const isLong = wordCount > 5;

  const translateX = useSharedValue(-20);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      const ease = Easing.out(Easing.cubic);
      translateX.value = withTiming(0, { duration: 700, easing: ease });
      translateY.value = withSequence(
        withTiming(-4, { duration: 350, easing: ease }),
        withTiming(0, { duration: 350, easing: ease }),
      );
      opacity.value = withTiming(1, { duration: 500, easing: ease });
      scale.value = withTiming(1, { duration: 700, easing: ease });
      glowOpacity.value = withSequence(
        withTiming(0.2, { duration: 300, easing: ease }),
        withTiming(0, { duration: 400, easing: ease }),
      );
    } else {
      translateX.value = -20;
      translateY.value = 0;
      opacity.value = 0;
      scale.value = 0.96;
      glowOpacity.value = 0;
    }
  }, [isActive]);

  const nameStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ] as const,
      opacity: opacity.value,
      textShadowColor: `rgba(255,255,255,${glowOpacity.value})`,
      textShadowRadius: 6,
      textShadowOffset: { width: 0, height: 0 },
    };
  });

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[nameStyle]}>
        <Text style={styles.clinicName}>{clinicName ?? 'Clinic Name'}</Text>
      </Animated.View>
      <Pressable onPress={onCaptionPress} disabled={!onCaptionPress}>
        <Text
          style={styles.caption}
          numberOfLines={isLong ? 2 : undefined}
          ellipsizeMode={isLong ? 'tail' : undefined}
        >
          {displayCaption}
        </Text>
        {isLong && (
          <Text style={styles.more}>more</Text>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 90,
    paddingBottom: 8,
  },
  clinicName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  caption: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  more: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});

export default ReelInfo;
