import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    Linking,
    Platform,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

import EmojiSticker from './EmojiSticker';
import GifPlaceholderSticker from './GifPlaceholderSticker';
import HashtagSticker from './HashtagSticker';
import LocationSticker from './LocationSticker';
import MentionSticker from './MentionSticker';
import MusicSticker from './MusicSticker';
import PollSticker from './PollSticker';
import TextSticker from './TextSticker';
import TimeStickerView from './TimeStickerView';
import WeatherSticker from './WeatherSticker';

interface StickerData {
  type: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  data: Record<string, any>;
}

interface Props {
  stickers?: StickerData[];
}

/* ─── Location sticker wrapper with press feedback + maps guard ─── */
function ViewerLocationSticker({
  data,
  onOpenMaps,
}: {
  data: Record<string, any>;
  onOpenMaps: (data: Record<string, any>) => void;
}) {
  const isLocked = data.isLocked === true;
  const pressAnim = useRef(new Animated.Value(1)).current;
  const [showHint, setShowHint] = useState(false);
  const hintShown = useRef(false);

  // L5.4 — Show micro-hint once per mount for unlocked stickers
  useEffect(() => {
    if (isLocked || hintShown.current) return;
    hintShown.current = true;
    setShowHint(true);
    const t = setTimeout(() => setShowHint(false), 2200);
    return () => clearTimeout(t);
  }, [isLocked]);

  const handlePressIn = useCallback(() => {
    if (isLocked) return;
    Animated.timing(pressAnim, {
      toValue: 0.96,
      duration: 80,
      useNativeDriver: true,
    }).start();
  }, [isLocked, pressAnim]);

  const handlePressOut = useCallback(() => {
    if (isLocked) return;
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();
  }, [isLocked, pressAnim]);

  return (
    <TouchableWithoutFeedback
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onOpenMaps(data)}
    >
      <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
        <View style={viewerLocationShadow}>
          <LocationSticker
            name={data.name || 'Location'}
            styleVariant={data.styleVariant}
          />
        </View>
        {/* L5.4 — Subtle hint for unlocked location */}
        {showHint && !isLocked && (
          <Text style={hintStyles.hint}>Tap to open maps</Text>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const hintStyles = StyleSheet.create({
  hint: {
    position: 'absolute',
    bottom: -18,
    alignSelf: 'center',
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.7)',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

/* L5.3 — Viewer-only shadow refinement for cleaner depth */
const viewerLocationShadow = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.28,
  shadowRadius: 10,
  elevation: 7,
} as const;

/** Read-only sticker canvas for story/archive viewers. No editing gestures. */
export default function ViewerStickerCanvas({ stickers }: Props) {
  // L5.2 — In-flight guard prevents double maps open
  const inFlight = useRef(false);

  const handleLocationTap = useCallback((data: Record<string, any>) => {
    if (data.isLocked === true) return;
    if (inFlight.current) return;

    const lat = data.lat;
    const lng = data.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') return;
    if (!isFinite(lat) || !isFinite(lng)) return;

    inFlight.current = true;

    const label = encodeURIComponent(data.name || 'Location');
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      default: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });

    Linking.openURL(url)
      .catch(() => {
        Alert.alert('Maps', 'Unable to open maps application.');
      })
      .finally(() => {
        // Reset after short delay to allow re-tap after returning
        setTimeout(() => { inFlight.current = false; }, 1500);
      });
  }, []);

  if (!stickers || stickers.length === 0) return null;

  return (
    <View style={styles.canvas} pointerEvents="box-none">
      {stickers.map((s, i) => (
        <View
          key={`vs-${i}`}
          style={[
            styles.sticker,
            {
              transform: [
                { translateX: s.x },
                { translateY: s.y },
                { scale: s.scale },
                { rotate: `${s.rotation}deg` },
              ],
            },
          ]}
          pointerEvents={s.type === 'location' ? 'auto' : 'none'}
        >
          {s.type === 'location' ? (
            <ViewerLocationSticker data={s.data} onOpenMaps={handleLocationTap} />
          ) : (
            renderSticker(s)
          )}
        </View>
      ))}
    </View>
  );
}

function renderSticker(s: StickerData): React.ReactNode {
  switch (s.type) {
    case 'text':
      return (
        <TextSticker
          text={s.data.text || 'Text'}
          color={s.data.color}
          backgroundColor={s.data.backgroundColor}
        />
      );
    case 'emoji':
      return <EmojiSticker emoji={s.data.emoji || '😊'} size={s.data.size} />;
    case 'time':
      return <TimeStickerView time={s.data.time} />;
    case 'weather':
      return <WeatherSticker temp={s.data.temp} condition={s.data.condition} />;
    case 'hashtag':
      return <HashtagSticker tag={s.data.tag || 'hashtag'} />;
    case 'mention':
      return <MentionSticker username={s.data.username || 'user'} />;
    case 'gif':
      return <GifPlaceholderSticker />;
    case 'poll':
      return (
        <PollSticker
          question={s.data.question}
          optionA={s.data.optionA}
          optionB={s.data.optionB}
        />
      );
    case 'music':
      return <MusicSticker title={s.data.title} artist={s.data.artist} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  canvas: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 90,
  },
  sticker: {
    position: 'absolute',
    alignSelf: 'center',
  },
});
