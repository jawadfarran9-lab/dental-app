import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const DEFAULT_BARS = Array.from({ length: 40 }, () => 0.35);
const RATE_LABEL: Record<number, string> = { 1: '1×', 1.5: '1.5×', 2: '2×' };

export default function VoiceBubble({ audioUrl, durationMs, waveform, sent }: { audioUrl: string; durationMs: number; waveform?: number[]; sent: boolean }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [posMs, setPosMs] = useState(0);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    return () => { soundRef.current?.unloadAsync().catch(() => {}); soundRef.current = null; };
  }, []);

  const onStatus = (st: any) => {
    if (!st?.isLoaded) return;
    setPosMs(st.positionMillis ?? 0);
    setPlaying(!!st.isPlaying);
    if (st.didJustFinish) {
      setPlaying(false);
      setPosMs(0);
      soundRef.current?.setPositionAsync(0).catch(() => {});
    }
  };

  const toggle = async () => {
    try {
      if (!soundRef.current) {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true, rate, shouldCorrectPitch: true, progressUpdateIntervalMillis: 60 },
          onStatus,
        );
        soundRef.current = sound;
        setPlaying(true);
        return;
      }
      const st = await soundRef.current.getStatusAsync();
      if (st.isLoaded && st.isPlaying) await soundRef.current.pauseAsync();
      else await soundRef.current.playAsync();
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

  const total = durationMs > 0 ? durationMs : (posMs || 1);
  const fg = sent ? '#FFFFFF' : '#1E6FD9';
  const track = sent ? 'rgba(255,255,255,0.4)' : 'rgba(30,111,217,0.25)';
  const labelColor = sent ? 'rgba(255,255,255,0.9)' : '#1E6FD9';
  const label = playing || posMs > 0 ? fmt(Math.max(0, total - posMs)) : fmt(durationMs);
  const pillBg = sent ? 'rgba(255,255,255,0.22)' : 'rgba(30,111,217,0.12)';

  const bars = waveform && waveform.length > 0 ? waveform : DEFAULT_BARS;
  const playedIdx = Math.floor((posMs / total) * bars.length);

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
          <View style={{ flexDirection: 'row', alignItems: 'center', height: 22 }}>
            {bars.map((v, i) => (
              <View key={i} style={{ width: 2, marginRight: 1.5, borderRadius: 1, height: Math.max(3, Math.round((v ?? 0) * 20)), backgroundColor: i <= playedIdx ? fg : track }} />
            ))}
          </View>
          <Text style={{ marginTop: 3, fontSize: 11, fontWeight: '600', color: labelColor, fontVariant: ['tabular-nums'] }}>{label}</Text>
        </View>
      </View>
    </View>
  );
}
