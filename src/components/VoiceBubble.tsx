import React, { useEffect, useRef, useState } from 'react';
import { GestureResponderEvent, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const DEFAULT_BARS = Array.from({ length: 40 }, () => 0.35);
const RATE_LABEL: Record<number, string> = { 1: '1×', 1.5: '1.5×', 2: '2×' };
const GAP = 1.5;

export default function VoiceBubble({ audioUrl, durationMs, waveform, sent }: { audioUrl: string; durationMs: number; waveform?: number[]; sent: boolean }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const seekingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const lastSeekRef = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [posMs, setPosMs] = useState(0);
  const [rate, setRate] = useState(1);
  const [barsW, setBarsW] = useState(0);
  const [loadedDurMs, setLoadedDurMs] = useState(0);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => {}); soundRef.current = null; };
  }, []);

  const onStatus = (st: any) => {
    if (!st?.isLoaded) return;
    if (typeof st.durationMillis === 'number' && st.durationMillis > 0) setLoadedDurMs(st.durationMillis);
    if (!seekingRef.current) {
      setPosMs(st.positionMillis ?? 0);
      setPlaying(!!st.isPlaying);
    }
    if (st.didJustFinish) {
      seekingRef.current = false;
      setPlaying(false);
      setPosMs(0);
      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  };

  const total = loadedDurMs > 0 ? loadedDurMs : (durationMs > 0 ? durationMs : (posMs || 1));

  const ensureSound = async () => {
    if (soundRef.current) return soundRef.current;
    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUrl },
      { shouldPlay: false, rate, shouldCorrectPitch: true, positionMillis: posMs, progressUpdateIntervalMillis: 60 },
      onStatus,
    );
    soundRef.current = sound;
    return sound;
  };

  const toggle = async () => {
    try {
      const s = await ensureSound();
      const st = await s.getStatusAsync();
      if (st.isLoaded && st.isPlaying) { await s.pauseAsync(); setPlaying(false); }
      else { await s.playAsync(); setPlaying(true); }
    } catch (e) {
      console.error('[voice] play', e);
    }
  };

  const cycleRate = async () => {
    Haptics.selectionAsync().catch(() => {});
    const next = rate === 1 ? 1.5 : rate === 1.5 ? 2 : 1;
    setRate(next);
    if (soundRef.current) {
      try { await soundRef.current.setRateAsync(next, true); } catch {}
    }
  };

  const fracAt = (e: GestureResponderEvent) => Math.max(0, Math.min(1, e.nativeEvent.locationX / (barsW || 1)));

  const seekBegin = (e: GestureResponderEvent) => {
    seekingRef.current = true;
    wasPlayingRef.current = playing;
    setPosMs(fracAt(e) * total);
  };
  const seekMove = (e: GestureResponderEvent) => {
    const target = fracAt(e) * total;
    setPosMs(target);
    const now = Date.now();
    if (soundRef.current && now - lastSeekRef.current > 90) {
      lastSeekRef.current = now;
      soundRef.current.setPositionAsync(target).catch(() => {});
    }
  };
  const seekEnd = async (e: GestureResponderEvent) => {
    const target = fracAt(e) * total;
    setPosMs(target);
    try {
      const s = await ensureSound();
      await s.setPositionAsync(target);
      if (wasPlayingRef.current) { await s.playAsync(); setPlaying(true); }
    } catch {}
    seekingRef.current = false;
  };

  const fg = sent ? '#FFFFFF' : '#1E6FD9';
  const track = sent ? 'rgba(255,255,255,0.4)' : 'rgba(30,111,217,0.25)';
  const labelColor = sent ? 'rgba(255,255,255,0.9)' : '#1E6FD9';
  const label = playing || posMs > 0 ? fmt(Math.max(0, total - posMs)) : fmt(durationMs);
  const pillBg = sent ? 'rgba(255,255,255,0.22)' : 'rgba(30,111,217,0.12)';

  const bars = waveform && waveform.length > 0 ? waveform : DEFAULT_BARS;
  const barW = barsW > 0 ? Math.max(1.5, (barsW - GAP * (bars.length - 1)) / bars.length) : 2.5;
  const frac = Math.max(0, Math.min(1, posMs / total));
  const playedIdx = Math.floor(frac * bars.length);
  const knobLeft = Math.max(0, Math.min(barsW - 11, frac * barsW - 5.5));

  return (
    <View style={{ width: 236 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Pressable onPress={cycleRate} hitSlop={6} style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 11, backgroundColor: pillBg, marginRight: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: fg }}>{RATE_LABEL[rate] ?? '1×'}</Text>
        </Pressable>
        <Pressable onPress={toggle} hitSlop={8} style={{ marginRight: 10 }}>
          <Ionicons name={playing ? 'pause' : 'play'} size={26} color={fg} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View
            onLayout={(e) => setBarsW(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => true}
            onMoveShouldSetResponder={() => true}
            onResponderGrant={seekBegin}
            onResponderMove={seekMove}
            onResponderRelease={seekEnd}
            onResponderTerminate={() => { seekingRef.current = false; }}
            style={{ height: 24, justifyContent: 'center' }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {bars.map((v, i) => (
                <View
                  key={i}
                  style={{ width: barW, marginRight: i === bars.length - 1 ? 0 : GAP, borderRadius: 1, height: Math.max(3, Math.round((v ?? 0) * 20)), backgroundColor: i <= playedIdx ? fg : track }}
                />
              ))}
            </View>
            {(playing || posMs > 0) && barsW > 0 ? (
              <View pointerEvents="none" style={{ position: 'absolute', left: knobLeft, top: 6, width: 11, height: 11, borderRadius: 6, backgroundColor: fg }} />
            ) : null}
          </View>
          <Text style={{ marginTop: 3, fontSize: 11, fontWeight: '600', color: labelColor, fontVariant: ['tabular-nums'] }}>{label}</Text>
        </View>
      </View>
    </View>
  );
}
