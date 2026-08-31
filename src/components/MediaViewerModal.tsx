import { DismissViewerPage } from '@/src/components/DismissViewerPage';
import { BubbleTextsOverlay } from '@/src/components/BubbleTextsOverlay';
import { ViewerVideo } from '@/src/components/ViewerVideo';
import { ZoomableImage } from '@/src/components/ZoomableImage';
import { TextsDoc } from '@/src/services/chatImages';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export type ViewerPage = {
  url: string;
  width?: number;
  height?: number;
  msgId: string;
  mediaIndex?: number;
  videoUrl?: string;
  kind?: 'image' | 'video';
  drawing?: { vb: [number, number]; strokes: Array<{ color: string; width: number; d: string }> } | null;
  texts?: TextsDoc | null;
};

export type MediaViewerModalProps = {
  visible: boolean;
  pages: ViewerPage[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  title: (p: ViewerPage) => string;
  timeLabel: (p: ViewerPage) => string;
  ownSticker?: (p: ViewerPage) => string | null | undefined;
  otherSticker?: (p: ViewerPage) => string | null | undefined;
  onEditSticker?: (p: ViewerPage) => void;
  onShare?: (p: ViewerPage) => void;
  starred?: (p: ViewerPage) => boolean;
  onToggleStar?: (p: ViewerPage) => void;
  onDelete?: (p: ViewerPage) => void;
  stickerSheet?: React.ReactNode;
};

export default function MediaViewerModal(props: MediaViewerModalProps) {
  const {
    visible,
    pages,
    index,
    onIndexChange,
    onClose,
    title,
    timeLabel,
    ownSticker,
    otherSticker,
    onEditSticker,
    onShare,
    starred,
    onToggleStar,
    onDelete,
    stickerSheet,
  } = props;

  const insets = useSafeAreaInsets();
  const viewerListRef = useRef<FlatList<ViewerPage>>(null);
  const stripRef = useRef<ScrollView>(null);
  const [viewerZoomed, setViewerZoomed] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);

  useEffect(() => {
    if (visible) {
      setViewerZoomed(false);
      setScrubbing(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || pages.length <= 1) return;
    const SCREEN_W = Dimensions.get('window').width;
    const contentWidth = 32 + pages.length * 40 + (pages.length - 1) * 8;
    const maxX = Math.max(0, contentWidth - SCREEN_W);
    const targetX = Math.min(maxX, Math.max(0, 36 + index * 48 - SCREEN_W / 2));
    const t = setTimeout(() => {
      stripRef.current?.scrollTo({ x: targetX, animated: true });
    }, 60);
    return () => clearTimeout(t);
  }, [visible, index, pages.length]);

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {visible && pages.length > 0 ? (() => {
        const SCREEN_W = Dimensions.get('window').width;
        const SCREEN_H = Dimensions.get('window').height;
        const current = pages[index] ?? pages[0];
        const isVideo = current?.kind === 'video';
        const curOwn = current ? ownSticker?.(current) : undefined;
        const isStarred = current ? !!starred?.(current) : false;
        return (
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: '#000' }}>
              <FlatList
                ref={viewerListRef}
                data={pages}
                keyExtractor={(_, i) => `viewer_${i}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={index}
                scrollEnabled={!(viewerZoomed || scrubbing)}
                getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
                  onIndexChange(idx);
                  setViewerZoomed(false);
                }}
                renderItem={({ item: page, index: i }) => {
                  const own = ownSticker?.(page);
                  const other = otherSticker?.(page);
                  const isPageVideo = page.kind === 'video';
                  return (
                    <View style={[styles.viewerPage, { width: SCREEN_W }]}>
                      <DismissViewerPage onDismiss={onClose} disabled={viewerZoomed}>
                        {page.kind === 'video' && page.videoUrl ? (
                          <ViewerVideo uri={page.videoUrl} width={SCREEN_W} height={SCREEN_H} isActive={i === index} topInset={insets.top} bottomInset={insets.bottom} videoW={page.width} videoH={page.height} drawing={page.drawing} texts={page.texts} onScrubbingChange={setScrubbing} onZoomChange={setViewerZoomed} />
                        ) : (
                          <ZoomableImage uri={page.url} width={SCREEN_W} height={SCREEN_H} imgW={page.width} imgH={page.height} drawing={page.drawing} texts={page.texts} onZoomChange={setViewerZoomed} />
                        )}
                      </DismissViewerPage>
                      {!isPageVideo ? (
                        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
                          {own ? (
                            onEditSticker ? (
                              <Pressable onPress={() => onEditSticker(page)} hitSlop={8} style={[styles.viewerStickerLeft, { top: undefined, bottom: insets.bottom + 200, left: 20 }]}>
                                <Text style={styles.galStickerText}>{own}</Text>
                              </Pressable>
                            ) : (
                              <View style={[styles.viewerStickerLeft, { top: undefined, bottom: insets.bottom + 200, left: 20 }]}>
                                <Text style={styles.galStickerText}>{own}</Text>
                              </View>
                            )
                          ) : (
                            onEditSticker ? (
                              <Pressable onPress={() => onEditSticker(page)} hitSlop={8} style={[styles.viewerStickerLeft, { top: undefined, bottom: insets.bottom + 200, left: 20 }]}>
                                <Ionicons name="happy-outline" size={18} color="#1E6FD9" />
                              </Pressable>
                            ) : null
                          )}
                          {other ? (
                            <View style={[styles.viewerStickerRight, { top: undefined, bottom: insets.bottom + 200, right: 20 }]}>
                              <Text style={styles.galStickerText}>{other}</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </View>
                  );
                }}
              />
              <View style={[styles.viewerHeader, { top: insets.top + 8 }]} pointerEvents="box-none">
                <Pressable onPress={onClose} style={styles.viewerClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color="#FFFFFF" />
                </Pressable>
                <View style={styles.viewerWho}>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>
                    {current ? title(current) : ''}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 }}>
                    {current ? timeLabel(current) : ''}
                  </Text>
                </View>
                <View style={{ width: 40 }} />
              </View>
              {isVideo && onEditSticker && current && (
                <View style={[styles.viewerBottomActions, { bottom: insets.bottom + (isVideo ? 228 : 200) }]} pointerEvents="box-none">
                  <Pressable
                    onPress={() => onEditSticker(current)}
                    style={styles.viewerClose}
                    hitSlop={8}
                  >
                    {curOwn ? (
                      <Text style={{ fontSize: 22 }}>{curOwn}</Text>
                    ) : (
                      <Ionicons name="happy-outline" size={22} color="#FFFFFF" />
                    )}
                  </Pressable>
                </View>
              )}
              {pages.length > 1 && (
                <View style={[styles.viewerStrip, { bottom: insets.bottom + (isVideo ? 162 : 132) }]}>
                  <ScrollView
                    ref={stripRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.viewerStripContent}
                  >
                    {pages.map((thumb, i) => (
                      <Pressable
                        key={`thumb_${i}`}
                        onPress={() => {
                          onIndexChange(i);
                          viewerListRef.current?.scrollToIndex({ index: i, animated: true });
                        }}
                        style={[styles.viewerThumb, i === index && styles.viewerThumbActive]}
                      >
                        <Image source={{ uri: thumb.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                        {thumb.drawing && thumb.drawing.strokes.length > 0 ? (
                          <Svg pointerEvents="none" viewBox={`0 0 ${thumb.drawing.vb[0]} ${thumb.drawing.vb[1]}`} preserveAspectRatio="xMidYMid slice" style={StyleSheet.absoluteFill}>
                            {thumb.drawing.strokes.map((s, si) => (
                              <Path key={`td_${si}`} d={s.d} stroke={s.color} strokeWidth={s.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            ))}
                          </Svg>
                        ) : null}
                        <BubbleTextsOverlay items={thumb.texts?.items} mediaW={thumb.width} mediaH={thumb.height} boxW={40} boxH={54} radius={6} />
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
              <View style={[styles.viewerBar, { paddingBottom: insets.bottom + (isVideo ? 72 : 14) }]} pointerEvents="box-none">
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.92)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <View style={styles.viewerBarRow}>
                  {onShare && current && (
                    <Pressable onPress={() => onShare(current)} hitSlop={8} style={styles.viewerBarBtn}>
                      <View style={styles.viewerBarIcon}>
                        <Ionicons name="share-outline" size={24} color="#FFFFFF" />
                      </View>
                      <Text style={styles.viewerBarLabel}>Share</Text>
                    </Pressable>
                  )}
                  {onToggleStar && current && (
                    <Pressable onPress={() => onToggleStar(current)} hitSlop={8} style={styles.viewerBarBtn}>
                      <View style={[styles.viewerBarIcon, isStarred && styles.viewerBarIconStar]}>
                        <Ionicons name={isStarred ? 'star' : 'star-outline'} size={24} color={isStarred ? '#F5A623' : '#FFFFFF'} />
                      </View>
                      <Text style={styles.viewerBarLabel}>Star</Text>
                    </Pressable>
                  )}
                  {onDelete && current && (
                    <Pressable onPress={() => onDelete(current)} hitSlop={8} style={styles.viewerBarBtn}>
                      <View style={[styles.viewerBarIcon, styles.viewerBarIconDanger]}>
                        <Ionicons name="trash-outline" size={24} color="#FF8A80" />
                      </View>
                      <Text style={[styles.viewerBarLabel, styles.viewerBarLabelDanger]}>Delete</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
            {stickerSheet}
          </GestureHandlerRootView>
        );
      })() : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  viewerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    zIndex: 10,
  },
  viewerWho: {
    flex: 1,
    alignItems: 'center',
  },
  viewerPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerStrip: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  viewerStripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  viewerThumb: {
    width: 40,
    height: 54,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  viewerThumbActive: {
    borderColor: '#4DA3FF',
    backgroundColor: '#FFFFFF',
    padding: 2,
  },
  viewerBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 18 },
  viewerBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 40 },
  viewerBarBtn: { alignItems: 'center', justifyContent: 'center' },
  viewerBarIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  viewerBarIconStar: { backgroundColor: 'rgba(245,166,35,0.18)', borderColor: 'rgba(245,166,35,0.55)' },
  viewerBarIconDanger: { backgroundColor: 'rgba(239,68,68,0.16)', borderColor: 'rgba(239,68,68,0.5)' },
  viewerBarLabel: { fontSize: 11, marginTop: 7, color: '#FFFFFF', fontWeight: '600' },
  viewerBarLabelDanger: { color: '#FF8A80' },
  viewerBottomActions: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  galStickerText: { fontSize: 18 },
  viewerStickerRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
    opacity: 0.9,
  },
  viewerStickerLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});
