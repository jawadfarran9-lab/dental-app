import { type MediaAsset } from '@/src/hooks/useDeviceMedia';
import { getTemplateByIdSync } from '@/src/services/templatesService';
import { resolveMediaToOwnedFile } from '@/src/utils/mediaCopy';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TemplateSlotsScreenProps {
  templateId?: string;
  selectedMedia?: string;
  onClose?: () => void;
}

const TemplateSlotsScreen: React.FC<TemplateSlotsScreenProps> = ({ templateId, selectedMedia, onClose }) => {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const bottomPadding = insets.bottom || 16;
  const router = useRouter();

  const template = getTemplateByIdSync(templateId ?? '') ?? getTemplateByIdSync('1')!;

  const mediaItems: MediaAsset[] = useMemo(() => {
    if (!selectedMedia) return [];
    try {
      return JSON.parse(selectedMedia);
    } catch {
      return [];
    }
  }, [selectedMedia]);

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  const handleNext = async () => {
    const segments: { uri: string; duration: number }[] = [];
    for (const item of mediaItems) {
      let playableUri = item.uri;
      if (item.mediaType === 'video') {
        playableUri = await resolveMediaToOwnedFile(item.id, item.uri, item.mediaType);
      }
      segments.push({ uri: playableUri, duration: item.duration ?? 0 });
    }
    console.log('[template] Resolved segments count:', segments.length);
    if (segments.length > 0) console.log('[template] First segment URI:', segments[0].uri);
    router.push({
      pathname: '/reels-edit' as any,
      params: {
        segments: JSON.stringify(segments),
        templateId,
      },
    });
  };

  const canProceed = mediaItems.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable style={styles.headerButton} onPress={handleClose} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>{template.title}</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Template preview */}
      <View style={styles.previewArea}>
        <ExpoImage source={{ uri: template.thumbnail }} style={styles.previewImage} contentFit="cover" />
        <View style={styles.previewOverlay}>
          <Ionicons name="play-circle-outline" size={48} color="rgba(255,255,255,0.7)" />
        </View>
      </View>

      {/* Slots section */}
      <View style={styles.slotsSection}>
        <Text style={styles.slotsLabel}>
          {mediaItems.length} of {template.durationSlots.length} clips added
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slotsScroll}
        >
          {template.durationSlots.map((duration, index) => {
            const media = mediaItems[index];
            return (
              <View key={index} style={styles.slot}>
                {media ? (
                  <>
                    <ExpoImage source={{ uri: media.uri }} style={styles.slotImage} contentFit="cover" />
                    <View style={styles.slotDurationBadge}>
                      <Text style={styles.slotDurationText}>{duration}s</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <Ionicons name="add" size={24} color="rgba(255,255,255,0.4)" />
                    <Text style={styles.slotEmptyDuration}>{duration}s</Text>
                  </>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Bottom button */}
      <View style={[styles.bottomArea, { paddingBottom: bottomPadding }]}>
        <Pressable
          style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
          onPress={canProceed ? handleNext : undefined}
        >
          <Text style={[styles.nextButtonText, !canProceed && styles.nextButtonTextDisabled]}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default TemplateSlotsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ---- Header ----
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
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
    textAlign: 'center',
  },

  // ---- Preview ----
  previewArea: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    backgroundColor: '#111',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  previewOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- Slots ----
  slotsSection: {
    paddingTop: 16,
    paddingBottom: 8,
  },
  slotsLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  slotsScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  slot: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    gap: 2,
  },
  slotImage: {
    ...StyleSheet.absoluteFillObject,
  },
  slotDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  slotDurationText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  slotEmptyDuration: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontWeight: '600',
  },

  // ---- Bottom ----
  bottomArea: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  nextButton: {
    backgroundColor: '#0095F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(0,149,246,0.35)',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  nextButtonTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
});
