import StarAvatar from '@/src/components/StarAvatar';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import { fetchClinicMedia } from '@/src/services/clinicMediaService';
import { ClinicMedia } from '@/src/types/clinicMedia';
import { ClinicData, fetchClinicData } from '@/src/utils/clinicDataUtils';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Linking,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type TabKey = 'posts' | 'reels';

// ─── Grid Item (memoised) ───
const MediaGridItem = React.memo(
  ({
    item,
    onPress,
    isDark,
  }: {
    item: ClinicMedia;
    onPress: (id: string) => void;
    isDark: boolean;
  }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(item.id)}
      style={gridStyles.tile}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={gridStyles.tileImage}
        contentFit="cover"
        recyclingKey={item.id}
        transition={200}
      />

      {/* Video play indicator */}
      {item.isVideo && (
        <View style={gridStyles.videoOverlay}>
          <Ionicons name="play" size={22} color="#FFF" />
        </View>
      )}

      {/* Carousel / multi-image indicator */}
      {(item.mediaCount ?? 0) > 1 && (
        <View style={gridStyles.carouselOverlay}>
          <Ionicons name="copy-outline" size={14} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  ),
);

const gridStyles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#E8ECF0',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});

/**
 * Clinic Profile Screen (inside tabs)
 *
 * Route: /(tabs)/clinics/[clinicId]
 * Phase 3 — Header + Posts/Reels tabs + media grid.
 * Tab bar remains visible.
 */
export default function ClinicProfileScreen() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const auth = useAuth();

  const isOwner = !!(auth.clinicId && clinicId && auth.clinicId === clinicId);

  // ─── Clinic Data ───
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchClinicData(clinicId);
      if (!cancelled) {
        setClinic(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clinicId]);

  // ─── Media Data ───
  const [allMedia, setAllMedia] = useState<ClinicMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    (async () => {
      setMediaLoading(true);
      const items = await fetchClinicMedia(clinicId);
      if (!cancelled) {
        setAllMedia(items);
        setMediaLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clinicId]);

  // ─── Tabs ───
  const [activeTab, setActiveTab] = useState<TabKey>('posts');

  const filteredMedia = useMemo(
    () => allMedia.filter((m) => (activeTab === 'posts' ? m.type === 'post' : m.type === 'reel')),
    [allMedia, activeTab],
  );

  // ─── Derived display values ───
  const displayName = clinic?.clinicName || 'Clinic';
  const displayCity = clinic?.city || '';
  const displayCountry = clinic?.countryCode || '';
  const locationLine = [displayCity, displayCountry].filter(Boolean).join(', ');
  const phone = clinic?.clinicPhone || clinic?.phone || '';
  const profileImageUri =
    clinic?.imageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4A90D9&color=fff&size=256`;

  // ─── Handlers ───
  const handleCall = useCallback(() => {
    if (phone) Linking.openURL(`tel:${phone}`);
  }, [phone]);

  const handleMediaPress = useCallback(
    (mediaId: string) => {
      router.push(`/clinic/${clinicId}/media/${mediaId}` as any);
    },
    [clinicId, router],
  );

  const keyExtractor = useCallback((item: ClinicMedia) => item.id, []);

  const renderMediaItem = useCallback(
    ({ item }: { item: ClinicMedia }) => (
      <MediaGridItem item={item} onPress={handleMediaPress} isDark={isDark} />
    ),
    [handleMediaPress, isDark],
  );

  const ItemSeparator = useCallback(() => <View style={{ height: GRID_GAP }} />, []);

  // ─── Loading state ───
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
        {/* Back button while loading */}
        <View style={styles.backBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#1E3A5F'} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Header component for FlatList ───
  const ListHeader = (
    <>
      {/* ══════ Top Navigation Bar ══════ */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.navBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#1E3A5F'} />
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
              <Ionicons name="add" size={26} color={isDark ? '#FFF' : '#1E3A5F'} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.navRight}>
          {isOwner && (
            <>
              <TouchableOpacity
                style={styles.navBtn}
                activeOpacity={0.7}
                onPress={() => router.push('/notifications' as any)}
              >
                <Ionicons name="notifications-outline" size={24} color={isDark ? '#FFF' : '#1E3A5F'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
                <Ionicons name="ellipsis-vertical" size={22} color={isDark ? '#FFF' : '#1E3A5F'} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ══════ Profile Header ══════ */}
      <View style={styles.profileSection}>
        <View style={styles.avatarWrap}>
          <StarAvatar size={110} uri={profileImageUri} borderWidth={3} />
        </View>

        <View style={styles.nameRow}>
          <Text
            style={[styles.clinicName, { color: isDark ? '#FFF' : '#1E3A5F' }]}
            numberOfLines={2}
          >
            {displayName}
          </Text>
          {isOwner && (
            <Ionicons
              name="lock-closed"
              size={16}
              color={isDark ? '#7A8BA3' : '#A0AAB8'}
              style={styles.lockIcon}
            />
          )}
        </View>

        {!!locationLine && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={isDark ? '#8A9AB5' : '#6B7C93'} />
            <Text style={[styles.infoText, { color: isDark ? '#8A9AB5' : '#6B7C93' }]}>
              {locationLine}
            </Text>
          </View>
        )}

        {!!phone && (
          <TouchableOpacity style={styles.infoRow} onPress={handleCall} activeOpacity={0.6}>
            <Ionicons name="call-outline" size={16} color="#4A90D9" />
            <Text style={[styles.infoText, { color: '#4A90D9' }]}>{phone}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.infoRow}>
          <Ionicons name="map-outline" size={16} color={isDark ? '#5A6A80' : '#B0BEC5'} />
          <Text style={[styles.infoText, { color: isDark ? '#5A6A80' : '#B0BEC5' }]}>
            View on Map
          </Text>
        </View>
      </View>

      {/* ══════ Posts / Reels Tabs ══════ */}
      <View style={[styles.tabBar, { borderBottomColor: isDark ? '#2A3544' : '#E8ECF0' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={activeTab === 'posts' ? (isDark ? '#FFF' : '#1E3A5F') : (isDark ? '#5A6A80' : '#B0BEC5')}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'posts' ? (isDark ? '#FFF' : '#1E3A5F') : (isDark ? '#5A6A80' : '#B0BEC5'),
                fontWeight: activeTab === 'posts' ? '700' : '500',
              },
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reels' && styles.tabActive]}
          onPress={() => setActiveTab('reels')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="film-outline"
            size={22}
            color={activeTab === 'reels' ? (isDark ? '#FFF' : '#1E3A5F') : (isDark ? '#5A6A80' : '#B0BEC5')}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'reels' ? (isDark ? '#FFF' : '#1E3A5F') : (isDark ? '#5A6A80' : '#B0BEC5'),
                fontWeight: activeTab === 'reels' ? '700' : '500',
              },
            ]}
          >
            Reels
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Empty state ───
  const EmptyGrid = (
    <View style={styles.emptyGrid}>
      <Ionicons
        name={activeTab === 'posts' ? 'camera-outline' : 'videocam-outline'}
        size={48}
        color={isDark ? '#3A4A5C' : '#D0D8E0'}
      />
      <Text style={[styles.emptyText, { color: isDark ? '#5A6A80' : '#B0BEC5' }]}>
        {activeTab === 'posts' ? 'No posts yet' : 'No reels yet'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
      <FlatList
        data={filteredMedia}
        renderItem={renderMediaItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={mediaLoading ? (
          <View style={styles.emptyGrid}>
            <ActivityIndicator size="small" color="#4A90D9" />
          </View>
        ) : EmptyGrid}
        ItemSeparatorComponent={ItemSeparator}
        columnWrapperStyle={{ gap: GRID_GAP }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Back Bar (loading state) ── */
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 8,
    minHeight: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Nav Bar ── */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 8,
    minHeight: 48,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Profile Section ── */
  profileSection: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  avatarWrap: {
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  lockIcon: {
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* ── Tabs ── */
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1E3A5F',
  },
  tabLabel: {
    fontSize: 14,
  },

  /* ── Empty ── */
  emptyGrid: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
