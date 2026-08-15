import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

const fmt = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export default function VoiceBubble({ audioUrl, durationMs, sent }: { audioUrl: string; durationMs: number; sent: boolean }) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [posMs, setPosMs] = useState(0);

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
          { shouldPlay: true, progressUpdateIntervalMillis: 80 },
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

  const total = durationMs > 0 ? durationMs : (posMs || 1);
  const pct = Math.min(100, (posMs / total) * 100);
  const fg = sent ? '#FFFFFF' : '#1E6FD9';
  const track = sent ? 'rgba(255,255,255,0.35)' : 'rgba(30,111,217,0.22)';
  const labelColor = sent ? 'rgba(255,255,255,0.9)' : '#1E6FD9';
  const label = playing || posMs > 0 ? fmt(Math.max(0, total - posMs)) : fmt(durationMs);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', width: 176 }}>
      <Pressable onPress={toggle} hitSlop={8} style={{ marginRight: 10 }}>
        <Ionicons name={playing ? 'pause' : 'play'} size={26} color={fg} />
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: track }}>
          <View style={{ width: `${pct}%`, height: 3, borderRadius: 2, backgroundColor: fg }} />
        </View>
        <Text style={{ marginTop: 6, fontSize: 11, fontWeight: '600', color: labelColor, fontVariant: ['tabular-nums'] }}>{label}</Text>
      </View>
    </View>
  );
}
