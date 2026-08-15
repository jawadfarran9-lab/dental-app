import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useVoiceRecorder } from '@/src/hooks/useVoiceRecorder';

type RecordingBarProps = {
  attachBtnBg: string;
  textPrimary: string;
  attachBtnStyle: StyleProp<ViewStyle>;
  sendBtnStyle: StyleProp<ViewStyle>;
  sendBtnInnerStyle: StyleProp<ViewStyle>;
  formatDuration: (ms: number) => string;
  sending: boolean;
  onCancel: () => void;
  onSend: (r: { uri: string; durationMs: number; waveform: number[] }) => void;
};

export default function RecordingBar({ attachBtnBg, textPrimary, attachBtnStyle, sendBtnStyle, sendBtnInnerStyle, formatDuration, sending, onCancel, onSend }: RecordingBarProps) {
  const voice = useVoiceRecorder();
  const [recBarsW, setRecBarsW] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await voice.start();
      if (!ok && !cancelled) {
        Alert.alert('Microphone', 'Please allow microphone access to record voice messages.');
        onCancel();
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => { Haptics.selectionAsync().catch(() => {}); voice.cancel(); onCancel(); };
  const handlePause = async () => { await voice.pause(); };
  const handleResume = async () => { await voice.resume(); };
  const handleSend = async () => {
    if (sending) return;
    const r = await voice.stop();
    if (r) onSend(r); else onCancel();
  };

  const barCount = Math.max(1, Math.floor(recBarsW / 4.5));

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable onPress={handleCancel} style={[attachBtnStyle, { backgroundColor: attachBtnBg }]} hitSlop={6}>
          <Ionicons name="trash-outline" size={22} color="#E5484D" />
        </Pressable>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 }}>
          <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: '#E5484D', marginRight: 10 }} />
          <Text style={{ color: textPrimary, fontSize: 16, fontVariant: ['tabular-nums'] }}>{formatDuration(voice.durationMs)}</Text>
          <View onLayout={(e) => setRecBarsW(e.nativeEvent.layout.width)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', height: 26, marginLeft: 12, overflow: 'hidden' }}>
            {voice.levels.slice(-barCount).map((v, i) => (
              <View key={i} style={{ width: 2.5, marginRight: 2, borderRadius: 1, height: Math.max(3, Math.round(v * 22)), backgroundColor: voice.isPaused ? '#B8C0CC' : '#1E6FD9' }} />
            ))}
          </View>
        </View>
        <Pressable onPress={handleSend} disabled={sending} style={({ pressed }) => [sendBtnStyle, { opacity: sending ? 0.5 : pressed ? 0.85 : 1 }]}>
          <LinearGradient colors={['#4DA3FF', '#1E6FD9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={sendBtnInnerStyle}>
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
      <View style={{ alignItems: 'center', marginTop: 8 }}>
        <Pressable onPress={voice.isPaused ? handleResume : handlePause} hitSlop={8} style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: voice.isPaused ? attachBtnBg : '#1E6FD9' }}>
          <Ionicons name={voice.isPaused ? 'mic' : 'pause'} size={20} color={voice.isPaused ? '#1E6FD9' : '#FFFFFF'} />
        </Pressable>
      </View>
    </View>
  );
}
