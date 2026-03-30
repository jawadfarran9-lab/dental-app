import ReelPlayer from '@/components/reels/ReelPlayer';
import { getHiddenReelIds, getInterestedReelIds, getPostsLikeData, getSavedPostIds, hideReel as hideReelPersist, loadCategoryProfile, saveCategoryProfile } from '@/services/engagementService';
import { useAuth } from '@/src/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Path } from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOCK_REELS = [
  { id: '1', clinicId: 'clinic_1', clinicName: 'SmileBright Dental', caption: 'Before & after veneers transformation', likeCount: 42, category: 'veneers', mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { id: '2', clinicId: 'clinic_2', clinicName: 'Pearl White Clinic', caption: 'Invisalign journey \u2014 week 12 progress', likeCount: 128, category: 'orthodontics', mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { id: '3', clinicId: 'clinic_3', clinicName: 'ClearSmile Studio', caption: 'Same-day dental implant procedure', likeCount: 7, category: 'implants', mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
  { id: '4', clinicId: 'clinic_4', clinicName: 'Harmony Dental Care', caption: 'Teeth whitening results in 45 minutes', likeCount: 63, category: 'whitening', mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
  { id: '5', clinicId: 'clinic_5', clinicName: 'ProSmile Experts', caption: 'Full smile makeover case study', likeCount: 215, category: 'cosmetic', mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
];

// Reel item with stable id (Firebase key) + instanceId (FlatList key)
type ReelItem = (typeof MOCK_REELS)[number] & { instanceId: string };

function toReelItems(reels: (typeof MOCK_REELS)[number][]): ReelItem[] {
  return reels.map((r) => ({ ...r, instanceId: nextReelId() }));
}

// Fisher-Yates shuffle (returns new array)
function shuffle<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Monotonic counter for unique reel ids
let reelIdCounter = 100;
function nextReelId(): string {
  return `reel_${++reelIdCounter}`;
}

// ---- Watch stats type ----
interface WatchStat {
  watchTime: number;
  skipped: boolean;
  fullyWatched: boolean;
}

// ---- Signals snapshot (loaded from storage) ----
interface SignalsSnapshot {
  interested: Set<string>;
  saved: Set<string>;
  hidden: Set<string>;
}

// ---- Pure ranking function ----
function rankReels<T extends { id: string; category?: string }>(
  reels: T[],
  watchStats: Record<string, WatchStat>,
  signals: SignalsSnapshot,
  categoryStats?: Record<string, number>,
): T[] {
  // If no data at all, return as-is
  const hasStats = Object.keys(watchStats).length > 0;
  const hasSignals = signals.interested.size > 0 || signals.saved.size > 0 || signals.hidden.size > 0;
  const hasCatStats = categoryStats && Object.keys(categoryStats).length > 0;
  if (!hasStats && !hasSignals && !hasCatStats) return reels;

  const scored = reels.map((reel) => {
    let score = 0;
    const stat = watchStats[reel.id];
    if (stat) {
      if (stat.fullyWatched) score += 3;
      if (stat.skipped) score -= 3;
    }
    if (signals.interested.has(reel.id)) score += 2;
    if (signals.saved.has(reel.id)) score += 2;
    if (signals.hidden.has(reel.id)) score -= 5;
    // Category affinity boost
    if (reel.category && categoryStats && categoryStats[reel.category]) {
      score += categoryStats[reel.category];
    }
    return { reel, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.reel);
}

const ReelsScreen = () => {
  const insets = useSafeAreaInsets();
  const { isSubscribed, loading: authLoading, clinicId: authClinicId } = useAuth();
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [reels, setReels] = useState<ReelItem[]>(() => toReelItems(MOCK_REELS));
  const [refreshing, setRefreshing] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const listRef = useRef<FlatList>(null);
  const loadingMore = useRef(false);
  const autoScrollRef = useRef(false);
  const activeIndexRef = useRef(0);
  const autoScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const visibleReelsLengthRef = useRef(0);

  // ---- Watch stats accumulator (ref — no re-renders) ----
  const watchStatsRef = useRef<Record<string, WatchStat>>({});

  // ---- Per-category affinity scores, clamped to [-10, +10] ----
  const categoryStatsRef = useRef<Record<string, number>>({});
  const categorySaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Reel→category lookup ref (avoids reels state in handleWatchStats deps) ----
  const reelCategoryMapRef = useRef<Map<string, string>>(new Map());

  const clampCategoryScore = (score: number) => Math.max(-10, Math.min(10, score));

  const persistCategoryProfile = useCallback(() => {
    if (categorySaveTimerRef.current) clearTimeout(categorySaveTimerRef.current);
    categorySaveTimerRef.current = setTimeout(() => {
      categorySaveTimerRef.current = null;
      saveCategoryProfile(categoryStatsRef.current);
    }, 2000);
  }, []);

  const adjustCategoryScore = useCallback((category: string | undefined, delta: number) => {
    if (!category) return;
    const prev = categoryStatsRef.current[category] ?? 0;
    categoryStatsRef.current[category] = clampCategoryScore(prev + delta);
    persistCategoryProfile();
  }, [persistCategoryProfile]);

  const handleWatchStats = useCallback((reelId: string, stats: WatchStat) => {
    watchStatsRef.current[reelId] = stats;
    const cat = reelCategoryMapRef.current.get(reelId);
    if (stats.fullyWatched) adjustCategoryScore(cat, 2);
    if (stats.skipped) adjustCategoryScore(cat, -2);
  }, [adjustCategoryScore]);

  // ---- Signals snapshot for ranking ----
  const signalsRef = useRef<SignalsSnapshot>({ interested: new Set(), saved: new Set(), hidden: new Set() });

  const loadSignals = useCallback(async () => {
    const [interested, saved, hidden] = await Promise.all([
      getInterestedReelIds(),
      getSavedPostIds(),
      getHiddenReelIds(),
    ]);
    signalsRef.current = {
      interested: new Set(interested),
      saved: new Set(saved),
      hidden: new Set(hidden),
    };
  }, []);

  const clearAutoScrollTimeout = useCallback(() => {
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
      autoScrollTimeoutRef.current = null;
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoScrollTimeoutRef.current) clearTimeout(autoScrollTimeoutRef.current);
    };
  }, []);

  // ---- Like state cache: persists across FlatList remounts ----
  const likeCacheRef = useRef<Map<string, { liked: boolean; likeCount: number }>>(new Map());

  const handleLikeChange = useCallback((reelId: string, liked: boolean, likeCount: number) => {
    likeCacheRef.current.set(reelId, { liked, likeCount });
  }, []);

  // ---- Hydrate likes from Firebase ----
  const hydrateLikes = useCallback(async (items: readonly { id: string; clinicId: string; likeCount: number }[]) => {
    // Group by clinicId
    const byClinic = new Map<string, { postIds: string[]; fallbacks: Record<string, number> }>();
    for (const r of items) {
      let entry = byClinic.get(r.clinicId);
      if (!entry) {
        entry = { postIds: [], fallbacks: {} };
        byClinic.set(r.clinicId, entry);
      }
      if (!entry.postIds.includes(r.id)) {
        entry.postIds.push(r.id);
        entry.fallbacks[r.id] = r.likeCount;
      }
    }
    const results = await Promise.all(
      Array.from(byClinic.entries()).map(([clinicId, { postIds, fallbacks }]) =>
        getPostsLikeData(clinicId, postIds, fallbacks).catch(() => ({} as Record<string, { isLiked: boolean; likeCount: number }>)),
      ),
    );
    for (const data of results) {
      for (const [postId, info] of Object.entries(data)) {
        likeCacheRef.current.set(postId, { liked: info.isLiked, likeCount: info.likeCount });
      }
    }
  }, []);

  // ---- Load persisted data on mount, then rank initial feed ----
  useEffect(() => {
    const init = async () => {
      const [hiddenIdsList, profile] = await Promise.all([
        getHiddenReelIds(),
        loadCategoryProfile(),
        loadSignals(),
      ]);
      if (hiddenIdsList.length > 0) setHiddenIds(new Set(hiddenIdsList));
      categoryStatsRef.current = profile;
      // Hydrate likes before first ranked render (uses stable id + clinicId only)
      await hydrateLikes(MOCK_REELS);
      // Apply persisted preferences to initial feed
      setReels((prev) => rankReels(prev, watchStatsRef.current, signalsRef.current, categoryStatsRef.current));
    };
    init();
  }, [loadSignals, hydrateLikes]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (categorySaveTimerRef.current) clearTimeout(categorySaveTimerRef.current);
    };
  }, []);

  const visibleReels = useMemo(
    () => reels.filter((r) => !hiddenIds.has(r.id)),
    [reels, hiddenIds],
  );

  // Keep refs in sync with derived data
  useEffect(() => {
    visibleReelsLengthRef.current = visibleReels.length;
  }, [visibleReels]);

  useEffect(() => {
    const map = new Map<string, string>();
    for (const r of reels) {
      if (r.category) map.set(r.id, r.category);
    }
    reelCategoryMapRef.current = map;
  }, [reels]);

  const handleRefresh = useCallback(async () => {
    clearAutoScrollTimeout();
    setRefreshing(true);
    await Promise.all([new Promise((r) => setTimeout(r, 600)), loadSignals()]);
    const fresh = toReelItems(shuffle(MOCK_REELS));
    await hydrateLikes(fresh);
    setReels(rankReels(fresh, watchStatsRef.current, signalsRef.current, categoryStatsRef.current));
    // Reload hidden IDs from persistent storage
    const ids = await getHiddenReelIds();
    setHiddenIds(new Set(ids));
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    setRefreshing(false);
  }, [clearAutoScrollTimeout, loadSignals, hydrateLikes]);

  // ---- Tab reselect → replace current + next reel in-place ----
  const navigation = useNavigation();

  // ---- Infinite feed: append a shuffled batch when nearing the end ----
  const handleEndReached = useCallback(async () => {
    if (loadingMore.current) return;
    loadingMore.current = true;
    const batch = toReelItems(shuffle(MOCK_REELS));
    await hydrateLikes(batch);
    const ranked = rankReels(batch, watchStatsRef.current, signalsRef.current, categoryStatsRef.current);
    setReels((prev) => [...prev, ...ranked]);
    loadingMore.current = false;
  }, [hydrateLikes]);

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('tabPress', () => {
      if (navigation.isFocused()) {
        // Pick random replacements from the pool with fresh instance keys
        const pool = shuffle(MOCK_REELS);
        setReels((prev) => {
          const updated = [...prev];
          if (activeIndex < updated.length) {
            updated[activeIndex] = { ...pool[0], instanceId: nextReelId() };
          }
          if (activeIndex + 1 < updated.length && pool.length > 1) {
            updated[activeIndex + 1] = { ...pool[1], instanceId: nextReelId() };
          }
          return updated;
        });
      }
    });
    return unsubscribe;
  }, [navigation, activeIndex]);

  const hideReel = useCallback((id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
    hideReelPersist(id);
  }, []);

  // ---- Auto-scroll ----
  const toggleAutoScroll = useCallback(() => {
    setAutoScrollEnabled((prev) => {
      autoScrollRef.current = !prev;
      return !prev;
    });
  }, []);

  const handleVideoEnd = useCallback((_reelId: string) => {
    if (!autoScrollRef.current) return;
    clearAutoScrollTimeout();
    autoScrollTimeoutRef.current = setTimeout(() => {
      autoScrollTimeoutRef.current = null;
      if (!autoScrollRef.current) return;
      const nextIndex = activeIndexRef.current + 1;
      if (nextIndex >= visibleReelsLengthRef.current) return;
      listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 400);
  }, [clearAutoScrollTimeout]);

  // ---- Viewability tracking (stable refs to avoid FlatList warnings) ----
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
        activeIndexRef.current = viewableItems[0].index;
      }
    },
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: ReelItem; index: number }) => {
      const cached = likeCacheRef.current.get(item.id);
      return (
        <ReelPlayer
          id={item.id}
          clinicId={item.clinicId}
          clinicName={item.clinicName}
          caption={item.caption}
          likeCount={cached ? cached.likeCount : item.likeCount}
          initialIsLiked={cached ? cached.liked : false}
          mediaUrl={item.mediaUrl}
          isActive={index === activeIndex}
          isNext={index === activeIndex + 1}
          autoScroll={autoScrollEnabled}
          onHide={() => hideReel(item.id)}
          onLikeChange={handleLikeChange}
          onVideoEnd={handleVideoEnd}
          onAutoScrollToggle={toggleAutoScroll}
          onWatchStats={handleWatchStats}
        />
      );
    },
    [hideReel, activeIndex, handleLikeChange, autoScrollEnabled, handleVideoEnd, toggleAutoScroll, handleWatchStats],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: SCREEN_HEIGHT,
      offset: SCREEN_HEIGHT * index,
      index,
    }),
    [],
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={visibleReels}
        renderItem={renderItem}
        keyExtractor={(item) => item.instanceId}
        getItemLayout={getItemLayout}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="start"
        initialNumToRender={2}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollBeginDrag={clearAutoScrollTimeout}
        onTouchStart={clearAutoScrollTimeout}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
            colors={['#fff']}
            progressBackgroundColor="#222"
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={1}
      />

      {/* Header — floating above feed */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {!authLoading && isSubscribed === true && authClinicId != null ? (
          <Pressable style={styles.headerButton} onPress={() => {}}>
            <Ionicons name="add" size={28} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.headerButton} />
        )}

        <Text style={styles.headerTitle}>Reels</Text>

        <View style={styles.headerRight}>
          <Pressable style={styles.headerButton} onPress={() => {}}>
            <Svg width={32} height={24} viewBox="0 0 36 24" fill="none">
              {/* Left heart */}
              <Path
                d="M10.5 4C8.5 2 5.3 2 3.3 4.1C1.3 6.2 1.3 9.5 3.3 11.6L12 20.5L14.5 18"
                stroke="#fff"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Right heart */}
              <Path
                d="M25.5 4C27.5 2 30.7 2 32.7 4.1C34.7 6.2 34.7 9.5 32.7 11.6L24 20.5L12 8.5C12 6.5 13.2 4.5 15 3.5C17 2.3 19.5 2.7 21 4.5L24 7.5"
                stroke="#fff"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default ReelsScreen;
