import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

interface Props {
  hGuideY: number | null;
  vGuideX: number | null;
}

/** Subtle guide lines shown when a sticker snaps to center / safe zones. */
export default React.memo(function SnapGuides({ hGuideY, vGuideX }: Props) {
  if (hGuideY == null && vGuideX == null) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {vGuideX != null && (
        <View style={[styles.vLine, { left: vGuideX }]} />
      )}
      {hGuideY != null && (
        <View style={[styles.hLine, { top: hGuideY }]} />
      )}
    </View>
  );
});

const GUIDE_COLOR = 'rgba(120, 180, 255, 0.55)';

const styles = StyleSheet.create({
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth * 2,
    backgroundColor: GUIDE_COLOR,
  },
  hLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor: GUIDE_COLOR,
  },
});
