# 🔑 Key Code Reference

## Home Screen Component Structure

### Imports
```typescript
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  Modal, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { useRouter } from 'expo-router';
```

### Interfaces
```typescript
interface ClinicStory {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  tier?: 'pro' | 'free';
}

interface FeedPost {
  id: string;
  clinic: ClinicStory;
  mediaType: 'image' | 'video';
  mediaUrl?: string;
  caption?: string;
  likes: number;
  comments: number;
  timestamp: string;
}
```

### Mock Data
```typescript
const MOCK_STORIES: ClinicStory[] = [
  {
    id: '1',
    name: 'Smile Dental',
    avatar: 'https://via.placeholder.com/64?text=SD',
    bio: 'Professional dental care',
    tier: 'pro',
  },
  // ... more stories
];

const MOCK_POSTS: FeedPost[] = [
  {
    id: 'post1',
    clinic: MOCK_STORIES[0],
    mediaType: 'image',
    mediaUrl: 'https://via.placeholder.com/400x500?text=Dental+Treatment',
    caption: 'Beautiful smile transformation! 😊',
    likes: 234,
    comments: 12,
    timestamp: '2 hours ago',
  },
  // ... more posts
];
```

### Component Setup
```typescript
export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  // Story ring color: Blue (light) / Gold (dark)
  const storyRingColor = isDark ? colors.promo : colors.accentBlue;
```

### State Management
```typescript
const [selectedStory, setSelectedStory] = useState<ClinicStory | null>(null);
const [favorites, setFavorites] = useState<Set<string>>(new Set());
const [likes, setLikes] = useState<Record<string, boolean>>({});
const [videoFinished, setVideoFinished] = useState<Record<string, boolean>>({});
const [createPostVisible, setCreatePostVisible] = useState(false);
const [postCaption, setPostCaption] = useState('');
```

## Handler Functions

### Add to Favorites
```typescript
const handleAddFavorite = () => {
  if (!selectedStory) return;
  setFavorites((prev) => {
    const next = new Set(prev);
    if (next.has(selectedStory.id)) {
      next.delete(selectedStory.id);
    } else {
      next.add(selectedStory.id);
    }
    return next;
  });
};
```

### Navigate to Profile
```typescript
const handleViewProfile = () => {
  if (!selectedStory) return;
  setSelectedStory(null);
  router.push(`/public/clinic/${selectedStory.id}` as any);
};
```

### Toggle Like
```typescript
const toggleLike = (postId: string) => {
  setLikes((prev) => ({ ...prev, [postId]: !prev[postId] }));
};
```

### Watch Again
```typescript
const handleWatchAgain = (postId: string) => {
  setVideoFinished((prev) => ({ ...prev, [postId]: false }));
};
```

## Render Functions

### Story Item
```typescript
const renderStory = ({ item }: { item: ClinicStory }) => {
  const isStoryFav = favorites.has(item.id);
  return (
    <TouchableOpacity
      style={styles.storyContainer}
      onPress={() => setSelectedStory(item)}
    >
      <View
        style={[
          styles.storyRing,
          {
            borderColor: isStoryFav ? colors.buttonBackground : storyRingColor,
            borderWidth: isStoryFav ? 3 : 2,
          },
        ]}
      >
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.storyAvatar} />
        ) : (
          <View style={[styles.storyAvatar, { backgroundColor: colors.inputBackground }]} />
        )}
      </View>
      <Text style={[styles.storyName, { color: colors.textPrimary }]} numberOfLines={1}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};
```

### Feed Post
```typescript
const renderPost = ({ item }: { item: FeedPost }) => {
  const postLiked = likes[item.id];
  const isVideoFinished = videoFinished[item.id];

  return (
    <View style={[styles.postCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      {/* Header with clinic info and Pro badge */}
      <View style={[styles.postHeader, isRTL && { flexDirection: 'row-reverse' }]}>
        {/* Story ring + name + timestamp */}
        {item.clinic.tier === 'pro' && (
          <View style={[styles.proBadge, { backgroundColor: colors.buttonBackground }]}>
            <Ionicons name="star-sharp" size={12} color={colors.buttonText} />
            <Text style={[styles.proBadgeText, { color: colors.buttonText }]}>
              {t('home.pro')}
            </Text>
          </View>
        )}
      </View>

      {/* Media */}
      <View style={[styles.postMedia, { backgroundColor: colors.inputBackground }]}>
        {item.mediaType === 'image' && item.mediaUrl && (
          <Image source={{ uri: item.mediaUrl }} style={{ width: '100%', height: '100%' }} />
        )}
        {item.mediaType === 'video' && (
          <Ionicons name="play-circle" size={60} color={colors.textSecondary} />
        )}
      </View>

      {/* Caption */}
      <View style={styles.postCaption}>
        <Text style={[styles.postCaptionText, { color: colors.textPrimary }]}>
          {item.caption}
        </Text>
      </View>

      {/* Actions */}
      <View style={[styles.postActions, isRTL && { flexDirection: 'row-reverse' }]}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => toggleLike(item.id)}
        >
          <Ionicons
            name={postLiked ? 'heart-sharp' : 'heart-outline'}
            size={24}
            color={postLiked ? '#E74C3C' : colors.textSecondary}
          />
          <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
            {item.likes + (postLiked ? 1 : 0)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
          <Text style={[styles.actionCount, { color: colors.textSecondary }]}>
            {item.comments}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-social-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};
```

## Main Render

### Header & Stories
```typescript
return (
  <View style={[styles.container, { backgroundColor: colors.background }]}>
    {/* Header with Create Button */}
    <View style={[styles.headerBar, isRTL && { flexDirection: 'row-reverse' }, { borderColor: colors.cardBorder }]}>
      <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
        {t('home.feedTitle')}
      </Text>
      <TouchableOpacity
        style={[styles.createButton, { backgroundColor: colors.buttonBackground }]}
        onPress={() => setCreatePostVisible(true)}
      >
        <Ionicons name="add" size={28} color={colors.buttonText} />
      </TouchableOpacity>
    </View>

    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Stories Row */}
      <FlatList
        horizontal
        data={MOCK_STORIES}
        keyExtractor={(item) => item.id}
        renderItem={renderStory}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.storiesContainer}
        scrollEnabled={false}
      />

      {/* Feed */}
      {MOCK_POSTS.map((post) => (
        <View key={post.id}>{renderPost({ item: post })}</View>
      ))}
    </ScrollView>
  </View>
);
```

## Bottom Sheet Modal

```typescript
{/* Story Bottom Sheet */}
<Modal visible={!!selectedStory} transparent animationType="fade">
  <TouchableOpacity
    style={[styles.backdrop, { backgroundColor: colors.scrim }]}
    activeOpacity={1}
    onPress={() => setSelectedStory(null)}
  >
    <View
      style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={1}
        style={styles.sheetContent}
        onPress={(e) => e.stopPropagation()}
      >
        {selectedStory && (
          <>
            {/* Avatar + Name */}
            <View style={[styles.sheetHeader, isRTL && { flexDirection: 'row-reverse' }]}>
              <View style={[styles.sheetAvatar, { borderColor: colors.accentBlue }]}>
                <Image source={{ uri: selectedStory.avatar }} style={styles.sheetAvatarImage} />
              </View>
              <View style={[styles.sheetTitleWrap, isRTL && { alignItems: 'flex-end' }]}>
                <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
                  {selectedStory.name}
                </Text>
                <Text style={[styles.sheetSubtitle, { color: colors.textSecondary }]}>
                  {selectedStory.bio}
                </Text>
              </View>
            </View>

            {/* Add to Favorites Button */}
            <TouchableOpacity
              style={[
                styles.sheetBtn,
                { backgroundColor: isFavorite ? colors.buttonBackground : colors.inputBackground },
              ]}
              onPress={handleAddFavorite}
            >
              <Ionicons
                name={isFavorite ? 'heart-sharp' : 'heart-outline'}
                size={20}
                color={isFavorite ? colors.buttonText : colors.textSecondary}
              />
              <Text style={[styles.sheetBtnText, { color: isFavorite ? colors.buttonText : colors.textPrimary }]}>
                {isFavorite ? t('home.addedFavorite') : t('home.addFavorite')}
              </Text>
            </TouchableOpacity>

            {/* View Profile Button */}
            <TouchableOpacity
              style={[styles.sheetBtn, { backgroundColor: colors.buttonBackground }]}
              onPress={handleViewProfile}
            >
              <Ionicons name="person-circle" size={20} color={colors.buttonText} />
              <Text style={[styles.sheetBtnText, { color: colors.buttonText }]}>
                {t('home.viewProfile')}
              </Text>
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={[styles.sheetBtn, { backgroundColor: 'transparent' }]}
              onPress={() => setSelectedStory(null)}
            >
              <Text style={[styles.sheetCancel, { color: colors.textSecondary }]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
</Modal>
```

## Create Post Modal

```typescript
{/* Create Post Modal */}
<Modal visible={createPostVisible} transparent animationType="slide">
  <View style={[styles.createPostContainer, { backgroundColor: colors.background }]}>
    <View style={[styles.createPostHeader, isRTL && { flexDirection: 'row-reverse' }, { borderColor: colors.cardBorder }]}>
      <TouchableOpacity onPress={() => { setCreatePostVisible(false); setPostCaption(''); }}>
        <Ionicons name="close" size={28} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={[styles.createPostTitle, { color: colors.textPrimary }]}>
        {t('home.newPost')}
      </Text>
      <TouchableOpacity
        style={[styles.shareBtn, { backgroundColor: colors.buttonBackground }]}
        onPress={() => { setCreatePostVisible(false); setPostCaption(''); }}
      >
        <Text style={[styles.shareBtnText, { color: colors.buttonText }]}>
          {t('home.share')}
        </Text>
      </TouchableOpacity>
    </View>

    <ScrollView style={styles.createPostContent}>
      {/* Image Placeholder */}
      <View style={[styles.imagePreview, { backgroundColor: colors.inputBackground }]}>
        <Ionicons name="image-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.previewText, { color: colors.textSecondary }]}>
          {t('home.selectPhoto')}
        </Text>
      </View>

      {/* Caption Input */}
      <View style={styles.captionSection}>
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>
          {t('home.caption')}
        </Text>
        <TextInput
          style={[
            styles.captionInput,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.cardBorder,
              color: colors.textPrimary,
            },
          ]}
          placeholder={t('home.captionPlaceholder')}
          placeholderTextColor={colors.inputPlaceholder}
          value={postCaption}
          onChangeText={setPostCaption}
          multiline
        />
      </View>

      {/* Options */}
      {[
        { icon: 'musical-notes-outline', label: t('home.addMusic') },
        { icon: 'people-outline', label: t('home.tagPeople') },
        { icon: 'location-outline', label: t('home.addLocation') },
      ].map((option, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.optionRow, isRTL && { flexDirection: 'row-reverse' }]}
        >
          <Ionicons name={option.icon as any} size={20} color={colors.textSecondary} />
          <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
</Modal>
```

## Styling Examples

```typescript
const styles = StyleSheet.create({
  container: { flex: 1 },
  
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  createButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },

  storyContainer: { alignItems: 'center', marginHorizontal: 8 },
  storyRing: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  storyAvatar: { width: 64, height: 64, borderRadius: 32 },
  storyName: { marginTop: 6, fontSize: 12, textAlign: 'center' },

  postCard: { marginVertical: 8, marginHorizontal: 8, borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  postHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  postMedia: { width: '100%', height: 300, justifyContent: 'center', alignItems: 'center' },
  postCaption: { paddingHorizontal: 12, paddingVertical: 8 },
  postActions: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 16 },

  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, borderWidth: 1 },
  sheetBtn: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', gap: 10 },

  createPostContainer: { flex: 1 },
  imagePreview: { height: 280, borderRadius: 12, justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 20 },
  captionInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 100 },
});
```

---

## i18n Keys Reference

### English (en.json)
```json
{
  "home": {
    "feedTitle": "Feed",
    "pro": "Pro",
    "addFavorite": "Add to favorites",
    "addedFavorite": "Added to favorites",
    "viewProfile": "View profile",
    "watchAgain": "Watch again",
    "watchMoreReels": "Watch more reels",
    "newPost": "New Post",
    "share": "Share",
    "selectPhoto": "Tap to select photo",
    "caption": "Caption",
    "captionPlaceholder": "Write a caption...",
    "addMusic": "Add music",
    "tagPeople": "Tag people",
    "addLocation": "Add location"
  }
}
```

### Arabic (ar.json)
```json
{
  "home": {
    "feedTitle": "الفيد",
    "pro": "برو",
    "addFavorite": "أضف إلى المفضلة",
    "addedFavorite": "تمت الإضافة إلى المفضلة",
    "viewProfile": "عرض الملف",
    "watchAgain": "شاهد مرة أخرى",
    "watchMoreReels": "شاهد المزيد من الريلز",
    "newPost": "منشور جديد",
    "share": "شارك",
    "selectPhoto": "اضغط لاختيار صورة",
    "caption": "التعليق",
    "captionPlaceholder": "اكتب تعليقًا...",
    "addMusic": "أضف موسيقى",
    "tagPeople": "وسّم الأشخاص",
    "addLocation": "أضف الموقع"
  }
}
```

---

**This reference covers all major code sections. For full context, see `app/home.tsx`**
