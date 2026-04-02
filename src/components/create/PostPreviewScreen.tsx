import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React from 'react';
import { Dimensions, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Bottom toolbar items
const TOOLBAR_ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'musical-notes', label: 'Audio' },
  { icon: 'text', label: 'Text' },
  { icon: 'copy-outline', label: 'Overlay' },
  { icon: 'color-filter-outline', label: 'Filter' },
  { icon: 'create-outline', label: 'Edit' },
];

interface PostPreviewScreenProps {
  uri: string;
  onClose: () => void;
}

const PostPreviewScreen: React.FC<PostPreviewScreenProps> = ({ uri, onClose }) => {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const bottomPadding = insets.bottom + 12;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* ===== TOP BAR ===== */}
      <View style={[styles.topBar, { paddingTop: topPadding }]}>
        <Pressable style={styles.topButton} onPress={onClose} hitSlop={12}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </Pressable>

        <View style={styles.flex1} />

        <Pressable style={styles.topButton} hitSlop={12}>
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>

      {/* ===== FULLSCREEN IMAGE ===== */}
      <View style={styles.imageContainer}>
        <ExpoImage
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          transition={0}
        />
      </View>

      {/* ===== BOTTOM TOOLBAR (static) ===== */}
      <View style={[styles.toolbar, { paddingBottom: bottomPadding }]}>
        {TOOLBAR_ITEMS.map((item) => (
          <View key={item.label} style={styles.toolbarItem}>
            <Ionicons name={item.icon} size={24} color="#fff" />
            <Text style={styles.toolbarLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default PostPreviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ---- Top bar ----
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: { flex: 1 },
  nextText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
    fontWeight: '600',
  },

  // ---- Image ----
  imageContainer: {
    flex: 1,
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },

  // ---- Toolbar ----
  toolbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  toolbarItem: {
    alignItems: 'center',
    gap: 4,
  },
  toolbarLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
});
