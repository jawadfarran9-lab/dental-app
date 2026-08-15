import React from 'react';
import { Image, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { TextsOverlay } from '@/src/components/BubbleTextsOverlay';
import { TextsDoc } from '@/src/services/chatImages';

export function ZoomableImage({ uri, width, height, imgW, imgH, drawing, texts, onZoomChange }: {
  uri: string; width: number; height: number; imgW?: number; imgH?: number;
  drawing?: { vb: [number, number]; strokes: Array<{ color: string; width: number; d: string }> } | null;
  texts?: TextsDoc | null;
  onZoomChange: (zoomed: boolean) => void
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const stx = useSharedValue(0);
  const sty = useSharedValue(0);

  const aspect = imgW && imgH ? imgW / imgH : width / height;
  const containerAspect = width / height;
  let baseW = width;
  let baseH = height;
  if (aspect >= containerAspect) {
    baseW = width;
    baseH = width / aspect;
  } else {
    baseH = height;
    baseW = height * aspect;
  }

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = next < 1 ? 1 : next > 4 ? 4 : next;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        scale.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        stx.value = 0;
        sty.value = 0;
        savedScale.value = 1;
        runOnJS(onZoomChange)(false);
      } else {
        const maxX = Math.max(0, (baseW * scale.value - width) / 2);
        const maxY = Math.max(0, (baseH * scale.value - height) / 2);
        tx.value = tx.value < -maxX ? -maxX : tx.value > maxX ? maxX : tx.value;
        ty.value = ty.value < -maxY ? -maxY : ty.value > maxY ? maxY : ty.value;
        stx.value = tx.value;
        sty.value = ty.value;
        runOnJS(onZoomChange)(true);
      }
    });

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((_e, state) => {
      if (scale.value > 1) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((e) => {
      const maxX = Math.max(0, (baseW * scale.value - width) / 2);
      const maxY = Math.max(0, (baseH * scale.value - height) / 2);
      const nx = stx.value + e.translationX;
      const ny = sty.value + e.translationY;
      tx.value = nx < -maxX ? -maxX : nx > maxX ? maxX : nx;
      ty.value = ny < -maxY ? -maxY : ny > maxY ? maxY : ny;
    })
    .onEnd(() => {
      stx.value = tx.value;
      sty.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        tx.value = withTiming(0);
        ty.value = withTiming(0);
        stx.value = 0;
        sty.value = 0;
        runOnJS(onZoomChange)(false);
      } else {
        scale.value = withTiming(2);
        savedScale.value = 2;
        runOnJS(onZoomChange)(true);
      }
    });

  const composed = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const aStyle = useAnimatedStyle((): ViewStyle => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Reanimated.View style={[{ width, flex: 1, justifyContent: 'center', alignItems: 'center' }, aStyle]}>
        <Image source={{ uri }} resizeMode="contain" style={{ width, height: '100%' }} />
        {drawing && drawing.strokes.length > 0 ? (
          <Svg
            pointerEvents="none"
            viewBox={`0 0 ${drawing.vb[0]} ${drawing.vb[1]}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ position: 'absolute', width: baseW, height: baseH, left: (width - baseW) / 2, top: (height - baseH) / 2 }}
          >
            {drawing.strokes.map((s, i) => (
              <Path key={`d_${i}`} d={s.d} stroke={s.color} strokeWidth={s.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </Svg>
        ) : null}
        <TextsOverlay items={texts?.items} bW={baseW} bH={baseH} offX={(width - baseW) / 2} offY={(height - baseH) / 2} />
      </Reanimated.View>
    </GestureDetector>
  );
}
