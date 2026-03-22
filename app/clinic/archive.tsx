import ArchiveCalendarView from '@/src/components/ArchiveCalendarView';
import ArchiveViewerModal from '@/src/components/ArchiveViewerModal';
import HighlightEditorModal from '@/src/components/HighlightEditorModal';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import { useClinicSettings } from '@/src/hooks/useClinicSettings';
import { ArchiveItem, fetchArchive } from '@/src/services/archiveService';
import { createHighlight, deleteHighlight, fetchHighlights, Highlight, updateHighlight } from '@/src/services/highlightsService';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type ArchiveType = 'stories' | 'posts' | 'reels';
type ArchiveMode = 'grid' | 'highlights' | 'calendar' | 'map';

const ARCHIVE_TYPE_LABELS: Record<ArchiveType, string> = {
  stories: 'Stories archive',
  posts: 'Posts archive',
  reels: 'Reels archive',
};

// ========== Date Grouping ==========
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type FlatRow =
  | { type: 'header'; key: string; label: string }
  | { type: 'row'; key: string; items: ArchiveItem[] };

function groupByDate(items: ArchiveItem[]): FlatRow[] {
  const groups: Record<string, ArchiveItem[]> = {};
  const order: string[] = [];

  items.forEach((item) => {
    const d = new Date(item.archivedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!groups[key]) {
      groups[key] = [];
      order.push(key);
    }
    groups[key].push(item);
  });

  const rows: FlatRow[] = [];
  order.forEach((gKey) => {
    const group = groups[gKey];
    const d = new Date(group[0].archivedAt);
    rows.push({ type: 'header', key: `h-${gKey}`, label: `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}` });
    for (let i = 0; i < group.length; i += NUM_COLUMNS) {
      rows.push({ type: 'row', key: `r-${gKey}-${i}`, items: group.slice(i, i + NUM_COLUMNS) });
    }
  });

  return rows;
}

// ========== Grid Tile ==========
const ArchiveTile = React.memo(
  ({ item, onPress, selectionMode, isSelected }: {
    item: ArchiveItem; onPress: () => void; selectionMode?: boolean; isSelected?: boolean;
  }) => {
    const d = new Date(item.archivedAt);
    const badge = `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
    return (
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
            <Ionicons name="play" size={14} color="#FFF" />
          </View>
        )}
        <View style={gridStyles.dateBadge}>
          <Text style={gridStyles.dateBadgeText}>{badge}</Text>
        </View>
        {selectionMode && (
          <View style={gridStyles.selectCircle}>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={24} color="#1A73E8" />
            ) : (
              <View style={gridStyles.selectCircleEmpty} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  },
);

export default function ArchiveScreen() {
  const router = useRouter();
  const { clinicId } = useAuth();
  const { isDark } = useTheme();
  const { prefs } = useClinicSettings(clinicId);

  const [items, setItems] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [archiveType, setArchiveType] = useState<ArchiveType>('stories');
  const [archiveMode, setArchiveMode] = useState<ArchiveMode>('grid');
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerStartIndex, setViewerStartIndex] = useState(0);
  const [viewerItems, setViewerItems] = useState<ArchiveItem[]>([]);

  // ========== Selection Mode ==========
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ========== Highlights ==========
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);

  // ========== Highlight Editor ==========
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);

  // ========== Header Menu (…) ==========
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);
  const menuOpacity = useRef(new Animated.Value(0)).current;
  const menuScale = useRef(new Animated.Value(0.96)).current;

  // ========== Micro-interaction Animations ==========
  const emptyFloatAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;
  const contentSlideAnim = useRef(new Animated.Value(20)).current;
  const modeIconScales = useRef<Record<string, Animated.Value>>({
    grid: new Animated.Value(1),
    highlights: new Animated.Value(1),
    calendar: new Animated.Value(1),
    map: new Animated.Value(1),
  }).current;
  const rowScales = useRef<Record<string, Animated.Value>>({
    stories: new Animated.Value(1),
    posts: new Animated.Value(1),
    reels: new Animated.Value(1),
  }).current;

  const openHeaderMenu = useCallback(() => {
    setHeaderMenuVisible(true);
    Animated.parallel([
      Animated.spring(menuOpacity, { toValue: 1, damping: 18, stiffness: 180, mass: 0.8, useNativeDriver: true }),
      Animated.spring(menuScale, { toValue: 1, damping: 18, stiffness: 180, mass: 0.8, useNativeDriver: true }),
    ]).start();
  }, [menuOpacity, menuScale]);

  const closeHeaderMenu = useCallback(() => {
    Animated.parallel([
      Animated.spring(menuOpacity, { toValue: 0, damping: 20, stiffness: 200, mass: 0.9, useNativeDriver: true }),
      Animated.spring(menuScale, { toValue: 0.96, damping: 20, stiffness: 200, mass: 0.9, useNativeDriver: true }),
    ]).start(() => {
      setHeaderMenuVisible(false);
      menuScale.setValue(0.96);
    });
  }, [menuOpacity, menuScale]);

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

  // ========== Load Highlights ==========
  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    (async () => {
      setHighlightsLoading(true);
      try {
        const data = await fetchHighlights(clinicId);
        if (!cancelled) setHighlights(data);
      } catch (err) {
        console.error('Error loading highlights:', err);
      } finally {
        if (!cancelled) setHighlightsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clinicId]);

  // ========== Filtered Data ==========
  const filtered = useMemo(() => {
    switch (archiveType) {
      case 'stories':
        return items.filter((i) => i.expiresAt > 0);
      case 'posts':
        return items.filter((i) => i.type === 'image' && i.expiresAt === 0);
      case 'reels':
        return items.filter((i) => i.type === 'video' && i.expiresAt === 0);
    }
  }, [items, archiveType]);

  // ========== Grouped Data ==========
  const flatData = useMemo(() => groupByDate(filtered), [filtered]);

  // ========== Theme Colors ==========
  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const textColor = isDark ? '#F0F2F5' : '#1A2B3F';
  const subtextColor = isDark ? '#8A96A6' : '#7A8A9C';
  const accentColor = isDark ? '#60A5FA' : '#1A73E8';
  const borderColor = isDark ? '#1E293B' : '#E8ECF0';

  // ========== Empty State Float Loop ==========
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.spring(emptyFloatAnim, { toValue: 1, damping: 8, stiffness: 12, mass: 1, useNativeDriver: true }),
        Animated.spring(emptyFloatAnim, { toValue: 0, damping: 8, stiffness: 12, mass: 1, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [emptyFloatAnim]);

  const emptyFloatTranslateY = useMemo(
    () => emptyFloatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -14] }),
    [emptyFloatAnim],
  );
  const emptyFloatOpacity = useMemo(
    () => emptyFloatAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 1, 0.5] }),
    [emptyFloatAnim],
  );

  // ========== Content Fade on Mode Switch ==========
  useEffect(() => {
    contentFadeAnim.setValue(0);
    contentSlideAnim.setValue(20);
    Animated.parallel([
      Animated.spring(contentFadeAnim, { toValue: 1, damping: 20, stiffness: 180, mass: 0.8, useNativeDriver: true }),
      Animated.spring(contentSlideAnim, { toValue: 0, damping: 20, stiffness: 180, mass: 0.8, useNativeDriver: true }),
    ]).start();
  }, [archiveMode, archiveType, contentFadeAnim, contentSlideAnim]);

  // ========== Mode Icon Press Feedback ==========
  const handleModePress = useCallback((mode: ArchiveMode) => {
    const iconAnim = modeIconScales[mode];
    Animated.sequence([
      Animated.spring(iconAnim, { toValue: 0.92, damping: 20, stiffness: 400, mass: 0.6, useNativeDriver: true }),
      Animated.spring(iconAnim, { toValue: 1.08, damping: 14, stiffness: 300, mass: 0.6, useNativeDriver: true }),
      Animated.spring(iconAnim, { toValue: 1, damping: 16, stiffness: 260, mass: 0.6, useNativeDriver: true }),
    ]).start();
    setArchiveMode(mode);
  }, [modeIconScales]);

  // ========== Animated Dropdown ==========
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;

  // ========== Global Screen Animation Driver ==========
  const screenAnim = useRef(new Animated.Value(0)).current;

  const screenContentTranslateY = useMemo(
    () => screenAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 6] }),
    [screenAnim],
  );
  const screenContentScale = useMemo(
    () => screenAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.985] }),
    [screenAnim],
  );

  const toggleSelector = useCallback(() => {
    const opening = !selectorVisible;
    const toValue = opening ? 1 : 0;
    if (opening) setSelectorVisible(true);
    Animated.parallel([
      Animated.spring(dropdownAnim, {
        toValue,
        damping: 20,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: false,
      }),
      Animated.spring(chevronAnim, {
        toValue,
        damping: 20,
        stiffness: 180,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(screenAnim, {
        toValue,
        damping: 22,
        stiffness: 160,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (!opening) {
        requestAnimationFrame(() => setSelectorVisible(false));
      }
    });
  }, [selectorVisible, dropdownAnim, chevronAnim, screenAnim]);

  const closeSelector = useCallback(() => {
    if (!selectorVisible) return;
    Animated.parallel([
      Animated.spring(dropdownAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 200,
        mass: 0.9,
        useNativeDriver: false,
      }),
      Animated.spring(chevronAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 200,
        mass: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(screenAnim, {
        toValue: 0,
        damping: 24,
        stiffness: 180,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start(() => {
      requestAnimationFrame(() => setSelectorVisible(false));
    });
  }, [selectorVisible, dropdownAnim, chevronAnim, screenAnim]);

  const selectType = useCallback((type: ArchiveType) => {
    setArchiveType(type);
    setArchiveMode('grid');
    setSelectionMode(false);
    setSelectedIds(new Set());
    setViewerItems([]);
    closeSelector();
  }, [closeSelector]);

  const chevronRotate = useMemo(
    () => chevronAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
    [chevronAnim],
  );

  const dropdownHeight = useMemo(
    () => dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 156], extrapolate: 'clamp' }),
    [dropdownAnim],
  );

  const dropdownOpacity = useMemo(
    () => dropdownAnim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 0.7, 1], extrapolate: 'clamp' }),
    [dropdownAnim],
  );

  const dropdownSlideY = useMemo(
    () => dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-18, 0], extrapolate: 'clamp' }),
    [dropdownAnim],
  );

  const handleRowPressIn = useCallback((type: string) => {
    Animated.spring(rowScales[type], { toValue: 0.96, damping: 20, stiffness: 400, mass: 0.6, useNativeDriver: true }).start();
  }, [rowScales]);

  const handleRowPressOut = useCallback((type: string) => {
    Animated.spring(rowScales[type], { toValue: 1, damping: 16, stiffness: 300, mass: 0.6, useNativeDriver: true }).start();
  }, [rowScales]);

  // ========== Render ==========
  const handleItemPress = useCallback(
    (item: ArchiveItem) => {
      if (selectionMode) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(item.id)) next.delete(item.id);
          else next.add(item.id);
          return next;
        });
        return;
      }
      const source = viewerItems.length > 0 ? viewerItems : filtered;
      const idx = source.findIndex((i) => i.id === item.id);
      setViewerStartIndex(idx >= 0 ? idx : 0);
      setViewerVisible(true);
    },
    [filtered, selectionMode, viewerItems],
  );

  const renderRow = useCallback(
    ({ item }: { item: FlatRow }) => {
      if (item.type === 'header') {
        return (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateHeaderText, { color: textColor }]}>{item.label}</Text>
          </View>
        );
      }
      return (
        <View style={styles.gridRow}>
          {item.items.map((archiveItem) => (
            <ArchiveTile
              key={archiveItem.id}
              item={archiveItem}
              onPress={() => handleItemPress(archiveItem)}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(archiveItem.id)}
            />
          ))}
        </View>
      );
    },
    [handleItemPress, textColor, selectionMode, selectedIds],
  );

  // ========== Selection Helpers ==========
  const enterSelectionMode = useCallback(() => {
    if (archiveType !== 'stories') return;
    setSelectionMode(true);
    setSelectedIds(new Set());
    setArchiveMode('grid');
  }, [archiveType]);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleCreateHighlight = useCallback(() => {
    if (selectedIds.size === 0) {
      Alert.alert('Select Stories', 'Please select at least one story.');
      return;
    }
    if (Platform.OS === 'ios') {
      Alert.prompt('Highlight Name', 'Enter a name for this highlight', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async (name) => {
            if (!name?.trim() || !clinicId) return;
            const ids = Array.from(selectedIds);
            const coverItem = items.find((i) => ids.includes(i.id));
            const coverUrl = coverItem?.thumbnailUrl || coverItem?.mediaUrl || '';
            await createHighlight(clinicId, name.trim(), coverUrl, ids);
            const updated = await fetchHighlights(clinicId);
            setHighlights(updated);
            exitSelectionMode();
            setArchiveMode('highlights');
          },
        },
      ]);
    } else {
      setAndroidNamePrompt(true);
    }
  }, [selectedIds, clinicId, items, exitSelectionMode]);

  // Android Name Prompt state
  const [androidNamePrompt, setAndroidNamePrompt] = useState(false);
  const [androidNameValue, setAndroidNameValue] = useState('');

  const handleAndroidCreate = useCallback(async () => {
    if (!androidNameValue.trim() || !clinicId) return;
    const ids = Array.from(selectedIds);
    const coverItem = items.find((i) => ids.includes(i.id));
    const coverUrl = coverItem?.thumbnailUrl || coverItem?.mediaUrl || '';
    await createHighlight(clinicId, androidNameValue.trim(), coverUrl, ids);
    const updated = await fetchHighlights(clinicId);
    setHighlights(updated);
    setAndroidNamePrompt(false);
    setAndroidNameValue('');
    exitSelectionMode();
    setArchiveMode('highlights');
  }, [androidNameValue, clinicId, selectedIds, items, exitSelectionMode]);

  // Tap Highlight → open viewer with only those stories
  const handleHighlightPress = useCallback(
    (highlight: Highlight) => {
      const hlItems = highlight.storyIds
        .map((sid) => items.find((i) => i.id === sid))
        .filter(Boolean) as ArchiveItem[];
      if (hlItems.length === 0) {
        Alert.alert('Empty', 'No stories found for this highlight.');
        return;
      }
      setViewerItems(hlItems);
      setViewerStartIndex(0);
      setViewerVisible(true);
    },
    [items],
  );

  // Calendar day tap → open viewer with that day’s items
  const handleCalendarDayPress = useCallback(
    (dayItems: ArchiveItem[]) => {
      if (dayItems.length === 0) return;
      setViewerItems(dayItems);
      setViewerStartIndex(0);
      setViewerVisible(true);
    },
    [],
  );

  // Long press → open editor
  const handleHighlightLongPress = useCallback((hl: Highlight) => {
    setEditingHighlight(hl);
    setEditorVisible(true);
  }, []);

  const handleEditorSave = useCallback(
    async (data: { name: string; coverUrl: string; storyIds: string[] }) => {
      if (!clinicId || !editingHighlight) return;
      await updateHighlight(clinicId, editingHighlight.id, data);
      const updated = await fetchHighlights(clinicId);
      setHighlights(updated);
      setEditorVisible(false);
      setEditingHighlight(null);
    },
    [clinicId, editingHighlight],
  );

  const handleEditorDelete = useCallback(async () => {
    if (!clinicId || !editingHighlight) return;
    await deleteHighlight(clinicId, editingHighlight.id);
    const updated = await fetchHighlights(clinicId);
    setHighlights(updated);
    setEditorVisible(false);
    setEditingHighlight(null);
  }, [clinicId, editingHighlight]);

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>  
      <PremiumGradientBackground isDark={isDark} showSparkles={false} screenAnim={screenAnim} />
      <Animated.View style={{ flex: 1, transform: [{ translateY: screenContentTranslateY }, { scale: screenContentScale }] }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: borderColor }]}>  
        <TouchableOpacity onPress={() => router.back()} style={styles.headerSide}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleSelector} style={styles.dropdownBtn} activeOpacity={0.7}>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {ARCHIVE_TYPE_LABELS[archiveType]}
          </Text>
          <Animated.View style={{ marginLeft: 4, transform: [{ rotate: chevronRotate }] }}>
            <Ionicons name="chevron-down" size={18} color={textColor} />
          </Animated.View>
        </TouchableOpacity>
        {archiveType === 'stories' ? (
          <TouchableOpacity style={styles.headerSide} onPress={openHeaderMenu}>
            <Ionicons name="ellipsis-horizontal" size={22} color={textColor} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSide} />
        )}
      </View>

      {/* Header Menu (top-right floating) — stories only */}
      {archiveType === 'stories' && headerMenuVisible && (
        <>
          <TouchableWithoutFeedback onPress={closeHeaderMenu}>
            <View style={styles.headerMenuBackdrop} />
          </TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.headerMenu,
              {
                opacity: menuOpacity,
                transform: [{ scale: menuScale }],
              },
            ]}
          >
            <BlurView
              intensity={70}
              tint={isDark ? 'dark' : 'light'}
              style={styles.headerMenuBlur}
            >
              <View style={[
                styles.headerMenuInner,
                {
                  backgroundColor: isDark ? 'rgba(30,41,59,0.65)' : 'rgba(255,255,255,0.60)',
                  borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.40)',
                },
              ]}>
                <TouchableOpacity
                  style={styles.headerMenuItem}
                  activeOpacity={0.7}
                  onPress={() => { closeHeaderMenu(); enterSelectionMode(); }}
                >
                  <Ionicons name="checkbox-outline" size={18} color={textColor} />
                  <Text style={[styles.headerMenuText, { color: textColor }]}>Select stories</Text>
                </TouchableOpacity>
                <View style={[styles.headerMenuDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]} />
                <TouchableOpacity
                  style={styles.headerMenuItem}
                  activeOpacity={0.7}
                  onPress={() => { closeHeaderMenu(); router.push('/clinic/archive-settings'); }}
                >
                  <Ionicons name="settings-outline" size={18} color={textColor} />
                  <Text style={[styles.headerMenuText, { color: textColor }]}>Archive settings</Text>
                </TouchableOpacity>
              </View>
            </BlurView>
          </Animated.View>
        </>
      )}

      {/* Animated Dropdown */}
      <Animated.View
        style={[
          styles.dropdown,
          {
            height: dropdownHeight,
            opacity: dropdownOpacity,
            backgroundColor: 'transparent',
            borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          },
        ]}
        pointerEvents={selectorVisible ? 'auto' : 'none'}
      >
        <Animated.View style={[styles.dropdownInner, { transform: [{ translateY: dropdownSlideY }] }]}>
          {(['stories', 'posts', 'reels'] as ArchiveType[]).map((type) => {
            const isActive = archiveType === type;
            return (
              <Animated.View key={type} style={{ transform: [{ scale: rowScales[type] }] }}>
                <TouchableOpacity
                  style={[
                    styles.dropdownRow,
                    isActive && {
                      backgroundColor: isDark ? 'rgba(96,165,250,0.10)' : 'rgba(37,99,235,0.08)',
                      borderRadius: 12,
                      marginHorizontal: 12,
                    },
                  ]}
                  onPress={() => selectType(type)}
                  onPressIn={() => handleRowPressIn(type)}
                  onPressOut={() => handleRowPressOut(type)}
                  activeOpacity={0.8}
                >
                  <View style={styles.dropdownSpacer} />
                  <View style={styles.dropdownCenter}>
                    <Text style={[
                      styles.dropdownText,
                      { color: isActive
                        ? (isDark ? '#60A5FA' : '#2563EB')
                        : (isDark ? 'rgba(240,242,245,0.7)' : 'rgba(15,23,42,0.65)')
                      },
                      isActive && styles.dropdownTextActive,
                    ]}>
                      {ARCHIVE_TYPE_LABELS[type]}
                    </Text>
                  </View>
                  <View style={styles.dropdownCheckArea}>
                    {isActive && (
                      <View style={styles.dropdownCheckCircle}>
                        <Ionicons name="checkmark" size={14} color={isDark ? '#60A5FA' : '#2563EB'} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>
      </Animated.View>

      {/* Backdrop (dismiss dropdown) */}
      <TouchableWithoutFeedback onPress={closeSelector}>
        <View style={[styles.dropdownBackdrop, { pointerEvents: selectorVisible ? 'auto' : 'none' }]} />
      </TouchableWithoutFeedback>

      {/* Mode Bar — stories only */}
      {archiveType === 'stories' && (
        <View style={[styles.modeBar, { borderBottomColor: borderColor }]}>
          {([
            { mode: 'grid' as ArchiveMode, icon: 'grid-outline', iconActive: 'grid' },
            { mode: 'highlights' as ArchiveMode, icon: 'star-outline', iconActive: 'star' },
            { mode: 'calendar' as ArchiveMode, icon: 'calendar-outline', iconActive: 'calendar' },
            { mode: 'map' as ArchiveMode, icon: 'location-outline', iconActive: 'location' },
          ]).map(({ mode, icon, iconActive }) => (
            <TouchableOpacity
              key={mode}
              style={styles.modeBtn}
              onPress={() => handleModePress(mode)}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: modeIconScales[mode] }] }}>
                <Ionicons
                  name={(archiveMode === mode ? iconActive : icon) as typeof Ionicons.defaultProps.name}
                  size={24}
                  color={archiveMode === mode ? accentColor : subtextColor}
                />
              </Animated.View>
              {archiveMode === mode && <View style={[styles.modeIndicator, { backgroundColor: accentColor }]} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Content — posts/reels always grid, stories respect archiveMode */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={accentColor} />
        </View>
      ) : (archiveType !== 'stories' || archiveMode === 'grid') ? (
        // ========== GRID MODE ==========
        filtered.length === 0 ? (
          <Animated.View style={[styles.emptyCenter, { transform: [{ translateY: emptyFloatTranslateY }], opacity: emptyFloatOpacity }]}>
            <Ionicons name="archive-outline" size={48} color={subtextColor} />
            <Text style={[styles.emptyText, { color: subtextColor }]}>No archived items</Text>
          </Animated.View>
        ) : (
          <Animated.View style={{ flex: 1, opacity: contentFadeAnim, transform: [{ translateY: contentSlideAnim }] }}>
            <FlatList
              data={flatData}
              renderItem={renderRow}
              keyExtractor={(item) => item.key}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              removeClippedSubviews={Platform.OS === 'android'}
            />
          </Animated.View>
        )
      ) : archiveMode === 'highlights' ? (
        // ========== HIGHLIGHTS MODE ==========
        <Animated.View style={[styles.placeholderContainer, { opacity: contentFadeAnim, transform: [{ translateY: contentSlideAnim }] }]}>
          {/* Highlights Row */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.highlightsRow}
          >
            {/* Create New Highlight */}
            <TouchableOpacity
              style={styles.highlightItem}
              activeOpacity={0.7}
              onPress={enterSelectionMode}
            >
              <View style={[styles.highlightCircle, { borderColor: accentColor }]}>
                <Ionicons name="add" size={30} color={accentColor} />
              </View>
              <Text style={[styles.highlightLabel, { color: textColor }]} numberOfLines={1}>New</Text>
            </TouchableOpacity>

            {/* Real Highlights */}
            {highlights.map((hl) => (
              <TouchableOpacity
                key={hl.id}
                style={styles.highlightItem}
                activeOpacity={0.7}
                onPress={() => handleHighlightPress(hl)}
                onLongPress={() => handleHighlightLongPress(hl)}
                delayLongPress={400}
              >
                <View style={[styles.highlightCircleSolid, { borderColor: accentColor }]}>
                  {hl.coverUrl ? (
                    <Image
                      source={{ uri: hl.coverUrl }}
                      style={styles.highlightCoverImage}
                      contentFit="cover"
                    />
                  ) : (
                    <Ionicons name="images-outline" size={28} color={subtextColor} />
                  )}
                </View>
                <Text style={[styles.highlightLabel, { color: textColor }]} numberOfLines={1}>{hl.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Divider */}
          <View style={[styles.highlightDivider, { backgroundColor: borderColor }]} />

          {/* Empty State (only when no highlights) */}
          {highlights.length === 0 && (
            <View style={styles.highlightEmpty}>
              <View style={[styles.highlightEmptyIcon, { borderColor: subtextColor }]}>
                <Ionicons name="heart-outline" size={36} color={subtextColor} />
              </View>
              <Text style={[styles.highlightEmptyTitle, { color: textColor }]}>Story Highlights</Text>
              <Text style={[styles.highlightEmptyDesc, { color: subtextColor }]}>
                Keep your favorite stories on your profile
              </Text>
            </View>
          )}
        </Animated.View>
      ) : archiveMode === 'calendar' ? (
        // ========== CALENDAR MODE ==========
        <Animated.View style={[styles.calendarWrapper, { opacity: contentFadeAnim, transform: [{ translateY: contentSlideAnim }] }]}>
          <ArchiveCalendarView
            items={filtered}
            isDark={isDark}
            textColor={textColor}
            subtextColor={subtextColor}
            accentColor={accentColor}
            onDayPress={handleCalendarDayPress}
          />
        </Animated.View>
      ) : (
        // ========== MAP PLACEHOLDER ==========
        <Animated.View style={[styles.emptyCenter, { transform: [{ translateY: emptyFloatTranslateY }], opacity: emptyFloatOpacity }]}>
          <Ionicons name="location-outline" size={48} color={subtextColor} style={{ opacity: 0.5 }} />
          <Text style={[styles.emptyText, { color: subtextColor }]}>Map view coming soon</Text>
          <Text style={[styles.emptySubtext, { color: subtextColor }]}>Requires location data</Text>
        </Animated.View>
      )}

      {/* Selection Mode Bottom Bar */}
      {selectionMode && (
        <View style={[styles.selectionBar, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderTopColor: borderColor }]}>
          <TouchableOpacity onPress={exitSelectionMode} style={styles.selectionBarBtn}>
            <Text style={[styles.selectionBarBtnText, { color: subtextColor }]}>Cancel</Text>
          </TouchableOpacity>
          <Text style={[styles.selectionBarCount, { color: textColor }]}>
            {selectedIds.size} selected
          </Text>
          <TouchableOpacity
            onPress={handleCreateHighlight}
            style={[styles.selectionBarBtn, styles.selectionBarCreate, { backgroundColor: accentColor, opacity: selectedIds.size === 0 ? 0.5 : 1 }]}
          >
            <Text style={styles.selectionBarCreateText}>Create</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Android Name Prompt Modal */}
      {androidNamePrompt && (
        <View style={styles.androidPromptOverlay}>
          <View style={[styles.androidPromptBox, { backgroundColor: isDark ? '#1E293B' : '#FFF' }]}>
            <Text style={[styles.androidPromptTitle, { color: textColor }]}>Highlight Name</Text>
            <TextInput
              style={[styles.androidPromptInput, { color: textColor, borderColor: borderColor }]}
              placeholder="Enter a name"
              placeholderTextColor={subtextColor}
              value={androidNameValue}
              onChangeText={setAndroidNameValue}
              autoFocus
            />
            <View style={styles.androidPromptActions}>
              <TouchableOpacity onPress={() => { setAndroidNamePrompt(false); setAndroidNameValue(''); }}>
                <Text style={[styles.androidPromptBtn, { color: subtextColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAndroidCreate}>
                <Text style={[styles.androidPromptBtn, { color: accentColor }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      </Animated.View>

      {/* Highlight Editor */}
      <HighlightEditorModal
        visible={editorVisible}
        highlight={editingHighlight}
        allItems={items}
        isDark={isDark}
        onSave={handleEditorSave}
        onDelete={handleEditorDelete}
        onClose={() => { setEditorVisible(false); setEditingHighlight(null); }}
      />

      {/* Archive Viewer */}
      <ArchiveViewerModal
        visible={viewerVisible}
        items={viewerItems.length > 0 ? viewerItems : filtered}
        startIndex={viewerStartIndex}
        clinicId={clinicId || ''}
        prefs={prefs}
        onClose={() => { setViewerVisible(false); setViewerItems([]); }}
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
  headerSide: { width: 40, alignItems: 'center', justifyContent: 'center' },
  dropdownBtn: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  // Header Menu (…)
  headerMenuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
  },
  headerMenu: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 50,
    right: 12,
    borderRadius: 14,
    overflow: 'hidden',
    minWidth: 160,
    maxWidth: 200,
    zIndex: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 6,
  },
  headerMenuBlur: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  headerMenuInner: {
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 14,
  },
  headerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    minHeight: 40,
  },
  headerMenuText: { fontSize: 14, fontWeight: '500' },
  headerMenuDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: 10 },
  dropdown: {
    overflow: 'hidden',
    borderBottomWidth: 1,
    zIndex: 50,
  },
  dropdownInner: {
    paddingVertical: 6,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginVertical: 2,
  },
  dropdownSpacer: {
    width: 40,
  },
  dropdownCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dropdownCheckArea: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(37,99,235,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownText: { fontSize: 14, fontWeight: '600', letterSpacing: -0.2, lineHeight: 18, textAlign: 'center' },
  dropdownTextActive: { fontWeight: '700' },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
  },
  modeBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    zIndex: 1,
  },
  modeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  modeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  placeholderContainer: {
    flex: 1,
  },
  highlightsRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    gap: 20,
  },
  highlightItem: {
    alignItems: 'center',
    width: 76,
  },
  highlightCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  highlightDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  highlightEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 40,
  },
  highlightEmptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  highlightEmptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  highlightEmptyDesc: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
  },
  emptySubtext: { fontSize: 13, fontWeight: '400' },
  dateHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  dateHeaderText: { fontSize: 15, fontWeight: '600' },
  gridRow: {
    flexDirection: 'row',
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 60 },
  calendarWrapper: { flex: 1, paddingTop: 12 },
  emptyText: { fontSize: 15, fontWeight: '500' },
  listContent: { paddingTop: 12, paddingBottom: 32 },
  // Selection Bar
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 12,
    borderTopWidth: 1,
  },
  selectionBarBtn: { paddingVertical: 6, paddingHorizontal: 12 },
  selectionBarBtnText: { fontSize: 15, fontWeight: '500' },
  selectionBarCount: { fontSize: 15, fontWeight: '600' },
  selectionBarCreate: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 },
  selectionBarCreateText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  // Highlight cover
  highlightCircleSolid: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightCoverImage: { width: '100%', height: '100%' },
  // Android Prompt
  androidPromptOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  androidPromptBox: {
    width: '80%',
    borderRadius: 14,
    paddingVertical: 24,
    paddingHorizontal: 20,
    gap: 16,
  },
  androidPromptTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  androidPromptInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  androidPromptActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  androidPromptBtn: { fontSize: 16, fontWeight: '600' },
});

const gridStyles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#E8ECF0',
    overflow: 'hidden',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  dateBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  dateBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  selectCircle: {
    position: 'absolute',
    top: 6,
    left: 6,
  },
  selectCircleEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
});
