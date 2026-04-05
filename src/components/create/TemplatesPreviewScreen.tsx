import { useSavedItems } from '@/src/context/SavedItemsContext';
import { getTemplateByIdSync } from '@/src/services/templatesService';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TemplatesPreviewScreenProps {
  templateId?: string;
  onClose?: () => void;
}

const TemplatesPreviewScreen: React.FC<TemplatesPreviewScreenProps> = ({ templateId, onClose }) => {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const bottomPadding = insets.bottom || 16;
  const router = useRouter();

  const { toggleSaveTemplate, isTemplateSaved } = useSavedItems();
  const [menuVisible, setMenuVisible] = useState(false);

  const template = getTemplateByIdSync(templateId ?? '') ?? getTemplateByIdSync('1')!;
  const saved = isTemplateSaved(template.id);

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  const handleSave = useCallback(() => {
    toggleSaveTemplate(template.id);
    setMenuVisible(false);
  }, [template.id, toggleSaveTemplate]);

  const handleReport = useCallback(() => {
    setMenuVisible(false);
    Alert.alert('Report', 'Thanks for your feedback');
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable style={styles.headerButton} onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>
        <View style={styles.headerButton} />
        <Pressable style={styles.headerIcon} onPress={() => setMenuVisible((prev) => !prev)} hitSlop={10}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)} />
          <View style={[styles.menuContainer, { top: topPadding + 48 }]}>
            <Pressable style={styles.menuItem} onPress={handleSave}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color="#fff" />
              <Text style={styles.menuText}>{saved ? 'Unsave' : 'Save'}</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable style={styles.menuItem} onPress={handleReport}>
              <Ionicons name="flag-outline" size={16} color="#FF3B30" />
              <Text style={[styles.menuText, { color: '#FF3B30' }]}>Report</Text>
            </Pressable>
          </View>
        </>
      )}

      {/* Video Preview */}
      <View style={styles.previewArea}>
        <ExpoImage source={{ uri: template.thumbnail }} style={styles.previewImage} contentFit="cover" />
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle-outline" size={64} color="rgba(255,255,255,0.7)" />
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>{template.title}</Text>
        <Text style={styles.infoSubtitle}>Replace the clips with your own.</Text>
      </View>

      {/* Timeline Slots */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timelineScroll}
      >
        {template.durationSlots.map((duration, index) => (
          <View key={index} style={styles.slot}>
            <Ionicons name="add" size={22} color="rgba(255,255,255,0.5)" />
            <Text style={styles.slotDuration}>{duration}s</Text>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={[styles.bottomButtons, { paddingBottom: bottomPadding }]}>
        <Pressable style={styles.addMediaButton} onPress={() => router.push({ pathname: '/select-template-media' as any, params: { templateId, slots: String(template.durationSlots.length) } })}>
          <Ionicons name="images-outline" size={18} color="#fff" />
          <Text style={styles.addMediaText}>Add media</Text>
        </Pressable>
        <Pressable style={styles.nextButtonDisabled}>
          <Text style={styles.nextButtonText}>Next</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default TemplatesPreviewScreen;

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
    paddingBottom: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- Dropdown Menu ----
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  menuContainer: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    paddingVertical: 4,
    width: 140,
    zIndex: 11,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  menuText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 14,
  },

  // ---- Preview ----
  previewArea: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: '#111',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  playOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ---- Info ----
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  infoTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  infoSubtitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    marginTop: 4,
  },

  // ---- Timeline ----
  timelineScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 16,
  },
  slot: {
    width: 64,
    height: 64,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  slotDuration: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '600',
  },

  // ---- Bottom Buttons ----
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  addMediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  addMediaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  nextButtonDisabled: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,149,246,0.35)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextButtonText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '700',
  },
});
