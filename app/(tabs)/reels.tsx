import ReelPlayer from '@/components/reels/ReelPlayer';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, RefreshControl, StyleSheet, Text, View, ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Svg, { Path } from 'react-native-svg';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MOCK_REELS = [
  { id: '1', clinicId: 'clinic_1', clinicName: 'SmileBright Dental', caption: 'Before & after veneers transformation', likeCount: 42, mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { id: '2', clinicId: 'clinic_2', clinicName: 'Pearl White Clinic', caption: 'Invisalign journey \u2014 week 12 progress', likeCount: 128, mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { id: '3', clinicId: 'clinic_3', clinicName: 'ClearSmile Studio', caption: 'Same-day dental implant procedure', likeCount: 7, mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
  { id: '4', clinicId: 'clinic_4', clinicName: 'Harmony Dental Care', caption: 'Teeth whitening results in 45 minutes', likeCount: 63, mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
  { id: '5', clinicId: 'clinic_5', clinicName: 'ProSmile Experts', caption: 'Full smile makeover case study', likeCount: 215, mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
];

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

const ReelsScreen = () => {
  const insets = useSafeAreaInsets();
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [reels, setReels] = useState(MOCK_REELS);
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<FlatList>(null);
  const loadingMore = useRef(false);

  // ---- Like state cache: persists across FlatList remounts ----
  const likeCacheRef = useRef<Map<string, { liked: boolean; likeCount: number }>>(new Map());

  const handleLikeChange = useCallback((reelId: string, liked: boolean, likeCount: number) => {
    likeCacheRef.current.set(reelId, { liked, likeCount });
  }, []);

  const visibleReels = useMemo(
    () => reels.filter((r) => !hiddenIds.has(r.id)),
    [reels, hiddenIds],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setReels(shuffle(MOCK_REELS).map((r) => ({ ...r, id: nextReelId() })));
    setHiddenIds(new Set());
    setActiveIndex(0);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    setRefreshing(false);
  }, []);

  // ---- Tab reselect → replace current + next reel in-place ----
  const navigation = useNavigation();

  // ---- Infinite feed: append a shuffled batch when nearing the end ----
  const handleEndReached = useCallback(() => {
    if (loadingMore.current) return;
    loadingMore.current = true;
    const batch = shuffle(MOCK_REELS).map((r) => ({ ...r, id: nextReelId() }));
    setReels((prev) => [...prev, ...batch]);
    loadingMore.current = false;
  }, []);

  useEffect(() => {
    const unsubscribe = (navigation as any).addListener('tabPress', () => {
      if (navigation.isFocused()) {
        // Pick random replacements from the pool with fresh unique ids
        const pool = shuffle(MOCK_REELS);
        setReels((prev) => {
          const updated = [...prev];
          if (activeIndex < updated.length) {
            updated[activeIndex] = { ...pool[0], id: nextReelId() };
          }
          if (activeIndex + 1 < updated.length && pool.length > 1) {
            updated[activeIndex + 1] = { ...pool[1], id: nextReelId() };
          }
          return updated;
        });
      }
    });
    return unsubscribe;
  }, [navigation, activeIndex]);

  const hideReel = useCallback((id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
  }, []);

  // ---- Viewability tracking (stable refs to avoid FlatList warnings) ----
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const renderItem = useCallback(
    ({ item, index }: { item: (typeof MOCK_REELS)[number]; index: number }) => {
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
          onHide={() => hideReel(item.id)}
          onLikeChange={handleLikeChange}
        />
      );
    },
    [hideReel, activeIndex, handleLikeChange],
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
        keyExtractor={(item) => item.id}
        getItemLayout={getItemLayout}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="start"
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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
        <Pressable style={styles.headerButton} onPress={() => {}}>
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>

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
