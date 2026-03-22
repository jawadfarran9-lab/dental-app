import { ArchiveItem } from '@/src/services/archiveService';
import { Highlight } from '@/src/services/highlightsService';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_GAP = 3;
const NUM_COLS = 4;
const THUMB_SIZE = (SCREEN_WIDTH - 32 - THUMB_GAP * (NUM_COLS - 1)) / NUM_COLS;

interface Props {
  visible: boolean;
  highlight: Highlight | null;
  allItems: ArchiveItem[];
  isDark: boolean;
  onSave: (data: { name: string; coverUrl: string; storyIds: string[] }) => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function HighlightEditorModal({
  visible,
  highlight,
  allItems,
  isDark,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [name, setName] = useState('');
  const [storyIds, setStoryIds] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);

  // Sync state when highlight changes
  useEffect(() => {
    if (highlight) {
      setName(highlight.name);
      setStoryIds([...highlight.storyIds]);
      setCoverUrl(highlight.coverUrl);
      setCoverPickerOpen(false);
    }
  }, [highlight]);

  // Resolved story items (only those still in archive)
  const storyItems = useMemo(
    () =>
      storyIds
        .map((sid) => allItems.find((i) => i.id === sid))
        .filter(Boolean) as ArchiveItem[],
    [storyIds, allItems],
  );

  const textColor = isDark ? '#F0F2F5' : '#1A2B3F';
  const subtextColor = isDark ? '#8A96A6' : '#7A8A9C';
  const accentColor = isDark ? '#60A5FA' : '#1A73E8';
  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const cardColor = isDark ? '#1E293B' : '#F5F7FA';
  const borderColor = isDark ? '#1E293B' : '#E8ECF0';

  const removeStory = useCallback((id: string) => {
    setStoryIds((prev) => {
      const next = prev.filter((sid) => sid !== id);
      // If we removed the cover story, pick next available
      const removedItem = allItems.find((i) => i.id === id);
      const removedUrl = removedItem?.thumbnailUrl || removedItem?.mediaUrl || '';
      if (coverUrl === removedUrl && next.length > 0) {
        const firstItem = allItems.find((i) => i.id === next[0]);
        setCoverUrl(firstItem?.thumbnailUrl || firstItem?.mediaUrl || '');
      }
      if (next.length === 0) setCoverUrl('');
      return next;
    });
  }, [allItems, coverUrl]);

  const selectCover = useCallback((item: ArchiveItem) => {
    setCoverUrl(item.thumbnailUrl || item.mediaUrl);
    setCoverPickerOpen(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      Alert.alert('Name Required', 'Please enter a highlight name.');
      return;
    }
    if (storyIds.length === 0) {
      Alert.alert('No Stories', 'A highlight must have at least one story.');
      return;
    }
    onSave({ name: name.trim(), coverUrl, storyIds });
  }, [name, coverUrl, storyIds, onSave]);

  const handleDelete = useCallback(() => {
    Alert.alert('Delete Highlight', 'Are you sure you want to delete this highlight?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
    ]);
  }, [onDelete]);

  if (!highlight) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={[s.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={onClose} style={s.headerBtn}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[s.headerTitle, { color: textColor }]}>Edit Highlight</Text>
          <TouchableOpacity onPress={handleSave} style={s.headerBtn}>
            <Text style={[s.saveText, { color: accentColor }]}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Cover Preview */}
          <View style={s.coverSection}>
            <TouchableOpacity
              style={[s.coverCircle, { borderColor: accentColor }]}
              activeOpacity={0.8}
              onPress={() => setCoverPickerOpen((v) => !v)}
            >
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={s.coverImage} contentFit="cover" />
              ) : (
                <Ionicons name="images-outline" size={32} color={subtextColor} />
              )}
              <View style={[s.coverEditBadge, { backgroundColor: accentColor }]}>
                <Ionicons name="camera" size={14} color="#FFF" />
              </View>
            </TouchableOpacity>
            <Text style={[s.coverHint, { color: subtextColor }]}>Tap to change cover</Text>
          </View>

          {/* Cover Picker */}
          {coverPickerOpen && (
            <View style={[s.pickerCard, { backgroundColor: cardColor, borderColor }]}>
              <Text style={[s.sectionTitle, { color: textColor }]}>Choose Cover</Text>
              <View style={s.thumbGrid}>
                {storyItems.map((item) => {
                  const isActive = coverUrl === (item.thumbnailUrl || item.mediaUrl);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => selectCover(item)}
                      activeOpacity={0.8}
                      style={[
                        s.thumbWrap,
                        isActive && { borderWidth: 2, borderColor: accentColor, borderRadius: 6 },
                      ]}
                    >
                      <Image
                        source={{ uri: item.thumbnailUrl || item.mediaUrl }}
                        style={s.thumbImage}
                        contentFit="cover"
                      />
                      {isActive && (
                        <View style={[s.thumbCheck, { backgroundColor: accentColor }]}>
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Name Input */}
          <View style={[s.nameCard, { backgroundColor: cardColor, borderColor }]}>
            <Text style={[s.sectionTitle, { color: textColor }]}>Name</Text>
            <TextInput
              style={[s.nameInput, { color: textColor, borderColor }]}
              value={name}
              onChangeText={setName}
              placeholder="Highlight name"
              placeholderTextColor={subtextColor}
              maxLength={30}
            />
            <Text style={[s.charCount, { color: subtextColor }]}>{name.length}/30</Text>
          </View>

          {/* Stories */}
          <View style={[s.storiesCard, { backgroundColor: cardColor, borderColor }]}>
            <View style={s.sectionHeader}>
              <Text style={[s.sectionTitle, { color: textColor }]}>Stories</Text>
              <Text style={[s.storyCount, { color: subtextColor }]}>{storyIds.length}</Text>
            </View>
            {storyItems.length === 0 ? (
              <Text style={[s.emptyLabel, { color: subtextColor }]}>No stories in this highlight</Text>
            ) : (
              <View style={s.thumbGrid}>
                {storyItems.map((item) => (
                  <View key={item.id} style={s.thumbWrap}>
                    <Image
                      source={{ uri: item.thumbnailUrl || item.mediaUrl }}
                      style={s.thumbImage}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={s.removeBtn}
                      onPress={() => removeStory(item.id)}
                      hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                      <View style={s.removeBtnInner}>
                        <Ionicons name="close" size={12} color="#FFF" />
                      </View>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Delete Button */}
          <TouchableOpacity style={s.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={s.deleteBtnText}>Delete Highlight</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
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
  headerBtn: { width: 50, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  saveText: { fontSize: 16, fontWeight: '700' },
  scrollContent: { paddingBottom: 60 },
  // Cover
  coverSection: { alignItems: 'center', paddingTop: 28, paddingBottom: 8 },
  coverCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImage: { width: '100%', height: '100%' },
  coverEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverHint: { fontSize: 13, fontWeight: '500', marginTop: 8 },
  // Picker
  pickerCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  // Name
  nameCard: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  nameInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  charCount: { fontSize: 12, fontWeight: '500', textAlign: 'right', marginTop: 6 },
  // Stories
  storiesCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  storyCount: { fontSize: 14, fontWeight: '600' },
  emptyLabel: { fontSize: 14, fontWeight: '400', textAlign: 'center', paddingVertical: 20 },
  thumbGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THUMB_GAP,
  },
  thumbWrap: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  removeBtnInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(239,68,68,0.1)',
    gap: 8,
  },
  deleteBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});
