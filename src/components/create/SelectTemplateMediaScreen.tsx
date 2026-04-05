import { type MediaAsset, useDeviceMedia } from '@/src/hooks/useDeviceMedia';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
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
const GRID_SPACING = 2;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

interface SelectTemplateMediaScreenProps {
  templateId?: string;
  maxSlots?: number;
  onClose?: () => void;
}

const SelectTemplateMediaScreen: React.FC<SelectTemplateMediaScreenProps> = ({ templateId, maxSlots = 0, onClose }) => {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const router = useRouter();
  const { assets, isLoading, loadMore, permission } = useDeviceMedia();

  const [selectedItems, setSelectedItems] = useState<MediaAsset[]>([]);

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  const handleToggle = useCallback((item: MediaAsset) => {
    setSelectedItems((prev) => {
      const exists = prev.some((i) => i.id === item.id);
      if (exists) return prev.filter((i) => i.id !== item.id);
      if (maxSlots > 0 && prev.length >= maxSlots) return prev;
      return [...prev, item];
    });
  }, [maxSlots]);

  const handleRemoveItem = useCallback((id: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleNext = () => {
    router.push({
      pathname: '/template-slots' as any,
      params: {
        templateId,
        selectedMedia: JSON.stringify(selectedItems),
      },
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const limitReached = maxSlots > 0 && selectedItems.length >= maxSlots;

  const renderMediaItem = useCallback(({ item }: { item: MediaAsset }) => {
    const selIndex = selectedItems.findIndex((i) => i.id === item.id);
    const selected = selIndex !== -1;
    const disabled = limitReached && !selected;
    return (
      <Pressable style={styles.gridItem} onPress={disabled ? undefined : () => handleToggle(item)}>
        <ExpoImage source={{ uri: item.uri }} style={styles.gridImage} contentFit="cover" />
        {disabled && <View style={styles.disabledOverlay} />}
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
  }, [selectedItems, handleToggle, limitReached]);

  // ===== HEADER =====
  const headerElement = (
    <View style={[styles.header, { paddingTop: topPadding }]}>
      <Pressable style={styles.headerButton} onPress={handleClose} hitSlop={12}>
        <Ionicons name="close" size={28} color="#fff" />
      </Pressable>
      <Text style={styles.headerTitle}>
        {maxSlots > 0 ? `${selectedItems.length} / ${maxSlots}` : 'Select media'}
      </Text>
      <View style={styles.headerButton} />
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
            This lets you select photos and videos for your template.
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

  // ===== MEDIA GRID =====
  const listHeader = (
    <View style={styles.recentsHeader}>
      <Text style={styles.recentsTitle}>Recents</Text>
      <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.6)" />
    </View>
  );

  const hasSelection = selectedItems.length > 0;
  const canProceed = maxSlots > 0 ? selectedItems.length === maxSlots : hasSelection;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />
      {headerElement}

      <FlatList
        data={assets}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={GRID_COLUMNS}
        ListHeaderComponent={listHeader}
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
          <Pressable style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]} onPress={canProceed ? handleNext : undefined}>
            <Text style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color={canProceed ? '#fff' : 'rgba(255,255,255,0.4)'} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default SelectTemplateMediaScreen;

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
    fontWeight: '700',
    textAlign: 'center',
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
    fontWeight: '700',
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
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
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
    borderColor: '#0095F6',
    borderRadius: 2,
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  indexBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0095F6',
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
  nextButtonDisabled: {
    backgroundColor: 'rgba(0,149,246,0.35)',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  nextButtonTextDisabled: {
    color: 'rgba(255,255,255,0.4)',
  },
});
