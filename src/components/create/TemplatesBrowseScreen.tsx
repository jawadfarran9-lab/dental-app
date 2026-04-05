import { useSavedItems } from '@/src/context/SavedItemsContext';
import { type Template, getRecommendedTemplates, getTemplatesSync, getTrendingTemplates } from '@/src/services/templatesService';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Dimensions,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - 10) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

const TemplatesBrowseScreen: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);
  const router = useRouter();
  const { savedTemplateIds, toggleSaveTemplate, isTemplateSaved } = useSavedItems();

  const [activeTab, setActiveTab] = useState<'browse' | 'saved'>('browse');

  const savedTemplates = getTemplatesSync().filter((t) => savedTemplateIds.includes(t.id));

  const handleClose = () => {
    if (onClose) onClose();
    else router.back();
  };

  const handleCardPress = (id: string) => {
    router.push({ pathname: '/reels-template-preview' as any, params: { id } });
  };

  const renderCard = (item: Template) => {
    const isSaved = isTemplateSaved(item.id);
    return (
      <Pressable key={item.id} style={styles.card} onPress={() => handleCardPress(item.id)}>
        <ExpoImage source={{ uri: item.thumbnail }} style={styles.cardImage} contentFit="cover" />
        <View style={styles.cardOverlay} />
        <View style={styles.cardContent}>
          <Text style={styles.cardLabel}>{item.title.toUpperCase()}</Text>
        </View>
        <Pressable
          style={styles.bookmarkIcon}
          hitSlop={8}
          onPress={(e) => { e.stopPropagation(); toggleSaveTemplate(item.id); }}
        >
          <Ionicons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={16}
            color={isSaved ? '#fff' : 'rgba(255,255,255,0.6)'}
          />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPadding }]}>
        <Pressable style={styles.headerButton} onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>

        {/* Browse / Saved toggle */}
        <View style={styles.tabRow}>
          <Pressable onPress={() => setActiveTab('browse')}>
            <Text style={[styles.tabText, activeTab === 'browse' && styles.tabTextActive]}>Browse</Text>
          </Pressable>
          <Pressable onPress={() => setActiveTab('saved')}>
            <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>Saved</Text>
          </Pressable>
        </View>

        <View style={styles.headerButton} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'browse' ? (
          <>
            {/* Recommended Section */}
            <Text style={styles.sectionTitle}>Recommended for you</Text>
            <View style={styles.grid}>
              {getRecommendedTemplates().map(renderCard)}
            </View>

            {/* Trending Section */}
            <Text style={styles.sectionTitle}>Trending</Text>
            <View style={styles.grid}>
              {getTrendingTemplates().map(renderCard)}
            </View>
          </>
        ) : savedTemplates.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Your saved templates</Text>
            <View style={styles.grid}>
              {savedTemplates.map(renderCard)}
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bookmark-outline" size={48} color="rgba(255,255,255,0.25)" />
            <Text style={styles.emptyTitle}>No saved templates</Text>
            <Text style={styles.emptySubtitle}>Save templates to find them here.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TemplatesBrowseScreen;

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
  tabRow: {
    flexDirection: 'row',
    gap: 20,
  },
  tabText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
  },

  // ---- Content ----
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },

  // ---- Card ----
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
    backgroundColor: '#111',
  },
  cardImage: {
    ...StyleSheet.absoluteFillObject,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  cardContent: {
    padding: 12,
  },
  cardLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bookmarkIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // ---- Empty State ----
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 14,
  },
});
