import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Placeholder reel edit screen (Phase 6 shell).
 * Full black screen — real editing will be implemented later.
 */
export default function ReelsEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);

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

      {/* Body */}
      <View style={styles.body}>
        <Text style={styles.bodyText}>Coming soon</Text>
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
  },
  bodyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
  },
});
