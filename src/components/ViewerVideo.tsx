import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Reanimated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { ClipPath, Defs, G, Line, Path, Polygon, Rect, Stop, LinearGradient as SvgLinearGradient } from 'react-native-svg';
import { TextsOverlay } from '@/src/components/BubbleTextsOverlay';
import { TextsDoc } from '@/src/services/chatImages';

const WEDGE_W = 44;
const WEDGE_H = 128;
const W_TOP = 6;
const W_BOT = 122;
const W_RANGE = W_BOT - W_TOP; // 116
const WEDGE_POINTS = '8,6 36,6 27,122 17,122';

const fmtMs = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function ViewerVideo({ uri, width, height, isActive, topInset, bottomInset, videoW, videoH, drawing, texts, onScrubbingChange, onZoomChange }: {
  uri: string;
  width: number;
  height: number;
  isActive: boolean;
  topInset: number;
  bottomInset: number;
  videoW?: number;
  videoH?: number;
  drawing?: { vb: [number, number]; strokes: Array<{ color: string; width: number; d: string }> } | null;
  texts?: TextsDoc | null;
  onScrubbingChange?: (b: boolean) => void;
  onZoomChange?: (b: boolean) => void
}) {
  const ref = useRef<Video>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [volOpen, setVolOpen] = useState(false);
  const [ctrlsVisible, setCtrlsVisible] = useState(true);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [natW, setNatW] = useState<number>(videoW ?? 0);
  const [natH, setNatH] = useState<number>(videoH ?? 0);
  const mutedRef = useRef(false);
  const playingRef = useRef(false);
  const seekingRef = useRef(false);
  const scrubbingRef = useRef(false);
  const durRef = useRef(0);
  const posThrottleRef = useRef(0);
  const scrubSeekTs = useRef(0);
  const labelTs = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volSV = useSharedValue(1);
  const startVol = useSharedValue(1);
  const openSV = useSharedValue(0);
  const ctrlsSV = useSharedValue(1);
  const curPosSV = useSharedValue(0);
  const durSV = useSharedValue(0);
  const trackWSV = useSharedValue(0);
  const startPosSV = useSharedValue(0);

  useEffect(() => { mutedRef.current = muted; }, [muted]);
  useEffect(() => { playingRef.current = playing; }, [playing]);
  useEffect(() => { openSV.value = withTiming(volOpen ? 1 : 0, { duration: 180 }); }, [volOpen]);
  useEffect(() => { ctrlsSV.value = withTiming(ctrlsVisible ? 1 : 0, { duration: 180 }); }, [ctrlsVisible]);

  const clearHide = () => { if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; } };
  const scheduleHide = () => { clearHide(); if (playingRef.current) hideTimer.current = setTimeout(() => setCtrlsVisible(false), 3000); };

  useEffect(() => {
    if (ctrlsVisible && playing) scheduleHide();
    else clearHide();
    return clearHide;
  }, [ctrlsVisible, playing]);

  useEffect(() => {
    if (isActive) {
      ref.current?.playAsync().catch(() => {});
    } else {
      ref.current?.pauseAsync().catch(() => {});
    }
  }, [isActive]);

  const togglePlay = () => {
    if (playing) {
      ref.current?.pauseAsync().catch(() => {});
    } else {
      ref.current?.playAsync().catch(() => {});
    }
  };

  const handleSkip = useCallback(async (deltaMs: number) => {
    if (!ref.current || seekingRef.current) return;
    try {
      seekingRef.current = true;
      const st = await ref.current.getStatusAsync();
      if (!st.isLoaded) return;
      const dur = st.durationMillis ?? 0;
      let target = st.positionMillis + deltaMs;
      if (target < 0) target = 0;
      else if (dur > 0 && target > dur) target = dur;
      await ref.current.setPositionAsync(target);
      cancelAnimation(curPosSV);
      curPosSV.value = target;
      setPositionMs(target);
    } catch {
    } finally {
      seekingRef.current = false;
    }
  }, []);

  const bump = () => { setCtrlsVisible(true); scheduleHide(); };

  const onScrubMove = useCallback((ms: number) => {
    const now = Date.now();
    if (now - scrubSeekTs.current >= 33) {
      scrubSeekTs.current = now;
      ref.current?.setPositionAsync(ms).catch(() => {});
    }
    if (now - labelTs.current >= 120) {
      labelTs.current = now;
      setPositionMs(ms);
    }
  }, []);

  const startScrub = useCallback(() => {
    scrubbingRef.current = true;
    cancelAnimation(curPosSV);
    onScrubbingChange?.(true);
  }, [onScrubbingChange]);

  const endScrub = useCallback(() => {
    const ms = curPosSV.value;
    ref.current?.setPositionAsync(ms).catch(() => {});
    setPositionMs(ms);
    scrubbingRef.current = false;
    onScrubbingChange?.(false);
  }, [onScrubbingChange]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      ref.current?.setIsMutedAsync(next).catch(() => {});
      return next;
    });
  };

  const applyVol = useCallback((v: number) => {
    setVolume(v);
    ref.current?.setVolumeAsync(v).catch(() => {});
    if (v > 0 && mutedRef.current) {
      mutedRef.current = false;
      setMuted(false);
      ref.current?.setIsMutedAsync(false).catch(() => {});
    }
  }, []);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetY([-6, 6])
        .failOffsetX([-14, 14])
        .onStart(() => {
          startVol.value = volSV.value;
        })
        .onUpdate((e) => {
          let v = startVol.value - e.translationY / W_RANGE;
          if (v < 0) v = 0;
          else if (v > 1) v = 1;
          volSV.value = v;
          runOnJS(applyVol)(v);
        }),
    [applyVol]
  );

  const scrubPan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-6, 6])
        .failOffsetY([-12, 12])
        .onStart(() => {
          startPosSV.value = curPosSV.value;
          runOnJS(startScrub)();
        })
        .onUpdate((e) => {
          const w = trackWSV.value;
          const total = durSV.value;
          if (w <= 0 || total <= 0) return;
          let ms = startPosSV.value + (e.translationX / w) * total;
          if (ms < 0) ms = 0;
          else if (ms > total) ms = total;
          curPosSV.value = ms;
          runOnJS(onScrubMove)(ms);
        })
        .onFinalize(() => {
          runOnJS(endScrub)();
        }),
    [startScrub, onScrubMove, endScrub]
  );

  const dockAnim = useAnimatedStyle((): ViewStyle => ({
    opacity: openSV.value,
    transform: [
      { translateY: (1 - openSV.value) * -6 },
      { scale: 0.92 + 0.08 * openSV.value },
    ],
  }));

  const ctrlsAnim = useAnimatedStyle((): ViewStyle => ({ opacity: ctrlsSV.value }));

  const fillAnim = useAnimatedStyle((): ViewStyle => ({
    width: durSV.value > 0 ? (curPosSV.value / durSV.value) * trackWSV.value : 0,
  }));
  const handleAnim = useAnimatedStyle((): ViewStyle => ({
    transform: [{ translateX: durSV.value > 0 ? (curPosSV.value / durSV.value) * trackWSV.value : 0 }],
  }));

  const toggleControls = useCallback(() => setCtrlsVisible((v) => !v), []);
  const reportZoom = useCallback((z: boolean) => { onZoomChange?.(z); }, [onZoomChange]);
  const zScale = useSharedValue(1);
  const zSaved = useSharedValue(1);
  const ztx = useSharedValue(0);
  const zty = useSharedValue(0);
  const zstx = useSharedValue(0);
  const zsty = useSharedValue(0);
  const zfpx = useSharedValue(0);
  const zfpy = useSharedValue(0);
  const zPanOffX = useSharedValue(0);
  const zPanOffY = useSharedValue(0);
  const pinchZoom = useMemo(
    () =>
      Gesture.Pinch()
        .onStart((e) => {
          zstx.value = ztx.value;
          zsty.value = zty.value;
          zSaved.value = zScale.value;
          zfpx.value = e.focalX - width / 2;
          zfpy.value = e.focalY - height / 2;
        })
        .onUpdate((e) => {
          const raw = zSaved.value * e.scale;
          const clamped = raw < 1 ? 1 : raw > 4 ? 4 : raw;
          const ratio = clamped / zSaved.value;
          zScale.value = clamped;
          ztx.value = zfpx.value - (zfpx.value - zstx.value) * ratio;
          zty.value = zfpy.value - (zfpy.value - zsty.value) * ratio;
        })
        .onEnd(() => {
          zSaved.value = zScale.value;
          if (zScale.value <= 1) {
            zScale.value = withTiming(1);
            ztx.value = withTiming(0);
            zty.value = withTiming(0);
            zstx.value = 0;
            zsty.value = 0;
            zSaved.value = 1;
            runOnJS(reportZoom)(false);
          } else {
            const maxX = Math.max(0, (width * zScale.value - width) / 2);
            const maxY = Math.max(0, (height * zScale.value - height) / 2);
            ztx.value = ztx.value < -maxX ? -maxX : ztx.value > maxX ? maxX : ztx.value;
            zty.value = zty.value < -maxY ? -maxY : zty.value > maxY ? maxY : zty.value;
            zstx.value = ztx.value;
            zsty.value = zty.value;
            runOnJS(reportZoom)(true);
          }
        }),
    [reportZoom, width, height]
  );
  const panZoom = useMemo(
    () =>
      Gesture.Pan()
        .manualActivation(true)
        .onTouchesMove((_e, state) => {
          if (zScale.value > 1) state.activate();
          else state.fail();
        })
        .onStart((e) => {
          zstx.value = ztx.value;
          zsty.value = zty.value;
          zPanOffX.value = e.translationX;
          zPanOffY.value = e.translationY;
        })
        .onUpdate((e) => {
          const maxX = Math.max(0, (width * zScale.value - width) / 2);
          const maxY = Math.max(0, (height * zScale.value - height) / 2);
          const nx = zstx.value + (e.translationX - zPanOffX.value);
          const ny = zsty.value + (e.translationY - zPanOffY.value);
          ztx.value = nx < -maxX ? -maxX : nx > maxX ? maxX : nx;
          zty.value = ny < -maxY ? -maxY : ny > maxY ? maxY : ny;
        })
        .onEnd(() => {
          zstx.value = ztx.value;
          zsty.value = zty.value;
        }),
    [width, height]
  );
  const tapControls = useMemo(
    () => Gesture.Tap().onEnd(() => { runOnJS(toggleControls)(); }),
    [toggleControls]
  );
  const composedZoom = useMemo(
    () => Gesture.Race(tapControls, Gesture.Simultaneous(pinchZoom, panZoom)),
    [tapControls, pinchZoom, panZoom]
  );
  const zoomStyle = useAnimatedStyle((): ViewStyle => ({
    transform: [{ translateX: ztx.value }, { translateY: zty.value }, { scale: zScale.value }],
  }));

  const effVol = muted ? 0 : volume;
  const fillTop = W_BOT - W_RANGE * effVol;
  const fillH = W_RANGE * effVol;
  const spkName = muted || volume <= 0 ? 'volume-mute' : volume > 0.6 ? 'volume-high' : volume > 0.25 ? 'volume-medium' : 'volume-low';

  const ridges = [];
  for (let i = 1; i <= 9; i++) {
    const y = W_TOP + (W_RANGE * i) / 10;
    ridges.push(<Line key={`r${i}`} x1={6} x2={38} y1={y} y2={y} stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} />);
  }

  const vw = natW > 0 ? natW : (videoW ?? 0);
  const vh = natH > 0 ? natH : (videoH ?? 0);
  const dAspect = vw && vh ? vw / vh : width / height;
  const dContainerAspect = width / height;
  let baseW = width;
  let baseH = height;
  if (dAspect >= dContainerAspect) { baseW = width; baseH = width / dAspect; }
  else { baseH = height; baseW = height * dAspect; }

  return (
    <View style={{ width, height, position: 'relative' }}>
      <GestureDetector gesture={composedZoom}>
        <Reanimated.View style={[{ width, height }, zoomStyle]}>
          <Video
            ref={ref}
            source={{ uri }}
            style={{ width, height }}
            resizeMode={ResizeMode.CONTAIN}
            isLooping={false}
            useNativeControls={false}
            progressUpdateIntervalMillis={250}
            onLoad={() => { if (isActive) ref.current?.playAsync().catch(() => {}); }}
            onReadyForDisplay={(e) => { setNatW(e.naturalSize.width); setNatH(e.naturalSize.height); }}
            onPlaybackStatusUpdate={(s) => {
              if (!s.isLoaded) return;
              setPlaying(s.isPlaying);
              if (s.didJustFinish) {
                cancelAnimation(curPosSV);
                curPosSV.value = 0;
                setPositionMs(0);
                ref.current?.setPositionAsync(0).catch(() => {});
                return;
              }
              if (!scrubbingRef.current) {
                curPosSV.value = withTiming(s.positionMillis, { duration: 300, easing: Easing.linear });
                const now = Date.now();
                if (now - posThrottleRef.current > 200) {
                  posThrottleRef.current = now;
                  setPositionMs(s.positionMillis);
                }
              }
              if (s.durationMillis && durRef.current === 0) {
                durRef.current = s.durationMillis;
                durSV.value = s.durationMillis;
                setDurationMs(s.durationMillis);
              }
            }}
          />
          {drawing && drawing.strokes.length > 0 ? (
            <Svg
              pointerEvents="none"
              viewBox={`0 0 ${drawing.vb[0]} ${drawing.vb[1]}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ position: 'absolute', width: baseW, height: baseH, left: (width - baseW) / 2, top: (height - baseH) / 2 }}
            >
              {drawing.strokes.map((s, i) => (
                <Path key={`vd_${i}`} d={s.d} stroke={s.color} strokeWidth={s.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ))}
            </Svg>
          ) : null}
          <TextsOverlay items={texts?.items} bW={baseW} bH={baseH} offX={(width - baseW) / 2} offY={(height - baseH) / 2} />
        </Reanimated.View>
      </GestureDetector>

      <Reanimated.View
        pointerEvents={ctrlsVisible ? 'box-none' : 'none'}
        style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, ctrlsAnim]}
      >
        <Pressable onPress={() => { handleSkip(-10000); bump(); }} hitSlop={10} style={styles.skipBtn}>
          <Ionicons name="play-back" size={26} color="#FFFFFF" />
          <Text style={styles.skipLabel}>10</Text>
        </Pressable>
        <Pressable onPress={() => { togglePlay(); bump(); }} style={styles.centerPlay}>
          <Ionicons name={playing ? 'pause' : 'play'} size={playing ? 34 : 40} color="rgba(255,255,255,0.95)" style={playing ? undefined : { marginLeft: 4 }} />
        </Pressable>
        <Pressable onPress={() => { handleSkip(10000); bump(); }} hitSlop={10} style={styles.skipBtn}>
          <Ionicons name="play-forward" size={26} color="#FFFFFF" />
          <Text style={styles.skipLabel}>10</Text>
        </Pressable>
      </Reanimated.View>

      <Pressable onPress={() => setVolOpen((o) => !o)} style={[styles.viewerClose, styles.volBtnTR, { top: topInset + 8 }]} hitSlop={8}>
        <Ionicons name={(muted ? 'volume-mute' : spkName) as any} size={22} color={muted ? '#FF8A80' : '#FFFFFF'} />
      </Pressable>

      <Reanimated.View pointerEvents={volOpen ? 'auto' : 'none'} style={[styles.volDock, { top: topInset + 52 }, dockAnim]}>
        <Text style={styles.volPct}>{Math.round(volume * 100)}%</Text>
        <GestureDetector gesture={pan}>
          <View style={{ marginTop: 5 }}>
            <Svg width={WEDGE_W} height={WEDGE_H}>
              <Defs>
                <SvgLinearGradient id="vgrad" x1="0" y1="1" x2="0" y2="0">
                  <Stop offset="0" stopColor="#1E6FD9" />
                  <Stop offset="0.55" stopColor="#4DA3FF" />
                  <Stop offset="1" stopColor="#8FD0FF" />
                </SvgLinearGradient>
                <ClipPath id="vclip"><Polygon points={WEDGE_POINTS} /></ClipPath>
              </Defs>
              <Polygon points={WEDGE_POINTS} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)" strokeWidth={1.4} strokeLinejoin="round" />
              <G clipPath="url(#vclip)">
                <Rect x={0} y={fillTop} width={WEDGE_W} height={fillH} fill="url(#vgrad)" opacity={muted ? 0.3 : 1} />
                <Rect x={0} y={fillTop - 2} width={WEDGE_W} height={4} fill="#CDEBFF" opacity={muted || effVol <= 0 ? 0 : 0.9} />
                {ridges}
              </G>
            </Svg>
          </View>
        </GestureDetector>
        <Pressable onPress={toggleMute} style={[styles.muteBtn, muted && styles.muteBtnOn]} hitSlop={8}>
          <Ionicons name={muted ? 'volume-mute' : 'volume-high'} size={16} color={muted ? '#FF8A80' : '#FFFFFF'} />
        </Pressable>
      </Reanimated.View>

      <Reanimated.View pointerEvents={ctrlsVisible ? 'box-none' : 'none'} style={[styles.scrubberWrap, { bottom: bottomInset + 8 }, ctrlsAnim]}>
        <Text style={[styles.scrubTime, { marginRight: 8 }]}>{fmtMs(positionMs)}</Text>
        <GestureDetector gesture={scrubPan}>
          <View style={styles.scrubTouch} onLayout={(e) => { trackWSV.value = e.nativeEvent.layout.width; }}>
            <View style={styles.scrubTrack}>
              <Reanimated.View style={[styles.scrubFill, fillAnim]} />
            </View>
            <Reanimated.View style={[styles.scrubHandle, handleAnim]} />
          </View>
        </GestureDetector>
        <Text style={[styles.scrubTime, { marginLeft: 8, textAlign: 'right' }]}>{`-${fmtMs(Math.max(0, durationMs - positionMs))}`}</Text>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volDock: {
    position: 'absolute',
    right: 12,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(16,20,28,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    zIndex: 8,
  },
  volPct: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  muteBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  muteBtnOn: { backgroundColor: 'rgba(239,68,68,0.22)', borderColor: 'rgba(239,68,68,0.6)' },
  volBtnTR: { position: 'absolute', right: 12, zIndex: 9 },
  skipBtn: { alignItems: 'center', justifyContent: 'center', marginHorizontal: 24 },
  skipLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', marginTop: -3 },
  centerPlay: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  scrubberWrap: { position: 'absolute', left: 14, right: 14, flexDirection: 'row', alignItems: 'center', zIndex: 9 },
  scrubTime: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '600', minWidth: 40, fontVariant: ['tabular-nums'] },
  scrubTouch: { flex: 1, height: 20, justifyContent: 'center', position: 'relative' },
  scrubTrack: { height: 3, borderRadius: 1.5, backgroundColor: 'rgba(255,255,255,0.22)', overflow: 'hidden' },
  scrubFill: { position: 'absolute', left: 0, top: 0, height: 3, borderRadius: 1.5, backgroundColor: '#4DA3FF' },
  scrubHandle: { position: 'absolute', width: 11, height: 11, borderRadius: 5.5, backgroundColor: '#FFFFFF', top: 4.5, marginLeft: -5.5 },
});
