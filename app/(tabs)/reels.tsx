import ReelPlayer from '@/components/reels/ReelPlayer';
import { getHiddenReelIds, getInterestedReelIds, getPostsLikeData, getSavedPostIds, hideReel as hideReelPersist, loadCategoryProfile, saveCategoryProfile } from '@/services/engagementService';
import { useAuth } from '@/src/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Path } from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOCK_REELS = [
  { id: '1', clinicId: 'clinic_1', clinicName: 'SmileBright Dental', caption: 'Before & after veneers transformation', likeCount: 42, category: 'veneers', mediaUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  { id: '2', clinicId: 'clinic_2', clinicName: 'Pearl White Clinic', caption: 'Invisalign journey \u2014 week 12 progress', likeCount: 128, category: 'orthodontics', mediaUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  { id: '3', clinicId: 'clinic_3', clinicName: 'ClearSmile Studio', caption: 'Same-day dental implant procedure', likeCount: 7, category: 'implants', mediaUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  { id: '4', clinicId: 'clinic_4', clinicName: 'Harmony Dental Care', caption: 'Teeth whitening results in 45 minutes', likeCount: 63, category: 'whitening', mediaUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
  { id: '5', clinicId: 'clinic_5', clinicName: 'ProSmile Experts', caption: 'Full smile makeover case study', likeCount: 215, category: 'cosmetic', mediaUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8' },
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

// ---- Feed Intelligence Engine ----

// Exponential category weight: converts raw score [-10..+10] into a ranking multiplier
function categoryWeight(score: number): number {
  if (score >= 3) return 1.5 + (score - 3) * 0.25;   // 3→1.5, 4→1.75, 5→2.0, …10→3.25
  if (score === 2) return 1.35;
  if (score === 1) return 1.2;
  if (score === 0) return 1.0;
  if (score === -1) return 0.8;
  if (score === -2) return 0.6;
  return 0.15;                                         // -3 or worse → near-invisible
}

// Hard filter threshold: categories at or below this score are removed entirely
const HARD_FILTER_THRESHOLD = -3;
// Diversity guard: max consecutive reels from the same category
const MAX_CONSECUTIVE_SAME_CAT = 2;

function rankReels<T extends { id: string; category?: string }>(
  reels: T[],
  watchStats: Record<string, WatchStat>,
  signals: SignalsSnapshot,
  categoryStats?: Record<string, number>,
): T[] {
  // If no data at all, apply cold start: balanced category mix via shuffle
  const hasStats = Object.keys(watchStats).length > 0;
  const hasSignals = signals.interested.size > 0 || signals.saved.size > 0 || signals.hidden.size > 0;
  const hasCatStats = categoryStats && Object.keys(categoryStats).length > 0;
  if (!hasStats && !hasSignals && !hasCatStats) {
    return coldStartShuffle(reels);
  }

  // --- Hard filter: remove strongly disliked categories ---
  const filtered = hasCatStats
    ? reels.filter((r) => {
        if (!r.category || !categoryStats![r.category]) return true;
        return categoryStats![r.category] > HARD_FILTER_THRESHOLD;
      })
    : reels;

  // --- Score each reel ---
  const scored = (filtered.length > 0 ? filtered : reels).map((reel) => {
    let score = 0;
    const stat = watchStats[reel.id];
    if (stat) {
      if (stat.fullyWatched) score += 3;
      if (stat.skipped) score -= 3;
    }
    if (signals.interested.has(reel.id)) score += 2;
    if (signals.saved.has(reel.id)) score += 2;
    if (signals.hidden.has(reel.id)) score -= 5;

    // Apply exponential category weight as a multiplier on a positive base
    const catScore = (reel.category && categoryStats && categoryStats[reel.category]) || 0;
    const base = 10 + score;  // shift to positive range so multiplier works correctly
    const weighted = base * categoryWeight(catScore);

    return { reel, score: weighted };
  });

  scored.sort((a, b) => b.score - a.score);

  // --- Soft boost: ensure strongly liked categories appear regularly ---
  const boostedCats = new Set<string>();
  if (hasCatStats) {
    for (const [cat, s] of Object.entries(categoryStats!)) {
      if (s >= 3) boostedCats.add(cat);
    }
  }

  let result = scored.map((s) => s.reel);

  // --- Soft boost injection: every 4 items, ensure a boosted category reel ---
  if (boostedCats.size > 0) {
    result = injectBoostedReels(result, boostedCats, 4);
  }

  // --- Diversity guard: break consecutive same-category runs ---
  result = enforceDiversity(result, MAX_CONSECUTIVE_SAME_CAT);

  return result.length > 0 ? result : reels;
}

// Cold start: interleave categories for a balanced first impression
function coldStartShuffle<T extends { category?: string }>(reels: T[]): T[] {
  // Group by category
  const buckets = new Map<string, T[]>();
  for (const r of reels) {
    const cat = r.category || '_none';
    if (!buckets.has(cat)) buckets.set(cat, []);
    buckets.get(cat)!.push(r);
  }
  // Round-robin interleave
  const result: T[] = [];
  const keys = Array.from(buckets.keys());
  let idx = 0;
  let placed = true;
  while (placed) {
    placed = false;
    for (const key of keys) {
      const bucket = buckets.get(key)!;
      if (idx < bucket.length) {
        result.push(bucket[idx]);
        placed = true;
      }
    }
    idx++;
  }
  return result.length > 0 ? result : reels;
}

// Inject boosted-category reels at regular intervals
function injectBoostedReels<T extends { category?: string }>(
  reels: T[],
  boostedCats: Set<string>,
  interval: number,
): T[] {
  // Find reels from boosted categories that aren't already well-positioned
  const boostedPool = reels.filter((r) => r.category && boostedCats.has(r.category));
  if (boostedPool.length === 0) return reels;

  const result = [...reels];
  let poolIdx = 0;
  for (let i = interval; i < result.length; i += interval) {
    // Check if any of the last `interval` items already has a boosted category
    const window = result.slice(Math.max(0, i - interval), i);
    const hasBoosted = window.some((r) => r.category && boostedCats.has(r.category));
    if (!hasBoosted && poolIdx < boostedPool.length) {
      // Find the boosted reel's current position and swap it to position i
      const target = boostedPool[poolIdx];
      const currentPos = result.indexOf(target);
      if (currentPos > i) {
        // Swap
        [result[i], result[currentPos]] = [result[currentPos], result[i]];
      }
      poolIdx++;
    }
  }
  return result;
}

// Enforce max consecutive same-category limit
function enforceDiversity<T extends { category?: string }>(reels: T[], maxConsecutive: number): T[] {
  if (reels.length <= maxConsecutive) return reels;
  const result = [...reels];
  for (let i = maxConsecutive; i < result.length; i++) {
    const current = result[i].category;
    if (!current) continue;
    // Check if previous `maxConsecutive` items are all the same category
    let allSame = true;
    for (let j = 1; j <= maxConsecutive; j++) {
      if (result[i - j].category !== current) { allSame = false; break; }
    }
    if (allSame) {
      // Find next reel with a different category and swap
      for (let k = i + 1; k < result.length; k++) {
        if (result[k].category !== current) {
          [result[i], result[k]] = [result[k], result[i]];
          break;
        }
      }
    }
  }
  return result;
}

const ReelsScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isSubscribed, loading: authLoading, clinicId: authClinicId } = useAuth();
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [reels, setReels] = useState<ReelItem[]>(() => toReelItems(MOCK_REELS));
  const [refreshing, setRefreshing] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const [focusTick, setFocusTick] = useState(0);
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
    // Graduated watch-time feedback
    if (stats.fullyWatched) {
      adjustCategoryScore(cat, 2);               // strong positive signal
    } else if (stats.watchTime >= 5) {
      adjustCategoryScore(cat, 1);               // moderate engagement
    }
    if (stats.skipped) {
      adjustCategoryScore(cat, -1);              // mild negative signal
    }
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

  const visibleReels = useMemo(() => {
    const filtered = reels.filter((r) => !hiddenIds.has(r.id));
    return filtered.length > 0 ? filtered : reels;
  }, [reels, hiddenIds]);

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
    // Cancel any pending category save from watch-stats so it doesn't overwrite fresh data
    if (categorySaveTimerRef.current) {
      clearTimeout(categorySaveTimerRef.current);
      categorySaveTimerRef.current = null;
    }
    setRefreshing(true);
    const [, , freshProfile] = await Promise.all([
      new Promise((r) => setTimeout(r, 600)),
      loadSignals(),
      loadCategoryProfile(),
    ]);
    categoryStatsRef.current = freshProfile;
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

  // Re-trigger video playback when screen regains focus (e.g. returning from /algorithm)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setFocusTick((t) => t + 1);
    });
    return unsubscribe;
  }, [navigation]);

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
          screenFocused={focusTick}
          onHide={() => hideReel(item.id)}
          onLikeChange={handleLikeChange}
          onVideoEnd={handleVideoEnd}
          onAutoScrollToggle={toggleAutoScroll}
          onWatchStats={handleWatchStats}
        />
      );
    },
    [hideReel, activeIndex, handleLikeChange, autoScrollEnabled, handleVideoEnd, toggleAutoScroll, handleWatchStats, focusTick],
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
        removeClippedSubviews={false}
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
          <Pressable style={styles.headerButton} onPress={() => router.push('/algorithm')}>
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
