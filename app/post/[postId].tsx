import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// React 19 hook aliases
const { useState, useEffect, useCallback } = React;

const SCREEN_WIDTH = Dimensions.get('window').width;

// Mock post data - In production, fetch from Firebase
const MOCK_POSTS_DB: Record<string, any> = {
  '1': { 
    id: '1', 
    type: 'video', 
    title: 'Dental Cleaning Tips', 
    caption: 'Learn the best techniques for dental hygiene. Regular brushing and flossing are essential for maintaining healthy teeth and gums.',
    author: 'Smile Dental', 
    authorIcon: '🏥',
    likes: 890, 
    comments: 56,
    timeAgo: '2 hours ago',
    content: 'Proper dental hygiene is crucial for overall health. Here are some tips:\n\n1. Brush twice daily for 2 minutes\n2. Use fluoride toothpaste\n3. Floss daily\n4. Visit your dentist regularly\n5. Limit sugary foods and drinks',
  },
  '2': { 
    id: '2', 
    type: 'image', 
    title: 'New Equipment', 
    caption: 'Latest dental technology arriving this week. We\'re excited to offer even better care!',
    author: 'Happy Teeth', 
    authorIcon: '😁',
    likes: 567, 
    comments: 34,
    timeAgo: '3 hours ago',
    content: 'We are thrilled to announce the arrival of our new state-of-the-art dental equipment! This advanced technology will help us provide:\n\n• More accurate diagnoses\n• Faster treatments\n• Better patient comfort\n• Improved results',
  },
  '3': { 
    id: '3', 
    type: 'video', 
    title: 'Patient Testimonial', 
    caption: 'See what our patients say about us. Real stories from real people.',
    author: 'Bright Smile', 
    authorIcon: '✨',
    likes: 1234, 
    comments: 89,
    timeAgo: '5 hours ago',
    content: '"I was always afraid of going to the dentist, but Bright Smile changed everything. The staff is incredibly friendly and professional. My smile has never looked better!" - Sarah M.',
  },
  '4': { 
    id: '4', 
    type: 'image', 
    title: 'Whitening Results', 
    caption: 'Amazing teeth whitening transformation. See the before and after!',
    author: 'Care Dental', 
    authorIcon: '💙',
    likes: 2100, 
    comments: 156,
    timeAgo: '1 day ago',
    content: 'Professional teeth whitening can make a dramatic difference. Our patient went from yellowed teeth to a brilliant white smile in just one session!\n\n✓ Safe and effective\n✓ Long-lasting results\n✓ Boosts confidence',
  },
  '5': { 
    id: '5', 
    type: 'video', 
    title: 'Orthodontics Guide', 
    caption: 'Everything you need to know about braces and aligners.',
    author: 'Dental Plus', 
    authorIcon: '🦷',
    likes: 789, 
    comments: 67,
    timeAgo: '2 days ago',
    content: 'Considering orthodontic treatment? Here\'s what you need to know:\n\n🔹 Traditional braces: Most effective for complex cases\n🔹 Clear aligners: Nearly invisible option\n🔹 Treatment time: Usually 12-24 months\n🔹 Age: Never too late to straighten your teeth!',
  },
};

// Simulated Firebase fetch function
async function fetchPostFromFirebase(postId: string): Promise<any | null> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In production, this would be:
  // const docRef = doc(db, 'posts', postId);
  // const docSnap = await getDoc(docRef);
  // return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  
  return MOCK_POSTS_DB[postId] || null;
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    if (!postId) {
      setError('No post ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedPost = await fetchPostFromFirebase(postId);
      
      if (fetchedPost) {
        setPost(fetchedPost);
      } else {
        setError('Post not found');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = useCallback(async () => {
    if (!post) return;
    
    try {
      await Share.share({
        message: `Check out "${post.title}" by ${post.author} on BeSmile AI!\n\nhttps://besmile.app/post/${post.id}`,
        url: `https://besmile.app/post/${post.id}`,
        title: post.title,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  }, [post]);

  const handleLike = useCallback(() => {
    setLiked(prev => !prev);
    // In production: update Firebase
  }, []);

  const handleSave = useCallback(() => {
    setSaved(prev => !prev);
    Alert.alert(
      saved ? 'Removed' : 'Saved!',
      saved ? 'Post removed from saved items' : 'Post saved to your collection'
    );
    // In production: update AsyncStorage/Firebase
  }, [saved]);

  const styles = createStyles(colors, isDark);

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            headerShown: true,
            title: 'Loading...',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }} 
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2C7BE5" />
          <Text style={styles.loadingText}>Loading post...</Text>
          <Text style={styles.loadingSubtext}>Post ID: {postId}</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error || !post) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            headerShown: true,
            title: 'Post Not Found',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }} 
        />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          </View>
          <Text style={styles.errorTitle}>Post Not Found</Text>
          <Text style={styles.errorText}>
            The post you're looking for doesn't exist or has been removed.
          </Text>
          <Text style={styles.errorId}>Post ID: {postId}</Text>
          
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={loadPost}
          >
            <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.homeButton}
            onPress={() => router.replace('/(tabs)/home' as any)}
          >
            <Text style={styles.homeButtonText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Success - Show post
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: true,
          title: post.title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.textPrimary,
          headerRight: () => (
            <TouchableOpacity onPress={handleShare} style={{ marginRight: 8 }}>
              <Ionicons name="share-outline" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.authorRow}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>{post.authorIcon}</Text>
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.author}</Text>
              <Text style={styles.timeAgo}>{post.timeAgo}</Text>
            </View>
          </View>
        </View>

        {/* Post Media Placeholder */}
        <View style={styles.mediaContainer}>
          <LinearGradient
            colors={['#E8F4FC', '#D6EFFF', '#C4E8FF']}
            style={styles.mediaPlaceholder}
          >
            <Text style={styles.mediaIcon}>
              {post.type === 'video' ? '🎬' : '📷'}
            </Text>
            <Text style={styles.mediaTypeText}>
              {post.type === 'video' ? 'Video Post' : 'Image Post'}
            </Text>
          </LinearGradient>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
            <Ionicons 
              name={liked ? 'heart' : 'heart-outline'} 
              size={26} 
              color={liked ? '#EF4444' : colors.textPrimary} 
            />
            <Text style={[styles.actionCount, liked && { color: '#EF4444' }]}>
              {post.likes + (liked ? 1 : 0)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="chatbubble-outline" size={24} color={colors.textPrimary} />
            <Text style={styles.actionCount}>{post.comments}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="paper-plane-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          
          <View style={{ flex: 1 }} />
          
          <TouchableOpacity style={styles.actionBtn} onPress={handleSave}>
            <Ionicons 
              name={saved ? 'bookmark' : 'bookmark-outline'} 
              size={24} 
              color={saved ? '#2C7BE5' : colors.textPrimary} 
            />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <View style={styles.contentSection}>
          <Text style={styles.postTitle}>{post.title}</Text>
          <Text style={styles.postCaption}>{post.caption}</Text>
          
          {post.content && (
            <Text style={styles.postContent}>{post.content}</Text>
          )}
        </View>

        {/* Deep Link Info Card */}
        <View style={styles.linkInfoCard}>
          <View style={styles.linkInfoHeader}>
            <Ionicons name="qr-code-outline" size={20} color="#2C7BE5" />
            <Text style={styles.linkInfoTitle}>Deep Link Info</Text>
          </View>
          <Text style={styles.linkInfoText}>
            This post was opened via deep link
          </Text>
          <View style={styles.linkUrlBox}>
            <Text style={styles.linkUrl}>
              https://besmile.app/post/{post.id}
            </Text>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 20,
  },
  loadingSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
  },
  
  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIconWrap: {
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  errorId: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C7BE5',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  homeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  homeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2C7BE5',
  },
  
  // Post Header
  postHeader: {
    padding: 16,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F4FC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorAvatarText: {
    fontSize: 22,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  timeAgo: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  
  // Media
  mediaContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
  },
  mediaPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  mediaTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
  },
  
  // Actions
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? '#1E293B' : '#F1F5F9',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginLeft: 6,
  },
  
  // Content
  contentSection: {
    padding: 16,
  },
  postTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  postCaption: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  postContent: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 24,
  },
  
  // Link Info Card
  linkInfoCard: {
    margin: 16,
    padding: 16,
    backgroundColor: isDark ? '#1E293B' : '#F0F9FF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: isDark ? '#334155' : '#BAE6FD',
  },
  linkInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C7BE5',
    marginLeft: 8,
  },
  linkInfoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  linkUrlBox: {
    backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  linkUrl: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#64748B',
  },
});
