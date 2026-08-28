import React, { useMemo } from 'react';
import type { ViewStyle } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Reanimated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';

const THRESHOLD = 120;
const VELOCITY = 800;

export function DismissViewerPage({
  children,
  onDismiss,
  disabled,
}: {
  children: React.ReactNode;
  onDismiss: () => void;
  disabled: boolean;
}) {
  const dragY = useSharedValue(0);
  const progress = useSharedValue(0);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!disabled)
        .activeOffsetY([12, 10000])   // only a clearly downward vertical drag activates
        .failOffsetX([-24, 24])       // horizontal drift hands the touch to the pager
        .maxPointers(1)
        .onChange((e) => {
          const dy = Math.max(0, e.translationY);
          dragY.value = dy;
          progress.value = Math.min(1, dy / 300);
        })
        .onEnd((e) => {
          if (dragY.value > THRESHOLD || e.velocityY > VELOCITY) {
            dragY.value = withTiming(700, { duration: 200 });
            progress.value = withTiming(1, { duration: 200 });
            runOnJS(onDismiss)();
          } else {
            dragY.value = withTiming(0, { duration: 160 });
            progress.value = withTiming(0, { duration: 160 });
          }
        }),
    [disabled, onDismiss]
  );

  const style = useAnimatedStyle((): ViewStyle => ({
    flex: 1,
    transform: [{ translateY: dragY.value }, { scale: 1 - progress.value * 0.06 }],
    opacity: 1 - progress.value * 0.5,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Reanimated.View style={style}>{children}</Reanimated.View>
    </GestureDetector>
  );
}
