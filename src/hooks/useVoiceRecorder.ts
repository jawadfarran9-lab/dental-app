import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export type VoiceStop = { uri: string; durationMs: number; waveform: number[] } | null;

function buildWaveform(raw: number[], bars = 40): number[] {
  if (raw.length === 0) return [];
  const norm = raw.map((db) => {
    const d = Math.max(-60, Math.min(0, db));
    return (d + 60) / 60;
  });
  const out: number[] = [];
  const bucket = norm.length / bars;
  for (let i = 0; i < bars; i++) {
    const s = Math.floor(i * bucket);
    const e = Math.max(s + 1, Math.floor((i + 1) * bucket));
    let m = 0;
    for (let j = s; j < e && j < norm.length; j++) m = Math.max(m, norm[j]);
    out.push(Math.round(m * 100) / 100);
  }
  return out;
}

export function useVoiceRecorder() {
  const recRef = useRef<Audio.Recording | null>(null);
  const meterRef = useRef<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);

  const start = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') return false;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({ ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true });
      rec.setProgressUpdateInterval(100);
      rec.setOnRecordingStatusUpdate((st) => {
        if (st.isRecording) {
          setDurationMs(st.durationMillis ?? 0);
          if (typeof st.metering === 'number') meterRef.current.push(st.metering);
        }
      });
      meterRef.current = [];
      await rec.startAsync();
      recRef.current = rec;
      setDurationMs(0);
      setIsRecording(true);
      return true;
    } catch (e) {
      console.error('[voice] start error', e);
      return false;
    }
  }, []);

  const stop = useCallback(async (): Promise<VoiceStop> => {
    const rec = recRef.current;
    recRef.current = null;
    setIsRecording(false);
    if (!rec) return null;
    try {
      const st = await rec.getStatusAsync();
      const dur = st.durationMillis ?? durationMs;
      await rec.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = rec.getURI();
      const waveform = buildWaveform(meterRef.current);
      meterRef.current = [];
      return uri ? { uri, durationMs: dur, waveform } : null;
    } catch (e) {
      console.error('[voice] stop error', e);
      meterRef.current = [];
      return null;
    }
  }, [durationMs]);

  const cancel = useCallback(async (): Promise<void> => {
    const rec = recRef.current;
    recRef.current = null;
    meterRef.current = [];
    setIsRecording(false);
    setDurationMs(0);
    if (rec) {
      try { await rec.stopAndUnloadAsync(); } catch {}
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); } catch {}
    }
  }, []);

  return { isRecording, durationMs, start, stop, cancel };
}
