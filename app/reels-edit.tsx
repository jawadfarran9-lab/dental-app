import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Segment = { uri: string; duration: number; trimStart?: number; trimEnd?: number };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  },
  nextText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  /* ── State A: normal preview ── */
  normalPreview: {
    flex: 1,
    backgroundColor: '#111',
  },
  /* ── State B: raised edit mode ── */
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 100,
  },
  previewWrapper: {
    width: '85%',
    aspectRatio: 9 / 16,
    maxHeight: '55%',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 10,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '85%',
    marginTop: 8,
    marginBottom: 6,
  },
  controlsRight: {
    flexDirection: 'row',
    gap: 16,
  },
  timeText: {
    color: '#ccc',
    fontSize: 12,
  },
  timelineWrapper: {
    width: '90%',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  timelineLine: {
    width: 2,
    height: 60,
    backgroundColor: '#fff',
  },
  videoTrack: {
    flex: 1,
    height: 60,
    flexDirection: 'row',
  },
  segmentBar: {
    height: 60,
    backgroundColor: '#444',
  },
  segmentFirst: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  segmentLast: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    marginRight: 0,
  },
  segmentSeparator: {
    width: 2,
    height: '100%',
    backgroundColor: '#fff',
  },
  separatorHitbox: {
    width: 12,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playhead: {
    position: 'absolute',
    width: 2,
    height: 70,
    backgroundColor: '#fff',
    top: -5,
    zIndex: 10,
  },
  segmentEmpty: {
    flex: 1,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentEmptyText: {
    color: '#888',
    fontSize: 13,
  },
  track: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '85%',
    height: 40,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  trackText: {
    color: '#aaa',
    fontSize: 13,
  },
  /* ── Shared toolbar ── */
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#111',
    paddingTop: 12,
  },
  toolRowContent: {
    paddingHorizontal: 16,
    gap: 16,
    alignItems: 'center',
  },
  toolItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    paddingVertical: 4,
  },
  toolLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
  /* ── Transition bottom sheet ── */
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '80%',
    backgroundColor: '#111',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    zIndex: 30,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#555',
    alignSelf: 'center',
    marginVertical: 8,
    borderRadius: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 10,
    color: '#fff',
    fontSize: 14,
  },
  check: {
    marginLeft: 10,
    color: '#0af',
    fontSize: 18,
  },
  sheetTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sheetTabActive: {
    color: '#fff',
    fontWeight: '600',
    marginRight: 16,
    fontSize: 13,
  },
  sheetTab: {
    color: '#777',
    marginRight: 16,
    fontSize: 13,
  },
  sheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sheetGridItem: {
    width: '30%',
    height: 80,
    backgroundColor: '#333',
    borderRadius: 10,
    marginBottom: 12,
  },
});

export default function ReelsEditScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const params = useLocalSearchParams<{ segments?: string }>();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [selectedSeparatorIndex, setSelectedSeparatorIndex] = useState<number | null>(null);
  const segmentIndexRef = useRef(0);

  const player = useVideoPlayer(null, (p) => {
    p.loop = false;
    p.timeUpdateEventInterval = 0.1;
  });

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const previewPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 10,
      onPanResponderRelease: (_, g) => {
        if (g.dy < -50) setIsFullscreen(true);
        else if (g.dy > 50) setIsFullscreen(false);
      },
    }),
  ).current;

  const segments: Segment[] = useMemo(() => {
    try {
      return params.segments ? JSON.parse(params.segments) : [];
    } catch {
      return [];
    }
  }, [params.segments]);

  // Load source and autoplay on mount
  useEffect(() => {
    if (!player) return;
    if (!segments.length) return;
    const uri = segments[segmentIndexRef.current]?.uri;
    if (!uri) return;
    console.log('[reels-edit] initial load start');
    console.log('[reels-edit] initial uri:', uri);
    player.replaceAsync(uri).then(() => {
      console.log('[reels-edit] replaceAsync resolved');
      if (isPlaying) {
        console.log('[reels-edit] calling play after replaceAsync');
        player.play();
      }
    }).catch((err: any) => {
      console.log('[reels-edit] initial load failed:', err);
      console.log('[reels-edit] error message:', err?.message);
      console.log('[reels-edit] error details:', JSON.stringify(err, null, 2));
    });
  }, [player, segments]);

  // Time update listener
  useEffect(() => {
    const sub = player.addListener('timeUpdate', (payload) => {
      setCurrentTime(payload.currentTime);
    });
    return () => sub.remove();
  }, [player]);

  // Segment end listener — advance to next or loop back
  useEffect(() => {
    const sub = player.addListener('playToEnd', () => {
      const nextIndex = segmentIndexRef.current + 1;
      if (nextIndex < segments.length) {
        segmentIndexRef.current = nextIndex;
        setCurrentSegmentIndex(nextIndex);
        console.log('[reels-edit] segment advance start');
        console.log('[reels-edit] next uri:', segments[nextIndex].uri);
        player.replaceAsync(segments[nextIndex].uri).then(() => {
          console.log('[reels-edit] segment replaceAsync resolved');
          console.log('[reels-edit] segment play called');
          player.play();
        }).catch((err: any) => {
          console.log('[reels-edit] segment advance failed:', err);
          console.log('[reels-edit] segment error message:', err?.message);
          console.log('[reels-edit] segment error details:', JSON.stringify(err, null, 2));
        });
      } else {
        segmentIndexRef.current = 0;
        setCurrentSegmentIndex(0);
        setCurrentTime(0);
        setIsPlaying(false);
        player.replace(segments[0].uri);
      }
    });
    return () => sub.remove();
  }, [player, segments]);

  // Diagnostic: player status changes (loading, ready, error)
  useEffect(() => {
    const sub = player.addListener('statusChange', (payload) => {
      console.log('[reels-edit][statusChange] status:', payload.status, 'oldStatus:', payload.oldStatus);
      if (payload.error) {
        console.log('[reels-edit][statusChange] ERROR:', payload.error);
        console.log('[reels-edit][statusChange] error details:', JSON.stringify(payload.error, null, 2));
      }
    });
    return () => sub.remove();
  }, [player]);

  // Diagnostic: source loaded confirmation
  useEffect(() => {
    const sub = player.addListener('sourceLoad', (payload) => {
      console.log('[reels-edit][sourceLoad] duration:', payload.duration);
      console.log('[reels-edit][sourceLoad] videoTracks:', payload.availableVideoTracks?.length);
      console.log('[reels-edit][sourceLoad] audioTracks:', payload.availableAudioTracks?.length);
      console.log('[reels-edit][sourceLoad] source:', JSON.stringify(payload.videoSource));
    });
    return () => sub.remove();
  }, [player]);

  // Diagnostic: playback state changes
  useEffect(() => {
    const sub = player.addListener('playingChange', (payload) => {
      console.log('[reels-edit][playing] isPlaying:', payload.isPlaying, 'old:', payload.oldIsPlaying);
    });
    return () => sub.remove();
  }, [player]);

  const totalDuration = useMemo(
    () => segments.reduce((sum, s) => sum + (s.duration || 0), 0),
    [segments],
  );

  const elapsedBefore = useMemo(
    () => segments.slice(0, currentSegmentIndex).reduce((sum, s) => sum + (s.duration || 0), 0),
    [segments, currentSegmentIndex],
  );

  const displayTime = elapsedBefore + currentTime;

  const onSeparatorPress = (index: number) => {
    setSelectedSeparatorIndex(index);
    openSheet();
  };

  const videoElement = segments.length > 0 && segments[currentSegmentIndex]?.uri ? (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
      nativeControls={false}
    />
  ) : null;

  const toolbar = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.toolRowContent}
    >
      <View style={styles.toolItem}>
        <Ionicons name="text" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Text</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="happy-outline" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Sticker</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="musical-notes" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Audio</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="add-circle-outline" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Add Clips</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="sparkles-outline" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Effects</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="image-outline" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Photo</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="layers-outline" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Overlay</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="text-outline" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Captions</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="mic-outline" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Voice</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="color-filter-outline" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Filter</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="download-outline" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Import</Text>
      </View>
      <View style={styles.toolItem}>
        <Ionicons name="save-outline" size={20} color="#ccc" />
        <Text style={styles.toolLabel}>Save</Text>
      </View>
    </ScrollView>
  );

  const screenHeight = Dimensions.get('window').height;
  const sheetHidden = screenHeight;
  const sheetMid = screenHeight * 0.6;
  const sheetFull = screenHeight * 0.2;
  const sheetTranslateY = useRef(new Animated.Value(sheetHidden)).current;
  const sheetSnapRef = useRef(sheetHidden);

  const openSheet = () => {
    sheetSnapRef.current = sheetMid;
    Animated.spring(sheetTranslateY, { toValue: sheetMid, useNativeDriver: true }).start();
  };

  const closeSheet = () => {
    sheetSnapRef.current = sheetHidden;
    Animated.spring(sheetTranslateY, { toValue: sheetHidden, useNativeDriver: true }).start();
    setSelectedSeparatorIndex(null);
  };

  const sheetPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderMove: (_, g) => {
        const next = sheetSnapRef.current + g.dy;
        if (next >= sheetFull) {
          sheetTranslateY.setValue(next);
        }
      },
      onPanResponderRelease: (_, g) => {
        const current = sheetSnapRef.current + g.dy;
        let target: number;
        if (g.dy < -50) {
          target = sheetSnapRef.current === sheetMid ? sheetFull : sheetMid;
        } else if (g.dy > 50) {
          target = sheetSnapRef.current === sheetFull ? sheetMid : sheetHidden;
        } else {
          target = current < (sheetMid + sheetFull) / 2 ? sheetFull : sheetMid;
        }
        sheetSnapRef.current = target;
        Animated.spring(sheetTranslateY, { toValue: target, useNativeDriver: true }).start();
        if (target === sheetHidden) setSelectedSeparatorIndex(null);
      },
    }),
  ).current;

  const transitionPanel = selectedSeparatorIndex !== null && (
    <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetTranslateY }] }]} {...sheetPan.panHandlers}>
      {/* Handle */}
      <View style={styles.handle} />

      {/* Search row */}
      <View style={styles.searchRow}>
        <TextInput placeholder="Search..." placeholderTextColor="#666" style={styles.searchInput} />
        <Text style={styles.check}>✔</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sheetTabs}>
        {['AI transition', 'Trending', 'Classic', 'New', 'Camera', 'Blur', 'Basic', 'Mask', 'Slide', 'Glitch', 'Distortion', 'Light', 'Overlay'].map((tab, i) => (
          <Text key={tab} style={i === 0 ? styles.sheetTabActive : styles.sheetTab}>{tab}</Text>
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.sheetGrid}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} style={styles.sheetGridItem} />
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );

  /* ── STATE B: Raised / advanced edit mode ── */
  if (isFullscreen) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <Pressable style={styles.headerButton} onPress={() => setIsFullscreen(false)} hitSlop={12}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Edit</Text>
          <Pressable style={styles.headerButton} hitSlop={8}>
            <Text style={styles.nextText}>Next</Text>
          </Pressable>
        </View>

        {/* Content — static vertical flow */}
        <View style={styles.content}>
          {/* Preview */}
          <View style={styles.previewWrapper}>
            {videoElement}
          </View>

          {/* Controls row */}
          <View style={styles.controlsRow}>
            <Pressable onPress={() => {
              if (isPlaying) { player.pause(); } else { player.play(); }
              setIsPlaying(prev => !prev);
            }} hitSlop={8}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#fff" />
            </Pressable>
            <Text style={styles.timeText}>{formatTime(displayTime)} / {formatTime(totalDuration)}</Text>
            <View style={styles.controlsRight}>
              <Ionicons name="arrow-undo-outline" size={18} color="#fff" />
              <Ionicons name="arrow-redo-outline" size={18} color="#fff" />
            </View>
          </View>

          {/* Video track — proportional segment strip */}
          <View style={styles.timelineWrapper}>
            {/* Start line */}
            <View style={styles.timelineLine} />

            {/* Segments */}
            <View style={styles.videoTrack}>
              {segments.length > 0 ? (
                segments.map((seg, index) => {
                  const pct = totalDuration > 0 ? ((seg.duration || 1) / totalDuration) * 100 : 100;
                  return (
                    <React.Fragment key={index}>
                      <View
                        style={[
                          styles.segmentBar,
                          { width: `${pct}%` } as any,
                          index === 0 && styles.segmentFirst,
                          index === segments.length - 1 && styles.segmentLast,
                        ]}
                      />
                      {index < segments.length - 1 && (
                        <Pressable onPress={() => onSeparatorPress(index)} style={styles.separatorHitbox} hitSlop={10}>
                          <View style={styles.segmentSeparator} />
                        </Pressable>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <View style={styles.segmentEmpty}>
                  <Text style={styles.segmentEmptyText}>No segments</Text>
                </View>
              )}
            </View>

            {/* End line */}
            <View style={styles.timelineLine} />

            {/* Playhead */}
            {totalDuration > 0 && (
              <View
                style={[
                  styles.playhead,
                  { left: `${(displayTime / totalDuration) * 100}%` } as any,
                ]}
              />
            )}
          </View>

          {/* Audio track */}
          <View style={styles.track}>
            <Ionicons name="musical-notes" size={16} color="rgba(255,255,255,0.4)" />
            <Text style={styles.trackText}>Tap to add audio</Text>
          </View>

          {/* Text track */}
          <View style={styles.track}>
            <Ionicons name="text" size={16} color="rgba(255,255,255,0.4)" />
            <Text style={styles.trackText}>Tap to add text</Text>
          </View>
        </View>

        {/* Toolbar — absolute bottom */}
        <View style={[styles.bottomDock, { paddingBottom: insets.bottom || 16 }]}>
          {toolbar}
        </View>
        {transitionPanel}
      </View>
    );
  }

  /* ── STATE A: Normal screen ── */
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable style={styles.headerButton} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit</Text>
        <Pressable style={styles.headerButton} hitSlop={8}>
          <Text style={styles.nextText}>Next</Text>
        </Pressable>
      </View>

      {/* Full preview */}
      <View style={styles.normalPreview} {...previewPan.panHandlers}>
        {videoElement}
      </View>

      {/* Toolbar */}
      <View style={[styles.bottomDock, { paddingBottom: insets.bottom || 16 }]}>
        {toolbar}
      </View>
      {transitionPanel}
    </View>
  );
}
