import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

export default function PhotoEditorScreen() {
  const insets = useSafeAreaInsets();
  const { clinicId, patientId, sessionId, photoId } = useLocalSearchParams<{
    clinicId?: string; patientId?: string; sessionId?: string; photoId?: string;
  }>();

  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId || !patientId || !sessionId || !photoId) {
      setLoading(false);
      return;
    }
    const ref = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}/photos/${photoId}`
    );
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setLoading(false);
        setUrl(snap.exists() ? ((snap.data() as any).url ?? null) : null);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [clinicId, patientId, sessionId, photoId]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : url ? (
        <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
      ) : null}
      <Pressable
        onPress={() => router.back()}
        style={[styles.close, { top: insets.top + 12 }]}
        hitSlop={12}
      >
        <Ionicons name="close" size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  close: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
