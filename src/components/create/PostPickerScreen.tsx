import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Linking,
    Platform,
    Pressable,
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

interface MediaAsset {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
  width: number;
  height: number;
}

interface PostPickerScreenProps {
  onClose: () => void;
}

const PostPickerScreen: React.FC<PostPickerScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const router = useRouter();

  const [permissionStatus, setPermissionStatus] = useState<'loading' | 'granted' | 'denied'>('loading');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [endCursor, setEndCursor] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(true);

  // Check permission on mount
  useEffect(() => {
    (async () => {
      const { status, accessPrivileges } = await MediaLibrary.getPermissionsAsync();
      if (status === 'granted' || accessPrivileges === 'limited') {
        setPermissionStatus('granted');
      } else if (status === 'denied') {
        setPermissionStatus('denied');
      } else {
        // Not determined — request
        const req = await MediaLibrary.requestPermissionsAsync();
        if (req.status === 'granted' || req.accessPrivileges === 'limited') {
          setPermissionStatus('granted');
        } else {
          setPermissionStatus('denied');
        }
      }
    })();
  }, []);

  // Load media once permission is granted
  useEffect(() => {
    if (permissionStatus === 'granted') {
      loadMedia();
    }
  }, [permissionStatus]);

  const loadMedia = useCallback(async (cursor?: string) => {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: 60,
        after: cursor,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const mapped: MediaAsset[] = result.assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        mediaType: a.mediaType === 'video' ? 'video' : 'photo',
        duration: a.duration,
        width: a.width,
        height: a.height,
      }));

      if (cursor) {
        setAssets((prev) => [...prev, ...mapped]);
      } else {
        setAssets(mapped);
      }
      setEndCursor(result.endCursor);
      setHasNextPage(result.hasNextPage);
    } catch {
      // Silently fail — no error UI required per spec
    }
  }, []);

  const loadMore = useCallback(() => {
    if (hasNextPage && endCursor) {
      loadMedia(endCursor);
    }
  }, [hasNextPage, endCursor, loadMedia]);

  const handleRequestPermission = useCallback(async () => {
    const { status: current } = await MediaLibrary.getPermissionsAsync();
    if (current === 'denied') {
      // Already denied once — must go to settings
      Linking.openSettings();
      return;
    }
    const req = await MediaLibrary.requestPermissionsAsync();
    if (req.status === 'granted' || req.accessPrivileges === 'limited') {
      setPermissionStatus('granted');
    }
  }, []);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderItem = useCallback(({ item }: { item: MediaAsset }) => (
    <Pressable
      style={styles.gridItem}
      onPress={() => router.push({ pathname: '/post-preview' as any, params: { uri: item.uri } })}
    >
      <ExpoImage source={{ uri: item.uri }} style={styles.gridImage} contentFit="cover" />
      {item.mediaType === 'video' && (
        <View style={styles.videoBadge}>
          <Ionicons name="play" size={10} color="#fff" />
          <Text style={styles.videoDuration}>{formatDuration(item.duration)}</Text>
        </View>
      )}
    </Pressable>
  ), [router]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* ===== TOP BAR ===== */}
      <View style={[styles.topBar, { paddingTop: topPadding }]}>
        <Pressable style={styles.topButton} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={30} color="#fff" />
        </Pressable>

        <Text style={styles.title}>New post</Text>

        <Pressable style={styles.topButton} hitSlop={12}>
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>

      {/* ===== BODY ===== */}
      {permissionStatus === 'denied' ? (
        <View style={styles.permissionContainer}>
          <Ionicons name="images-outline" size={56} color="rgba(255,255,255,0.5)" />
          <Text style={styles.permissionTitle}>Allow access to your photos</Text>
          <Text style={styles.permissionSubtitle}>
            This lets you share photos from your library.
          </Text>
          <Pressable style={styles.permissionButton} onPress={handleRequestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </Pressable>
        </View>
      ) : permissionStatus === 'loading' ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionSubtitle}>Loading...</Text>
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={GRID_COLUMNS}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </View>
  );
};

export default PostPickerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ---- Top bar ----
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  topButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  nextText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
    fontWeight: '600',
  },

  // ---- Permission denied ----
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
});
