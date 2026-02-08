import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Linking,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_COLUMNS = 3;
const GRID_SPACING = 3;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * (GRID_COLUMNS + 1)) / GRID_COLUMNS;

interface MediaAsset {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
  width: number;
  height: number;
  creationTime?: number; // Unix timestamp in milliseconds
}

// Union type for grid items - either a camera button or a media asset
type GridItem = 
  | { id: 'camera'; isCamera: true }
  | (MediaAsset & { isCamera?: false });

// ========== Add to Story Screen ==========
export default function CreateScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [hasLimitedAccess, setHasLimitedAccess] = useState(false);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [hasNextPage, setHasNextPage] = useState(true);

  // Check existing permissions first, only request if not determined
  useEffect(() => {
    (async () => {
      // First check if we already have permission (don't prompt again)
      const permissionResult = await MediaLibrary.getPermissionsAsync();
      const { status: existingStatus, accessPrivileges } = permissionResult;
      
      // On iOS 14+, check if we have full access or just limited
      const hasFullAccess = existingStatus === 'granted' && accessPrivileges === 'all';
      const hasLimited = existingStatus === 'granted' && accessPrivileges === 'limited';
      
      if (hasFullAccess) {
        // Full access granted - load all photos
        setHasPermission(true);
        setHasLimitedAccess(false);
        loadMedia();
      } else if (hasLimited) {
        // Limited access - still load what we can but show message
        setHasPermission(true);
        setHasLimitedAccess(true);
        loadMedia();
      } else if (existingStatus === 'denied') {
        setHasPermission(false);
        setIsLoading(false);
      } else {
        // Permission not determined yet, request it
        const requestResult = await MediaLibrary.requestPermissionsAsync();
        const newHasFullAccess = requestResult.status === 'granted' && requestResult.accessPrivileges === 'all';
        const newHasLimited = requestResult.status === 'granted' && requestResult.accessPrivileges === 'limited';
        
        if (newHasFullAccess) {
          setHasPermission(true);
          setHasLimitedAccess(false);
          loadMedia();
        } else if (newHasLimited) {
          setHasPermission(true);
          setHasLimitedAccess(true);
          loadMedia();
        } else {
          setHasPermission(false);
          setIsLoading(false);
        }
      }
    })();
  }, []);

  // Load media from camera roll
  const loadMedia = useCallback(async (cursor?: string) => {
    try {
      const media = await MediaLibrary.getAssetsAsync({
        first: 50,
        after: cursor,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const assets: MediaAsset[] = media.assets.map((asset) => ({
        id: asset.id,
        uri: asset.uri,
        mediaType: asset.mediaType === 'video' ? 'video' : 'photo',
        duration: asset.duration,
        width: asset.width,
        height: asset.height,
        creationTime: asset.creationTime,
      }));

      if (cursor) {
        setMediaAssets((prev) => [...prev, ...assets]);
      } else {
        setMediaAssets(assets);
        // Don't auto-select - let user tap to select
      }

      setEndCursor(media.endCursor);
      setHasNextPage(media.hasNextPage);
    } catch (error) {
      console.error('Error loading media:', error);
      Alert.alert('Error', 'Failed to load media from your library.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load more media when reaching end of list
  const loadMoreMedia = useCallback(() => {
    if (hasNextPage && !isLoading && endCursor) {
      loadMedia(endCursor);
    }
  }, [hasNextPage, isLoading, endCursor, loadMedia]);

  // Handle media selection - navigate directly to editor
  const handleSelectMedia = useCallback((asset: MediaAsset) => {
    // Convert creationTime (unix ms) to ISO string for captureTime
    const captureTime = asset.creationTime 
      ? new Date(asset.creationTime).toISOString()
      : new Date().toISOString();
    
    router.push({
      pathname: '/story/edit',
      params: {
        uri: asset.uri,
        mediaType: asset.mediaType,
        width: String(asset.width),
        height: String(asset.height),
        duration: asset.duration ? String(asset.duration) : undefined,
        captureTime,
      },
    });
  }, [router]);

  // Handle camera press - navigate to camera screen
  const handleCameraPress = useCallback(() => {
    router.push('/story/camera');
  }, [router]);

  // Handle Music button
  const handleMusicPress = useCallback(() => {
    Alert.alert('Music', 'Add music to your story - coming soon!');
  }, []);

  // Handle Collage button
  const handleCollagePress = useCallback(() => {
    Alert.alert('Collage', 'Create a collage - coming soon!');
  }, []);

  // Handle Settings press
  const handleSettingsPress = useCallback(() => {
    router.push('/settings/story-settings');
  }, [router]);

  // Handle close
  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  // Handle request permission - re-check and request if needed
  const handleRequestPermission = useCallback(async () => {
    setIsLoading(true);
    try {
      // First check current status
      const currentPermission = await MediaLibrary.getPermissionsAsync();
      
      if (currentPermission.status === 'granted') {
        // Permission already granted, load media
        setHasPermission(true);
        setHasLimitedAccess(currentPermission.accessPrivileges === 'limited');
        loadMedia();
        return;
      }
      
      // Request permission
      const requestResult = await MediaLibrary.requestPermissionsAsync();
      
      if (requestResult.status === 'granted') {
        setHasPermission(true);
        setHasLimitedAccess(requestResult.accessPrivileges === 'limited');
        loadMedia();
      } else {
        setHasPermission(false);
        setIsLoading(false);
        // Show message if still denied
        Alert.alert(
          'Permission Required',
          'Please enable photo access in Settings to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setIsLoading(false);
    }
  }, [loadMedia]);

  // Format video duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Combined data with camera as first item
  const gridData: GridItem[] = [{ id: 'camera', isCamera: true }, ...mediaAssets];

  // Render grid item - handles both camera and media items
  const renderGridItem = ({ item }: { item: GridItem }) => {
    // Render camera item
    if (item.isCamera === true) {
      return (
        <TouchableOpacity
          style={[styles.gridItem, { backgroundColor: isDark ? colors.cardBackground : 'rgba(255,255,255,0.85)' }]}
          onPress={handleCameraPress}
          activeOpacity={0.8}
        >
          <View style={styles.cameraIconContainer}>
            <Ionicons name="camera" size={36} color={colors.textSecondary} />
            <Text style={[styles.cameraText, { color: colors.textSecondary }]}>
              Camera
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // TypeScript now knows item is MediaAsset (not camera)
    const mediaItem = item as MediaAsset;

    // Render media item
    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => handleSelectMedia(mediaItem)}
        activeOpacity={0.7}
      >
        <ExpoImage
          source={{ uri: mediaItem.uri }}
          style={styles.gridImage}
          contentFit="cover"
        />
        
        {/* Video duration badge */}
        {mediaItem.mediaType === 'video' && (
          <View style={styles.videoBadge}>
            <Ionicons name="play" size={12} color="#FFFFFF" />
            <Text style={styles.videoDuration}>
              {formatDuration(mediaItem.duration)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Loading state while checking permissions
  if (hasPermission === null) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Premium Gradient Background */}
        <PremiumGradientBackground isDark={isDark} showSparkles={false} />
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent
        />
        <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: 'transparent', backgroundColor: 'transparent' }]}>
            <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Add to story
            </Text>
            <TouchableOpacity style={styles.headerButton} onPress={handleSettingsPress}>
              <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
            <ActivityIndicator size="large" color={colors.accentBlue} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Permission denied view
  if (hasPermission === false) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Premium Gradient Background */}
        <PremiumGradientBackground isDark={isDark} showSparkles={true} />
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor="transparent"
          translucent
        />
        <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
          {/* Header for permission screen */}
          <View style={[styles.header, { borderBottomColor: 'transparent', backgroundColor: 'transparent' }]}>
            <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
              <Ionicons name="close" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Add to story
            </Text>
            <TouchableOpacity style={styles.headerButton} onPress={handleSettingsPress}>
              <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.permissionContainer, { backgroundColor: 'transparent' }]}>
            <View style={[styles.permissionIconContainer, { backgroundColor: isDark ? colors.cardBackground : 'rgba(255,255,255,0.9)' }]}>
              <Ionicons name="images" size={48} color={colors.accentBlue} />
            </View>
            <Text style={[styles.permissionTitle, { color: colors.textPrimary }]}>
              Photo Access Required
            </Text>
            <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
              We need photo access to show your gallery.
            </Text>
            
            {/* Primary button - Request Permission */}
            <TouchableOpacity
              style={[styles.permissionButton, { backgroundColor: colors.accentBlue }]}
              onPress={handleRequestPermission}
            >
              <Text style={[styles.permissionButtonText, { color: colors.buttonText }]}>Request Permission</Text>
            </TouchableOpacity>
            
            {/* Secondary button - Open Settings */}
            <TouchableOpacity
              style={[styles.permissionButtonSecondary, { borderColor: colors.accentBlue }]}
              onPress={() => Linking.openSettings()}
            >
              <Text style={[styles.permissionButtonSecondaryText, { color: colors.accentBlue }]}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Gradient Background */}
      <PremiumGradientBackground isDark={isDark} showSparkles={false} />
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor="transparent"
        translucent
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', backgroundColor: 'transparent' }]}>
          <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
            <Ionicons name="close" size={28} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Add to story
          </Text>
          
          <TouchableOpacity style={styles.headerButton} onPress={handleSettingsPress}>
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

      {/* Featured Buttons */}
      <View style={[styles.featuredButtons, { backgroundColor: 'transparent' }]}>
        <TouchableOpacity
          style={styles.featuredButtonFloating}
          onPress={handleMusicPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#E040FB', '#7C4DFF']}
            style={styles.featuredButtonIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="musical-notes" size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.featuredButtonText, { color: colors.textPrimary }]}>
            Music
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featuredButtonFloating}
          onPress={handleCollagePress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            style={styles.featuredButtonIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="grid" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.featuredButtonLabelContainer}>
            <Text style={[styles.featuredButtonText, { color: colors.textPrimary }]}>
              Collage
            </Text>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Media Gallery */}
      <View style={[styles.galleryContainer, { backgroundColor: 'transparent' }]}>
        {/* Limited Access Banner */}
        {hasLimitedAccess && (
          <TouchableOpacity 
            style={styles.limitedAccessBanner}
            onPress={() => Linking.openSettings()}
            activeOpacity={0.8}
          >
            <View style={styles.limitedAccessContent}>
              <Ionicons name="alert-circle" size={18} color="#FF9500" />
              <Text style={styles.limitedAccessText}>
                Limited photo access. Tap to allow all photos.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#FF9500" />
          </TouchableOpacity>
        )}
        
        <View style={[styles.galleryHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
          <Text style={[styles.galleryTitle, { color: colors.textPrimary }]}>
            Recents
          </Text>
          <TouchableOpacity style={styles.galleryDropdown}>
            <Text style={[styles.galleryDropdownText, { color: colors.textSecondary }]}>
              All Photos
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={[styles.loadingContainer, { backgroundColor: 'transparent' }]}>
            <ActivityIndicator size="large" color={colors.accentBlue} />
          </View>
        ) : (
          <FlatList<GridItem>
            data={gridData}
            renderItem={renderGridItem}
            keyExtractor={(item) => item.id}
            numColumns={GRID_COLUMNS}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.gridContainer, { backgroundColor: 'transparent' }]}
            style={{ backgroundColor: 'transparent' }}
            onEndReached={loadMoreMedia}
            onEndReachedThreshold={0.5}
            columnWrapperStyle={styles.gridRow}
          />
        )}
      </View>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  // Permission View
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  permissionButtonSecondary: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  permissionButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Preview Area
  previewArea: {
    height: 280,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewPlaceholder: {
    alignItems: 'center',
    gap: 12,
  },
  previewPlaceholderText: {
    fontSize: 14,
  },
  previewVideoIndicator: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  previewVideoDuration: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  // Featured Buttons
  featuredButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  featuredButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  featuredButtonFloating: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
    // No background - floating on gradient
  },
  featuredButtonIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  featuredButtonLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  newBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Gallery
  galleryContainer: {
    flex: 1,
  },
  limitedAccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 149, 0, 0.3)',
  },
  limitedAccessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  limitedAccessText: {
    color: '#FF9500',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  galleryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  galleryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  galleryDropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  gridContainer: {
    paddingHorizontal: GRID_SPACING,
    paddingTop: GRID_SPACING,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: GRID_SPACING,
    marginBottom: GRID_SPACING,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  cameraIconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  cameraText: {
    fontSize: 13,
    fontWeight: '600',
  },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  videoDuration: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
