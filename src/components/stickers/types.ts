/** Unified sticker data model shared by editor, publisher, and viewer. */

export type StickerType =
  | 'location'
  | 'text'
  | 'emoji'
  | 'time'
  | 'weather'
  | 'hashtag'
  | 'mention'
  | 'gif'
  | 'poll'
  | 'music';

export interface StickerItem {
  id: string;
  type: StickerType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  /** Type-specific payload — shape depends on `type`. */
  data: Record<string, any>;
}

/** Serialisable snapshot for Firestore / viewer replay. */
export interface StickerSnapshot {
  type: StickerType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  data: Record<string, any>;
}

/** Convert runtime items to Firestore-safe array. */
export function stickersToSnapshots(items: StickerItem[]): StickerSnapshot[] {
  return items.map(({ type, x, y, scale, rotation, data }) => ({
    type,
    x,
    y,
    scale,
    rotation,
    data,
  }));
}
