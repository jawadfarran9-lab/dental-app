import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import DeleteZone from './DeleteZone';
import DraggableWrapper from './DraggableWrapper';
import EmojiSticker from './EmojiSticker';
import GifPlaceholderSticker from './GifPlaceholderSticker';
import HashtagSticker from './HashtagSticker';
import LocationSticker, { nextLocationStyle } from './LocationSticker';
import LockSelector from './LockSelector';
import MentionSticker from './MentionSticker';
import MusicSticker from './MusicSticker';
import PollSticker from './PollSticker';
import SnapGuides from './SnapGuides';
import StickerToolbar from './StickerToolbar';
import TextSticker from './TextSticker';
import TimeStickerView from './TimeStickerView';
import { StickerItem } from './types';
import WeatherSticker from './WeatherSticker';

/* ─── Memoised sticker views (S2.11) ─── */
const MemoLocation = React.memo(LocationSticker);
const MemoText = React.memo(TextSticker);
const MemoEmoji = React.memo(EmojiSticker);
const MemoTime = React.memo(TimeStickerView);
const MemoWeather = React.memo(WeatherSticker);
const MemoHashtag = React.memo(HashtagSticker);
const MemoMention = React.memo(MentionSticker);
const MemoGif = React.memo(GifPlaceholderSticker);
const MemoPoll = React.memo(PollSticker);
const MemoMusic = React.memo(MusicSticker);

interface Props {
  stickers: StickerItem[];
  activeStickerId: string | null;
  onTransformEnd: (
    id: string,
    updates: { x: number; y: number; scale: number; rotation: number },
  ) => void;
  onStickerTap?: (id: string) => void;
  onSelectSticker?: (id: string) => void;
  onDeleteSticker?: (id: string) => void;
  onDuplicateSticker?: (id: string) => void;
  onBringToFront?: (id: string) => void;
  onStickerLongPress?: (id: string) => void;
  onToggleStickerLock?: (id: string, locked: boolean) => void;
}

/** Renders all stickers wrapped in a drag/pinch/rotate container.
 *  S2: active selection, snap guides, delete zone, toolbar, perf memos. */
export default function StickerCanvas({
  stickers,
  activeStickerId,
  onTransformEnd,
  onStickerTap,
  onSelectSticker,
  onDeleteSticker,
  onDuplicateSticker,
  onBringToFront,
  onStickerLongPress,
  onToggleStickerLock,
}: Props) {
  /* ─── Snap guide state ─── */
  const [snapH, setSnapH] = useState<number | null>(null);
  const [snapV, setSnapV] = useState<number | null>(null);

  /* ─── Delete zone state ─── */
  const [isDragging, setIsDragging] = useState(false);
  const [isOverDeleteZone, setIsOverDeleteZone] = useState(false);

  /* ─── Lock selector state ─── */
  const [lockTarget, setLockTarget] = useState<{ id: string; x: number; y: number } | null>(null);

  /* ─── Ref-based activeId for stable callbacks (S2.11) ─── */
  const activeIdRef = useRef(activeStickerId);
  activeIdRef.current = activeStickerId;

  /* ─── Ref-based stickers lookup for type checks in callbacks ─── */
  const stickersRef = useRef(stickers);
  stickersRef.current = stickers;

  /** Direct-manipulation types: tap = action, no toolbar, no selection. */
  const isDirect = (id: string) =>
    stickersRef.current.find((s) => s.id === id)?.type === 'location';

  /* ─── Stable callbacks ─── */
  const handleTap = useCallback(
    (id: string) => {
      // Dismiss lock selector on any tap
      setLockTarget(null);

      if (isDirect(id)) {
        // Direct manipulation — always cycle style, never select
        onStickerTap?.(id);
        return;
      }
      if (activeIdRef.current === id) {
        // Already active → cycle style only, no re-select
        onStickerTap?.(id);
      } else {
        // Not active → select only, no style cycle
        onSelectSticker?.(id);
      }
    },
    [onStickerTap, onSelectSticker],
  );

  const handleSnap = useCallback((hY: number | null, vX: number | null) => {
    setSnapH(hY);
    setSnapV(vX);
  }, []);

  const handleLongPress = useCallback(
    (id: string) => {
      if (!isDirect(id)) return; // Only location stickers get lock selector
      const s = stickersRef.current.find((st) => st.id === id);
      if (!s) return;
      setLockTarget({ id, x: s.x, y: s.y });
      onStickerLongPress?.(id);
    },
    [onStickerLongPress],
  );

  const handleLockToggle = useCallback(
    (locked: boolean) => {
      if (!lockTarget) return;
      onToggleStickerLock?.(lockTarget.id, locked);
      setLockTarget(null);
    },
    [lockTarget, onToggleStickerLock],
  );

  const handleDragStart = useCallback((_id: string) => {
    setIsDragging(true);
    setLockTarget(null); // Dismiss lock selector on drag
  }, []);

  const handleDragEnd = useCallback((_id: string) => {
    setIsDragging(false);
    setIsOverDeleteZone(false);
  }, []);

  const handleDeleteZoneChange = useCallback(
    (_id: string, isOver: boolean) => {
      setIsOverDeleteZone(isOver);
    },
    [],
  );

  const handleDragDelete = useCallback(
    (id: string) => {
      onDeleteSticker?.(id);
      setIsDragging(false);
      setIsOverDeleteZone(false);
    },
    [onDeleteSticker],
  );

  /* ─── Toolbar actions ─── */
  const handleToolbarDelete = useCallback(() => {
    if (activeIdRef.current) onDeleteSticker?.(activeIdRef.current);
  }, [onDeleteSticker]);

  const handleToolbarDuplicate = useCallback(() => {
    if (activeIdRef.current) onDuplicateSticker?.(activeIdRef.current);
  }, [onDuplicateSticker]);

  const handleToolbarBringToFront = useCallback(() => {
    if (activeIdRef.current) onBringToFront?.(activeIdRef.current);
  }, [onBringToFront]);

  const showToolbar =
    activeStickerId !== null && !isDragging && !isDirect(activeStickerId);

  return (
    <View style={styles.canvas} pointerEvents="box-none">
      {stickers.map((s) => (
        <DraggableWrapper
          key={s.id}
          id={s.id}
          initialX={s.x}
          initialY={s.y}
          initialScale={s.scale}
          initialRotation={s.rotation}
          isActive={s.id === activeStickerId}
          onTransformEnd={onTransformEnd}
          onTap={handleTap}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDeleteZoneChange={handleDeleteZoneChange}
          onDelete={handleDragDelete}
          onSnap={handleSnap}
          onLongPress={handleLongPress}
        >
          {renderSticker(s)}
        </DraggableWrapper>
      ))}

      {/* S2.3 — Snap guide lines */}
      <SnapGuides hGuideY={snapH} vGuideX={snapV} />

      {/* S2.7 — Delete zone */}
      <DeleteZone visible={isDragging} isOver={isOverDeleteZone} />

      {/* S2.10 — Sticker toolbar */}
      {showToolbar && (
        <StickerToolbar
          onDelete={handleToolbarDelete}
          onDuplicate={handleToolbarDuplicate}
          onBringToFront={handleToolbarBringToFront}
        />
      )}

      {/* L2 — Lock selector (location sticker long-press) */}
      {lockTarget && (
        <LockSelector
          visible
          isLocked={
            stickers.find((s) => s.id === lockTarget.id)?.data.isLocked === true
          }
          onToggle={handleLockToggle}
          position={lockTarget}
        />
      )}
    </View>
  );
}

function renderSticker(s: StickerItem): React.ReactNode {
  switch (s.type) {
    case 'location':
      return (
        <MemoLocation
          name={s.data.name || 'Location'}
          styleVariant={s.data.styleVariant}
          isLocked={s.data.isLocked === true}
        />
      );
    case 'text':
      return (
        <MemoText
          text={s.data.text || 'Text'}
          color={s.data.color}
          backgroundColor={s.data.backgroundColor}
        />
      );
    case 'emoji':
      return <MemoEmoji emoji={s.data.emoji || '😊'} size={s.data.size} />;
    case 'time':
      return <MemoTime time={s.data.time} />;
    case 'weather':
      return (
        <MemoWeather temp={s.data.temp} condition={s.data.condition} />
      );
    case 'hashtag':
      return <MemoHashtag tag={s.data.tag || 'hashtag'} />;
    case 'mention':
      return <MemoMention username={s.data.username || 'user'} />;
    case 'gif':
      return <MemoGif />;
    case 'poll':
      return (
        <MemoPoll
          question={s.data.question}
          optionA={s.data.optionA}
          optionB={s.data.optionB}
        />
      );
    case 'music':
      return <MemoMusic title={s.data.title} artist={s.data.artist} />;
    default:
      return null;
  }
}

export { nextLocationStyle };

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
  },
});
