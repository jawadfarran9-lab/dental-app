import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { useTheme } from '@/src/context/ThemeContext';
import { ArchiveItem, fetchArchive } from '@/src/services/archiveService';
import ArchiveViewerModal from '@/src/components/ArchiveViewerModal';
import { useClinicSettings } from '@/src/hooks/useClinicSettings';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type FilterTab = 'all' | 'stories' | 'posts' | 'reels';

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'stories', label: 'Stories' },
  { key: 'posts', label: 'Posts' },
  { key: 'reels', label: 'Reels' },
];

// ========== Grid Tile ==========
const ArchiveTile = React.memo(
  ({ item, onPress }: { item: ArchiveItem; onPress: () => void }) => (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={gridStyles.tile}>
      <Image
        source={{ uri: item.thumbnailUrl || item.mediaUrl }}
        style={gridStyles.tileImage}
        contentFit="cover"
        recyclingKey={item.id}
        transition={200}
      />
      {item.type === 'video' && (
        <View style={gridStyles.videoOverlay}>
          <Ionicons name="play" size={22} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  ),
);

export default function ArchiveScreen() {
  const router = useRouter();
  const { clinicId } = useAuth();
  const { isDark } = useTheme();
  const { prefs } = useClinicSettings(clinicId);

  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);

  // ========== Load Archive ==========
  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchArchive(clinicId);
        if (!cancelled) setItems(data);
      } catch (err) {
        console.error('Error loading archive:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clinicId]);

  // ========== Filtered Data ==========
  const filtered = useMemo(() => {
    if (activeTab === 'all') return items;
    if (activeTab === 'stories') {
      // Stories have expiresAt > 0 (they were time-limited)
      return items.filter((i) => i.expiresAt > 0);
    }
    if (activeTab === 'posts') {
      return items.filter((i) => i.type === 'image' && i.expiresAt === 0);
    }
    // reels
    return items.filter((i) => i.type === 'video' && i.expiresAt === 0);
  }, [items, activeTab]);

  // ========== Render ==========
  const handleItemPress = useCallback(
    (item: ArchiveItem) => {
      const idx = filtered.findIndex((i) => i.id === item.id);
      setViewerStartIndex(idx >= 0 ? idx : 0);
      setViewerVisible(true);
    },
    [filtered],
  );

  const renderItem = useCallback(
    ({ item }: { item: ArchiveItem }) => (
      <ArchiveTile item={item} onPress={() => handleItemPress(item)} />
    ),
    [handleItemPress],
  );

  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const textColor = isDark ? '#F0F2F5' : '#1A2B3F';
  const subtextColor = isDark ? '#8A96A6' : '#7A8A9C';
  const tabActiveBg = isDark ? '#1E3A5F' : '#E8F4FD';
  const tabActiveText = isDark ? '#60A5FA' : '#1A73E8';
  const borderColor = isDark ? '#1E293B' : '#E8ECF0';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>  
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>  
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Archive</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.tabRow, { borderBottomColor: borderColor }]}>  
        {FILTER_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                isActive && { backgroundColor: tabActiveBg },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? tabActiveText : subtextColor },
                  isActive && styles.tabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={tabActiveText} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="archive-outline" size={48} color={subtextColor} />
          <Text style={[styles.emptyText, { color: subtextColor }]}>
            No archived items
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
          columnWrapperStyle={{ gap: GRID_GAP }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={Platform.OS === 'android'}
        />
      )}

      {/* Archive Viewer */}
      <ArchiveViewerModal
        visible={viewerVisible}
        items={filtered}
        startIndex={viewerStartIndex}
        clinicId={clinicId || ''}
        prefs={prefs}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: { fontSize: 14, fontWeight: '500' },
  tabTextActive: { fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  listContent: { paddingBottom: 32 },
});

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
});
