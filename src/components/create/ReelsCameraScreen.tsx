import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { Dimensions, Platform, Pressable, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomTabsSwitcher, { type CreateMode } from './BottomTabsSwitcher';
import PostPickerScreen from './PostPickerScreen';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Capture button dimensions
const CAPTURE_OUTER = 80;
const CAPTURE_INNER = 64;
// Side circle (gallery / effects)
const SIDE_CIRCLE = 44;

interface ReelsCameraScreenProps {
  onClose: () => void;
  initialMode?: 'reel' | 'post';
}

/**
 * Static Reels Camera UI — no camera logic, no handlers (except close).
 * Matches Instagram Reels camera layout proportions with absolute positioning.
 */
const ReelsCameraScreen: React.FC<ReelsCameraScreenProps> = ({ onClose, initialMode = 'reel' }) => {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const bottomPadding = insets.bottom + 8;

  const [mode, setMode] = useState<CreateMode>(initialMode);

  const handleSwitch = useCallback((next: CreateMode) => {
    setMode(next);
  }, []);

  // ===== POST MODE → render gallery picker =====
  if (mode === 'post') {
    return (
      <View style={styles.container}>
        <PostPickerScreen onClose={onClose} />
        {/* Tab switcher overlaid at bottom */}
        <View style={[styles.bottomArea, { bottom: bottomPadding }]}>
          <BottomTabsSwitcher mode={mode} onSwitch={handleSwitch} />
        </View>
      </View>
    );
  }

  // ===== REEL MODE (default) =====
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* ===== TOP BAR ===== */}
      <View style={[styles.topBar, { top: topPadding }]}>
        {/* Close (X) — left */}
        <Pressable style={styles.topButton} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={30} color="#fff" />
        </Pressable>

        {/* Spacer */}
        <View style={styles.flex1} />

        {/* Settings — right */}
        <Pressable style={styles.topButton} hitSlop={12}>
          <Ionicons name="settings-outline" size={26} color="#fff" />
        </Pressable>
      </View>

      {/* ===== ADD AUDIO BUTTON — center top ===== */}
      <View style={[styles.addAudioContainer, { top: topPadding + 56 }]}>
        <View style={styles.addAudioButton}>
          <Ionicons name="musical-notes" size={16} color="#fff" />
          <Text style={styles.addAudioText}>Add audio</Text>
        </View>
      </View>

      {/* ===== LEFT VERTICAL CONTROLS ===== */}
      <View style={[styles.leftControls, { bottom: SCREEN_HEIGHT * 0.28 }]}>
        <SideIcon icon="musical-notes" label="Music" />
        <SideIcon icon="sparkles" label="Effects" />
        <SideIcon icon="timer-outline" label="Timer" />
        <SideIcon icon="time-outline" label="60" />
        <SideIcon icon="grid-outline" label="Layout" />
        <SideIcon icon="text" label="Text" />
      </View>

      {/* ===== BOTTOM CONTROLS ===== */}
      <View style={[styles.bottomArea, { bottom: bottomPadding }]}>
        {/* POST | REEL tab switcher */}
        <BottomTabsSwitcher mode={mode} onSwitch={handleSwitch} />

        {/* Capture row: gallery — capture — effects */}
        <View style={styles.captureRow}>
          {/* Gallery preview (circle, left) */}
          <View style={styles.sideCircle}>
            <Ionicons name="images" size={22} color="#fff" />
          </View>

          {/* Big capture button (center) */}
          <View style={styles.captureOuter}>
            <View style={styles.captureInner} />
          </View>

          {/* Effects button (circle, right) */}
          <View style={styles.sideCircle}>
            <Ionicons name="color-wand-outline" size={22} color="#fff" />
          </View>
        </View>
      </View>
    </View>
  );
};

// ===== Static side icon with label =====
const SideIcon: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}> = ({ icon, label }) => (
  <View style={styles.sideIconWrapper}>
    <Ionicons name={icon} size={26} color="#fff" />
    <Text style={styles.sideIconLabel}>{label}</Text>
  </View>
);

export default ReelsCameraScreen;

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

  // ---- Add audio ----
  addAudioContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  addAudioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addAudioText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // ---- Left vertical controls ----
  leftControls: {
    position: 'absolute',
    left: 14,
    alignItems: 'center',
    gap: 24,
    zIndex: 10,
  },
  sideIconWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  sideIconLabel: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },

  // ---- Bottom area ----
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },

  // ---- Capture row ----
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginTop: 14,
  },
  captureOuter: {
    width: CAPTURE_OUTER,
    height: CAPTURE_OUTER,
    borderRadius: CAPTURE_OUTER / 2,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: CAPTURE_INNER,
    height: CAPTURE_INNER,
    borderRadius: CAPTURE_INNER / 2,
    backgroundColor: '#FF3040',
  },
  sideCircle: {
    width: SIDE_CIRCLE,
    height: SIDE_CIRCLE,
    borderRadius: SIDE_CIRCLE / 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
});
