import { type MediaAsset, useDeviceMedia } from '@/src/hooks/useDeviceMedia';
import { resolveMediaToOwnedFile } from '@/src/utils/mediaCopy';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_COLUMNS = 3;
const GRID_SPACING = 3;
const MAX_SELECTION = 20;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

interface ReelsMediaPickerScreenProps {
  onClose?: () => void;
}

const ReelsMediaPickerScreen: React.FC<ReelsMediaPickerScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const router = useRouter();
  const { assets, isLoading, loadMore, permission } = useDeviceMedia();

  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<MediaAsset[]>([]);

  const handleSelect = useCallback(async (item: MediaAsset) => {
    if (!isSelecting) {
      let playableUri = item.uri;
      if (item.mediaType === 'video') {
        playableUri = await resolveMediaToOwnedFile(item.id, item.uri, item.mediaType);
      }
      console.log('[gallery] Resolved URI:', playableUri);
      router.push({
        pathname: '/reels-edit' as any,
        params: {
          segments: JSON.stringify([
            {
              uri: playableUri,
              // Phase 18.c Fix #M: Math.round eliminates iOS AVFoundation
              // sub-second float drift (e.g., 10.034 → 10). At PPS=40, this
              // removes the ~1.36px ruler-vs-segment misalignment visible after
              // Fix #K corrected the larger 12px separator drift. Photos remain 5.
              duration: item.mediaType === 'photo' ? 5 : Math.round(item.duration ?? 0),
              mediaType: item.mediaType,
            },
          ]),
        },
      });
      return;
    }
    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      if (prev.length >= MAX_SELECTION) return prev;
      return [...prev, item];
    });
  }, [isSelecting, router]);

  const handleHeaderAction = () => {
    if (isSelecting) {
      setSelectedItems([]);
      setIsSelecting(false);
    } else {
      setIsSelecting(true);
    }
  };

  const handleNext = async () => {
    const segments: { uri: string; duration: number; mediaType: 'photo' | 'video' }[] = [];
    for (const item of selectedItems) {
      let playableUri = item.uri;
      if (item.mediaType === 'video') {
        playableUri = await resolveMediaToOwnedFile(item.id, item.uri, item.mediaType);
      }
      console.log('[gallery] Resolved URI:', playableUri);
      segments.push({
        uri: playableUri,
        duration: item.mediaType === 'photo' ? 5 : Math.round(item.duration ?? 0),
        mediaType: item.mediaType,
      });
    }
    router.push({
      pathname: '/reels-edit' as any,
      params: { segments: JSON.stringify(segments) },
    });
  };

  const handleRemoveItem = useCallback((id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMediaItem = useCallback(({ item }: { item: MediaAsset }) => {
    const selIndex = selectedItems.findIndex((i) => i.id === item.id);
    const selected = isSelecting && selIndex !== -1;
    return (
      <Pressable
        style={styles.gridItem}
        onPress={() => handleSelect(item)}
      >
        <ExpoImage source={{ uri: item.uri }} style={styles.gridImage} contentFit="cover" />
        {item.mediaType === 'video' && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={10} color="#fff" />
            <Text style={styles.videoDuration}>{formatDuration(item.duration)}</Text>
          </View>
        )}
        {selected && (
          <>
            <View style={styles.selectedOverlay} />
            <View style={styles.indexBadge}>
              <Text style={styles.indexText}>{selIndex + 1}</Text>
            </View>
          </>
        )}
      </Pressable>
    );
  }, [isSelecting, selectedItems, handleSelect]);

  // ===== HEADER (shared across all states) =====
  const headerElement = (
    <View style={[styles.header, { paddingTop: topPadding }]}>
      <Pressable style={styles.headerButton} onPress={handleClose} hitSlop={12}>
        <Ionicons name="close" size={28} color="#fff" />
      </Pressable>
      <Text style={styles.headerTitle}>New reel</Text>
      <Pressable style={styles.headerButton} onPress={() => router.push('/reels-camera-settings' as any)} hitSlop={12}>
        <Ionicons name="settings-outline" size={24} color="#fff" />
      </Pressable>
    </View>
  );

  // ===== PERMISSION DENIED =====
  if (permission === 'denied') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
        {headerElement}
        <View style={styles.permissionContainer}>
          <Ionicons name="images-outline" size={56} color="rgba(255,255,255,0.5)" />
          <Text style={styles.permissionTitle}>Allow access to your media</Text>
          <Text style={styles.permissionSubtitle}>
            This lets you select photos and videos for your reel.
          </Text>
          <Pressable style={styles.permissionButton} onPress={() => Linking.openSettings()}>
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ===== LOADING =====
  if (permission === 'loading' || (isLoading && assets.length === 0)) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
        {headerElement}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </View>
    );
  }

  const hasSelection = selectedItems.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      {headerElement}

      {/* Templates pill */}
      <View style={styles.templatesContainer}>
        <Pressable onPress={() => router.push('/reels-templates' as any)} style={styles.templatesPillOuter}>
          <LinearGradient
            colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.templatesPill}
          >
            <Ionicons name="document-text-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.templatesPillText}>Templates</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Select / Cancel action row */}
      <View style={styles.selectRow}>
        <Pressable onPress={handleHeaderAction} hitSlop={8}>
          <Text style={isSelecting ? styles.cancelText : styles.selectText}>
            {isSelecting
              ? selectedItems.length > 0
                ? `Cancel (${selectedItems.length}/${MAX_SELECTION})`
                : 'Cancel'
              : 'Select'}
          </Text>
        </Pressable>
      </View>

      {/* Recents section header */}
      <View style={styles.recentsHeader}>
        <Text style={styles.recentsTitle}>Recents</Text>
        <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.85)" />
      </View>

      <FlatList
        data={assets}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={GRID_COLUMNS}
        contentContainerStyle={[styles.gridContainer, hasSelection && { paddingBottom: 110 }]}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />

      {/* ===== BOTTOM PREVIEW BAR ===== */}
      {hasSelection && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 12 }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bottomBarScroll}
          >
            {selectedItems.map((item) => (
              <View key={item.id} style={styles.thumbWrapper}>
                <ExpoImage source={{ uri: item.uri }} style={styles.thumbImage} contentFit="cover" />
                <Pressable style={styles.thumbRemove} onPress={() => handleRemoveItem(item.id)} hitSlop={6}>
                  <Ionicons name="close-circle" size={18} color="#fff" />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default ReelsMediaPickerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
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
    fontWeight: '800',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  selectText: {
    color: '#00E5FF',
    fontSize: 17,
    fontWeight: '600',
  },
  cancelText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  selectRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
  },

  // ---- Templates Pill ----
  templatesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  templatesPillOuter: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  templatesPill: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templatesPillText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ---- Recents Header ----
  recentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  recentsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },

  // ---- Grid ----
  gridContainer: {
    paddingTop: GRID_SPACING,
    paddingHorizontal: GRID_SPACING,
  },
  gridRow: {
    gap: GRID_SPACING,
    marginBottom: GRID_SPACING,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  videoDuration: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 2,
    borderColor: '#00E5FF',
    borderRadius: 10,
  },
  indexBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00E5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indexText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // ---- Permission Denied ----
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  permissionSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#0095F6',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // ---- Loading ----
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- Bottom Preview Bar ----
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  bottomBarScroll: {
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  thumbWrapper: {
    width: 56,
    height: 56,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0095F6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6,
    marginLeft: 'auto',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
