import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Segment = { uri: string; duration: number };

export default function ReelsEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const params = useLocalSearchParams<{ segments?: string }>();

  const segments: Segment[] = useMemo(() => {
    try {
      return params.segments ? JSON.parse(params.segments) : [];
    } catch {
      return [];
    }
  }, [params.segments]);

  const totalDuration = useMemo(
    () => segments.reduce((sum, s) => sum + s.duration, 0),
    [segments],
  );

  console.log('[REELS-EDIT] Received segments:', segments.length, 'totalDuration:', totalDuration);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable style={styles.headerButton} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Segment info */}
      <View style={styles.body}>
        <Text style={styles.clipCount}>{segments.length} clip{segments.length !== 1 ? 's' : ''}</Text>
        <Text style={styles.totalDuration}>
          {Math.floor(totalDuration / 60)}:{Math.floor(totalDuration % 60).toString().padStart(2, '0')} total
        </Text>
        <Text style={styles.bodyText}>Editing coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  clipCount: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  totalDuration: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: '500',
  },
  bodyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    marginTop: 16,
  },
});
