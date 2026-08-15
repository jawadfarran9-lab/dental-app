import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export type VoiceStop = { uri: string; durationMs: number; waveform: number[] } | null;

const LIVE_WINDOW = 32;

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
  const [levels, setLevels] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  const start = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') return false;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync({ ...Audio.RecordingOptionsPresets.HIGH_QUALITY, isMeteringEnabled: true });
      rec.setProgressUpdateInterval(90);
      rec.setOnRecordingStatusUpdate((st) => {
        if (st.isRecording) {
          setDurationMs(st.durationMillis ?? 0);
          if (typeof st.metering === 'number') {
            meterRef.current.push(st.metering);
            const d = Math.max(-60, Math.min(0, st.metering));
            const n = (d + 60) / 60;
            setLevels((prev) => {
              const next = prev.length >= LIVE_WINDOW ? prev.slice(prev.length - (LIVE_WINDOW - 1)) : prev.slice();
              next.push(n);
              return next;
            });
          }
        }
      });
      meterRef.current = [];
      setLevels([]);
      await rec.startAsync();
      recRef.current = rec;
      setDurationMs(0);
      setIsRecording(true);
      setIsPaused(false);
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
    setIsPaused(false);
    setLevels([]);
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

  const pause = useCallback(async (): Promise<boolean> => {
    const rec = recRef.current;
    if (!rec) return false;
    try {
      await rec.pauseAsync();
      setIsPaused(true);
      return true;
    } catch (e) {
      // Android API < 24 rejects pauseAsync; keep recording, report unsupported.
      console.warn('[voice] pause unsupported/failed', e);
      return false;
    }
  }, []);

  const resume = useCallback(async (): Promise<boolean> => {
    const rec = recRef.current;
    if (!rec) return false;
    try {
      await rec.startAsync(); // resumes a prepared/paused recorder
      setIsPaused(false);
      return true;
    } catch (e) {
      console.warn('[voice] resume failed', e);
      return false;
    }
  }, []);

  const cancel = useCallback(async (): Promise<void> => {
    const rec = recRef.current;
    recRef.current = null;
    meterRef.current = [];
    setIsRecording(false);
    setDurationMs(0);
    setLevels([]);
    setIsPaused(false);
    if (rec) {
      try { await rec.stopAndUnloadAsync(); } catch {}
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); } catch {}
    }
  }, []);

  return { isRecording, isPaused, durationMs, levels, start, stop, pause, resume, cancel };
}
