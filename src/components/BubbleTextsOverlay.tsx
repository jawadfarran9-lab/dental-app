import React from 'react';
import { Text, View } from 'react-native';
import { TextsDoc } from '@/src/services/chatImages';

function isWhitish(c?: string): boolean {
  if (!c) return false;
  let r: number, g: number, b: number;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(c);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  } else if (rgb) {
    r = parseInt(rgb[1], 10);
    g = parseInt(rgb[2], 10);
    b = parseInt(rgb[3], 10);
  } else {
    return false;
  }
  const min = Math.min(r, g, b), max = Math.max(r, g, b);
  return min >= 220 && (max - min) <= 18;
}

function parseRGB(c?: string): [number, number, number] | null {
  if (!c) return null;
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(c);
  if (rgb) return [parseInt(rgb[1], 10), parseInt(rgb[2], 10), parseInt(rgb[3], 10)];
  return null;
}
function lightenColor(c: string, f: number): string {
  const p = parseRGB(c);
  if (!p) return c;
  const [r, g, b] = p;
  const l = (v: number) => Math.round(v + (255 - v) * f);
  return `rgb(${l(r)}, ${l(g)}, ${l(b)})`;
}

export function TextsOverlay({ items, bW, bH, offX, offY }: {
  items?: TextsDoc['items'];
  bW: number; bH: number; offX: number; offY: number;
}) {
  if (!items || items.length === 0) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: offX, top: offY, width: bW, height: bH, justifyContent: 'center', alignItems: 'center' }}>
      {items.map((t, i) => {
        const fs = bW * t.size;
        const isWhiteColor = isWhitish(t.color);
        const eff = t.bg === 'none' ? t.color : (t.bg === 'dim' || t.bg === 'white') ? (isWhiteColor ? '#000000' : t.color) : (t.bg === 'black' ? (isWhiteColor ? '#FFFFFF' : t.color) : '#000000');
        const bg = t.bg === 'white' ? '#FFFFFF' : t.bg === 'dim' ? (isWhiteColor ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') : t.bg === 'black' ? (isWhiteColor ? '#000000' : lightenColor(t.color, 0.6)) : 'transparent';
        return (
          <View key={`t_${i}`} style={{
            position: 'absolute',
            maxWidth: bW,
            transform: [{ translateX: (t.nx - 0.5) * bW }, { translateY: (t.ny - 0.5) * bH }, { rotate: `${t.rot}rad` }] as any,
            borderRadius: 12,
            paddingHorizontal: t.bg === 'none' ? 0 : fs * 0.44,
            paddingVertical: t.bg === 'none' ? 0 : fs * 0.19,
            backgroundColor: bg,
          }}>
            <Text style={{ fontSize: fs, fontWeight: '700', textAlign: t.align, fontFamily: t.font, color: eff, textShadowColor: t.bg === 'none' ? 'rgba(0,0,0,0.35)' : 'transparent', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }}>{t.text}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function BubbleTextsOverlay({ items, mediaW, mediaH, boxW, boxH, radius }: {
  items?: TextsDoc['items'];
  mediaW?: number | null; mediaH?: number | null; boxW: number; boxH: number; radius: number;
}) {
  if (!items || items.length === 0) return null;
  const a = mediaW && mediaH ? mediaW / mediaH : boxW / boxH;
  const boxA = boxW / boxH;
  let cw = boxW, ch = boxH;
  if (a >= boxA) { ch = boxH; cw = boxH * a; } else { cw = boxW; ch = boxW / a; }
  const ox = (boxW - cw) / 2;
  const oy = (boxH - ch) / 2;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: boxW, height: boxH, borderRadius: radius, overflow: 'hidden' }}>
      <TextsOverlay items={items} bW={cw} bH={ch} offX={ox} offY={oy} />
    </View>
  );
}
