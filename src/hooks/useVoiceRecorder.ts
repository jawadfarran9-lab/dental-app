import { useCallback, useRef, useState } from 'react';
import { Audio } from 'expo-av';

export type VoiceStop = { uri: string; durationMs: number } | null;

export function useVoiceRecorder() {
  const recRef = useRef<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);

  const start = useCallback(async (): Promise<boolean> => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (perm.status !== 'granted') return false;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      rec.setProgressUpdateInterval(100);
      rec.setOnRecordingStatusUpdate((st) => {
        if (st.isRecording) setDurationMs(st.durationMillis ?? 0);
      });
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
      return uri ? { uri, durationMs: dur } : null;
    } catch (e) {
      console.error('[voice] stop error', e);
      return null;
    }
  }, [durationMs]);

  const cancel = useCallback(async (): Promise<void> => {
    const rec = recRef.current;
    recRef.current = null;
    setIsRecording(false);
    setDurationMs(0);
    if (rec) {
      try { await rec.stopAndUnloadAsync(); } catch {}
      try { await Audio.setAudioModeAsync({ allowsRecordingIOS: false }); } catch {}
    }
  }, []);

  return { isRecording, durationMs, start, stop, cancel };
}
