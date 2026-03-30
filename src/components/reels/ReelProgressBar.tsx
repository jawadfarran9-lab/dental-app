import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    PanResponder,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ---- helpers ----
function formatTime(s: number): string {
  const sec = Math.max(0, Math.round(s));
  const m = Math.floor(sec / 60);
  const ss = sec % 60;
  return `${m}:${ss < 10 ? '0' : ''}${ss}`;
}

interface ReelProgressBarProps {
  progress: Animated.Value;
  duration: number; // seconds
  style?: ViewStyle;
  onScrubStart?: () => void;
  onScrubMove?: (pct: number) => void;
  onScrubEnd?: (pct: number) => void;
}

const TRACK_H = 2;
const TRACK_H_ACTIVE = 5;
const THUMB_SIZE = 10;
const THUMB_SIZE_ACTIVE = 14;
const HIT_SLOP = 20; // extra touch area above/below bar

const LABEL_W = 90; // estimated time label width for clamping

const ReelProgressBar = ({
  progress,
  duration,
  style,
  onScrubStart,
  onScrubMove,
  onScrubEnd,
}: ReelProgressBarProps) => {
  const barWidth = useRef(0);
  const dragging = useRef(false);
  const lastPct = useRef(0);
  const durationRef = useRef(duration);
  durationRef.current = duration;
  const [isDragging, setIsDragging] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const thumbLeft = useRef(new Animated.Value(0)).current;

  // Time label animation
  const labelOpacity = useRef(new Animated.Value(0)).current;
  const labelScale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (isDragging) {
      Animated.parallel([
        Animated.timing(labelOpacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.spring(labelScale, { toValue: 1, friction: 8, tension: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(labelOpacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(labelScale, { toValue: 0.95, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [isDragging, labelOpacity, labelScale]);

  // Keep thumb in sync with progress when NOT dragging
  const listenerId = useRef<string | null>(null);
  const attachListener = useCallback(() => {
    if (listenerId.current) return;
    listenerId.current = progress.addListener(({ value }) => {
      if (!dragging.current && barWidth.current > 0) {
        thumbLeft.setValue(value * barWidth.current);
      }
    });
  }, [progress, thumbLeft]);

  // Attach on first render
  const didAttach = useRef(false);
  if (!didAttach.current) {
    attachListener();
    didAttach.current = true;
  }

  const clamp = (v: number) => Math.min(1, Math.max(0, v));

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,

      onPanResponderGrant: (e) => {
        dragging.current = true;
        setIsDragging(true);
        const x = e.nativeEvent.locationX;
        const pct = clamp(x / (barWidth.current || 1));
        lastPct.current = pct;
        progress.setValue(pct);
        thumbLeft.setValue(pct * barWidth.current);
        setPreviewTime(pct * durationRef.current);
        onScrubStart?.();
      },

      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX;
        const pct = clamp(x / (barWidth.current || 1));
        lastPct.current = pct;
        progress.setValue(pct);
        thumbLeft.setValue(pct * barWidth.current);
        setPreviewTime(pct * durationRef.current);
        onScrubMove?.(pct);
      },

      onPanResponderRelease: (e) => {
        const x = e.nativeEvent.locationX;
        const pct = clamp(x / (barWidth.current || 1));
        dragging.current = false;
        setIsDragging(false);
        onScrubEnd?.(pct);
      },

      onPanResponderTerminate: () => {
        dragging.current = false;
        setIsDragging(false);
        onScrubEnd?.(lastPct.current);
      },
    }),
  ).current;

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  const trackHeight = isDragging ? TRACK_H_ACTIVE : TRACK_H;
  const currentThumbSize = isDragging ? THUMB_SIZE_ACTIVE : THUMB_SIZE;

  // Clamp label so it stays on-screen
  const labelTranslateX = thumbLeft.interpolate({
    inputRange: [0, LABEL_W / 2, SCREEN_WIDTH - LABEL_W / 2, SCREEN_WIDTH],
    outputRange: [0, 0, SCREEN_WIDTH - LABEL_W, SCREEN_WIDTH - LABEL_W],
    extrapolate: 'clamp',
  });

  return (
    <View
      style={[styles.wrapper, style]}
      onLayout={(e) => {
        barWidth.current = e.nativeEvent.layout.width;
      }}
      onStartShouldSetResponder={() => true}
      onTouchEnd={(e) => e.stopPropagation()}
      {...panResponder.panHandlers}
    >
      {/* Time label */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.timeLabel,
          {
            opacity: labelOpacity,
            transform: [
              { translateX: labelTranslateX },
              { scale: labelScale },
            ],
          },
        ]}
      >
        <Text style={styles.timeLabelText}>
          {formatTime(previewTime)}
          <Text style={styles.timeLabelDim}> / {formatTime(duration)}</Text>
        </Text>
      </Animated.View>

      {/* Track */}
      <View style={[styles.track, { height: trackHeight }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: fillWidth,
              height: trackHeight,
              borderRadius: Math.round(trackHeight / 2),
            },
          ]}
        />
      </View>

      {/* Thumb */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.thumb,
          {
            width: currentThumbSize,
            height: currentThumbSize,
            borderRadius: currentThumbSize / 2,
            transform: [
              { translateX: Animated.subtract(thumbLeft, new Animated.Value(currentThumbSize / 2)) },
              { translateY: -Math.round((currentThumbSize - trackHeight) / 2) },
            ],
            opacity: isDragging ? 1 : 0,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    paddingVertical: HIT_SLOP,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  fill: {
    backgroundColor: '#fff',
  },
  thumb: {
    position: 'absolute',
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  },
  timeLabel: {
    position: 'absolute',
    top: -6,
    left: 0,
    width: LABEL_W,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  timeLabelText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  timeLabelDim: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ReelProgressBar;
