// SavedPostsScreen.tsx - Polished saved posts page with beautiful design
import { useTheme } from '@/src/context/ThemeContext';
import { getSavedPostIds, toggleSavePost } from '@/src/services/postService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { ClipPath, Defs, G, Path, Stop, LinearGradient as SvgGradient, Image as SvgImage } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Mock posts data (same as home.tsx - in production, this would come from a shared store or API)
const ALL_POSTS = [
  { 
    id: '1', 
    type: 'video' as const, 
    title: 'Dental Cleaning Tips', 
    caption: 'Learn the best techniques for dental hygiene',
    author: 'Smile Dental', 
    authorIcon: '🏥',
    authorImage: 'https://randomuser.me/api/portraits/men/32.jpg',
    mediaUri: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800',
    likes: 890, 
    comments: 56,
    timeAgo: '2 hours ago'
  },
  { 
    id: '2', 
    type: 'image' as const, 
    title: 'New Equipment', 
    caption: 'Latest dental technology arriving this week',
    author: 'Happy Teeth', 
    authorIcon: '😁',
    authorImage: 'https://randomuser.me/api/portraits/women/44.jpg',
    mediaUri: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800',
    likes: 567, 
    comments: 34,
    timeAgo: '3 hours ago'
  },
  { 
    id: '3', 
    type: 'video' as const, 
    title: 'Patient Testimonial', 
    caption: 'See what our patients say about us',
    author: 'Bright Smile', 
    authorIcon: '✨',
    authorImage: 'https://randomuser.me/api/portraits/men/52.jpg',
    mediaUri: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800',
    likes: 1234, 
    comments: 89,
    timeAgo: '5 hours ago'
  },
  { 
    id: '4', 
    type: 'image' as const, 
    title: 'Whitening Results', 
    caption: 'Amazing teeth whitening transformation',
    author: 'Care Dental', 
    authorIcon: '💙',
    authorImage: 'https://randomuser.me/api/portraits/women/67.jpg',
    mediaUri: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800',
    likes: 2100, 
    comments: 156,
    timeAgo: '1 day ago'
  },
  { 
    id: '5', 
    type: 'video' as const, 
    title: 'Orthodontics Guide', 
    caption: 'Everything you need to know about braces',
    author: 'Wellness Den', 
    authorIcon: '🌟',
    authorImage: 'https://randomuser.me/api/portraits/men/75.jpg',
    mediaUri: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800',
    likes: 756, 
    comments: 42,
    timeAgo: '2 days ago'
  },
  { 
    id: '6', 
    type: 'image' as const, 
    title: 'Kids Dental Care', 
    caption: 'How to make dental visits fun for children',
    author: 'Dental Plus', 
    authorIcon: '🏥',
    authorImage: 'https://randomuser.me/api/portraits/women/89.jpg',
    mediaUri: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800',
    likes: 432, 
    comments: 28,
    timeAgo: '3 days ago'
  },
];

interface Post {
  id: string;
  type: 'image' | 'video';
  title: string;
  caption: string;
  author: string;
  authorIcon: string;
  authorImage?: string;
  mediaUri?: string;
  likes: number;
  comments: number;
  timeAgo: string;
}

// ========== Generate 5-pointed Star Path ==========
const generateStarPath = (cx: number, cy: number, outerR: number, innerR: number): string => {
  const points = 5;
  let path = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 2) + (i * Math.PI / points);
    const x = cx + r * Math.cos(angle);
    const y = cy - r * Math.sin(angle);
    path += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  }
  return path + ' Z';
};

// ========== Calculate Star Perimeter for Dash Array ==========
const calculateStarPerimeter = (outerR: number, innerR: number): number => {
  const points = 5;
  let perimeter = 0;
  for (let i = 0; i < points * 2; i++) {
    const r1 = i % 2 === 0 ? outerR : innerR;
    const r2 = (i + 1) % 2 === 0 ? outerR : innerR;
    const angle1 = (Math.PI / 2) + (i * Math.PI / points);
    const angle2 = (Math.PI / 2) + ((i + 1) * Math.PI / points);
    const x1 = r1 * Math.cos(angle1);
    const y1 = r1 * Math.sin(angle1);
    const x2 = r2 * Math.cos(angle2);
    const y2 = r2 * Math.sin(angle2);
    perimeter += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }
  return perimeter;
};

// ========== Star-Shaped Rainbow Border with Snake Animation ==========
const StarRainbowBorder: React.FC<{
  size: number;
  strokeWidth?: number;
  gap?: number;
  uniqueId: string;
}> = ({ size, strokeWidth = 2.5, gap = 3, uniqueId }) => {
  const dashAnim = useRef(new Animated.Value(0)).current;
  
  const cx = size / 2;
  const cy = size / 2;
  const outerR = (size / 2) - (strokeWidth / 2);
  const innerR = outerR * 0.52; // Increased from 0.42 for better profile visibility
  const starPath = generateStarPath(cx, cy, outerR, innerR);
  const perimeter = calculateStarPerimeter(outerR, innerR);
  const arcLength = perimeter * 0.75;
  const gapLength = perimeter * 0.25;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(dashAnim, {
        toValue: perimeter,
        duration: 3000,
        useNativeDriver: false,
      })
    );
    animation.start();
    return () => animation.stop();
  }, [perimeter]);

  const AnimatedPath = Animated.createAnimatedComponent(Path);

  return (
    <View style={{ position: 'absolute', width: size, height: size }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id={`starBorder_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF9A9E" />
            <Stop offset="12%" stopColor="#FECFEF" />
            <Stop offset="25%" stopColor="#FFE4A0" />
            <Stop offset="37%" stopColor="#C1F0C1" />
            <Stop offset="50%" stopColor="#A8D8EA" />
            <Stop offset="62%" stopColor="#B5C7E8" />
            <Stop offset="75%" stopColor="#D4B5E8" />
            <Stop offset="87%" stopColor="#F0B5D4" />
            <Stop offset="100%" stopColor="#FF9A9E" />
          </SvgGradient>
        </Defs>
        <AnimatedPath
          d={starPath}
          stroke={`url(#starBorder_${uniqueId})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcLength} ${gapLength}`}
          strokeDashoffset={dashAnim}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

// ========== Star Shape with Profile Image ==========
const StarShape: React.FC<{
  size: number;
  uniqueId: string;
  imageUri?: string;
  isDark?: boolean;
}> = ({ size, uniqueId, imageUri, isDark }) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2;
  const innerR = outerR * 0.52; // Increased from 0.42 for better profile visibility
  const starPath = generateStarPath(cx, cy, outerR, innerR);
  const shimmerPath = generateStarPath(cx, cy * 0.7, outerR * 0.6, innerR * 0.5);

  const bgColor = isDark ? '#1E3A5F' : '#B8E4F0';

  return (
    <View style={{ width: size, height: size, position: 'absolute' }}>
      <Svg width={size} height={size}>
        <Defs>
          <ClipPath id={`starClip_${uniqueId}`}>
            <Path d={starPath} />
          </ClipPath>
          <SvgGradient id={`starBase_${uniqueId}`} x1="30%" y1="0%" x2="70%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.98} />
            <Stop offset="50%" stopColor={bgColor} stopOpacity={0.9} />
            <Stop offset="100%" stopColor={bgColor} stopOpacity={0.8} />
          </SvgGradient>
          <SvgGradient id={`starShine_${uniqueId}`} x1="20%" y1="0%" x2="50%" y2="70%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.85} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </SvgGradient>
        </Defs>

        {imageUri ? (
          <>
            <G clipPath={`url(#starClip_${uniqueId})`}>
              <SvgImage
                href={{ uri: imageUri }}
                x={-size * 0.1}
                y={-size * 0.1}
                width={size * 1.2}
                height={size * 1.2}
                preserveAspectRatio="xMidYMid slice"
              />
            </G>
            <Path d={shimmerPath} fill={`url(#starShine_${uniqueId})`} opacity={0.3} />
          </>
        ) : (
          <>
            <Path d={starPath} fill={`url(#starBase_${uniqueId})`} />
            <Path d={shimmerPath} fill={`url(#starShine_${uniqueId})`} />
          </>
        )}
      </Svg>
    </View>
  );
};

// ========== Post Star Avatar ==========
const PostStarAvatar: React.FC<{ 
  icon: string; 
  size?: number; 
  isDark?: boolean; 
  uniqueId: string;
  imageUri?: string;
}> = ({ icon, size = 44, isDark, uniqueId, imageUri }) => {
  const borderGap = 3;
  const arcStroke = 2.5;
  const totalSize = size + (borderGap * 2) + arcStroke;

  return (
    <View style={{ width: totalSize, height: totalSize, justifyContent: 'center', alignItems: 'center' }}>
      <StarRainbowBorder size={totalSize} strokeWidth={arcStroke} gap={borderGap} uniqueId={uniqueId} />
      {imageUri ? (
        <StarShape size={size} uniqueId={uniqueId} imageUri={imageUri} isDark={isDark} />
      ) : (
        <>
          <StarShape size={size} uniqueId={uniqueId} isDark={isDark} />
          <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: size * 0.38 }}>{icon}</Text>
          </View>
        </>
      )}
    </View>
  );
};

// ========== Animated Post Card ==========
const AnimatedPostCard: React.FC<{
  post: Post;
  index: number;
  isDark: boolean;
  colors: any;
  onShare: (post: Post) => void;
  onUnsave: (postId: string) => void;
}> = ({ post, index, isDark, colors, onShare, onUnsave }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  return (
    <Animated.View 
      style={[
        styles.postCard, 
        { 
          backgroundColor: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.98)',
          borderColor: isDark ? 'rgba(71,85,105,0.4)' : 'rgba(180,215,245,0.7)',
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }
      ]}
    >
      {/* Post Image */}
      <View style={styles.postImageContainer}>
        <Image 
          source={{ uri: post.mediaUri || 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800' }}
          style={styles.postImage}
          resizeMode="cover"
        />
        {/* Gradient overlay for header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.25)', 'transparent']}
          style={styles.imageOverlay}
        />
        {/* Header overlay */}
        <View style={styles.overlayContent}>
          <View style={styles.authorInfo}>
            <PostStarAvatar 
              icon={post.authorIcon} 
              size={40}
              isDark={false}
              uniqueId={`saved_${post.id}`}
              imageUri={post.authorImage}
            />
            <View style={styles.authorTextWrap}>
              <Text style={styles.authorName}>{post.author}</Text>
              <Text style={styles.postTime}>{post.timeAgo}</Text>
            </View>
          </View>
        </View>
        {/* Video indicator */}
        {post.type === 'video' && (
          <View style={styles.videoIndicator}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={28} color="rgba(255,255,255,0.95)" />
            </View>
          </View>
        )}
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        <Text style={[styles.postTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {post.title}
        </Text>
        <Text style={[styles.postCaption, { color: colors.textSecondary }]} numberOfLines={2}>
          {post.caption}
        </Text>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={16} color="#FF6B6B" />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {post.likes.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble" size={15} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>
              {post.comments}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={[styles.actionsRow, { borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => onShare(post)}
          activeOpacity={0.7}
        >
          <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
          <Text style={[styles.actionText, { color: colors.textPrimary }]}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, styles.savedBtn]}
          onPress={() => onUnsave(post.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="bookmark" size={20} color="#2C7BE5" />
          <Text style={[styles.actionText, { color: '#2C7BE5' }]}>Saved</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default function SavedPostsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Load saved posts on mount
  useEffect(() => {
    loadSavedPosts();
  }, []);

  const loadSavedPosts = async () => {
    setLoading(true);
    try {
      const savedIds = await getSavedPostIds();
      const posts = ALL_POSTS.filter(post => savedIds.includes(post.id));
      setSavedPosts(posts);
    } catch (error) {
      console.error('Error loading saved posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (postId: string) => {
    try {
      await toggleSavePost(postId);
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error unsaving post:', error);
      Alert.alert('Error', 'Failed to unsave post. Please try again.');
    }
  };

  const handleShare = async (post: Post) => {
    try {
      await Share.share({
        message: `Check out "${post.title}" by ${post.author} on BeSmile AI!\n\n${post.caption}\n\n🦷 Download BeSmile AI for more dental tips!`,
        title: post.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderPost = useCallback(({ item, index }: { item: Post; index: number }) => (
    <AnimatedPostCard
      post={item}
      index={index}
      isDark={isDark}
      colors={colors}
      onShare={handleShare}
      onUnsave={handleUnsave}
    />
  ), [isDark, colors]);

  const EmptyState = () => (
    <View style={styles.emptyState}>
      {/* Large save icon */}
      <View style={styles.emptyIconWrap}>
        <LinearGradient
          colors={isDark ? ['#1E3A5F', '#2D4A6F'] : ['#E8F4FD', '#D4ECFA']}
          style={styles.emptyIconBg}
        >
          <Text style={styles.emptyIcon}>💾</Text>
        </LinearGradient>
      </View>
      
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No saved posts yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
        When you save posts, they'll appear here{'\n'}for easy access anytime.
      </Text>
      
      {/* CTA Button */}
      <TouchableOpacity 
        style={styles.ctaButton}
        onPress={() => router.back()}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#3B8DF8', '#2C7BE5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
          <Text style={styles.ctaText}>Browse Posts</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Background Gradient */}
      <LinearGradient
        colors={isDark 
          ? ['#0F172A', '#1E293B', '#162033', '#1E293B', '#0F172A'] 
          : ['#E0F2FE', '#E4F3FC', '#EDF8FF', '#F5FBFF', '#E4F5FC', '#E0F2FE']
        }
        locations={isDark ? [0, 0.25, 0.5, 0.75, 1] : [0, 0.2, 0.4, 0.6, 0.8, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Light overlays for depth (light mode only) */}
      {!isDark && (
        <>
          <LinearGradient
            colors={['rgba(255,255,255,0.8)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.7, y: 0.7 }}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            colors={['rgba(186,230,253,0.4)', 'rgba(186,230,253,0.15)', 'rgba(255,255,255,0)']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0.2, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </>
      )}

      {/* Header - transparent to blend with gradient */}
      <View style={[styles.header, { 
        backgroundColor: 'transparent',
        borderBottomColor: isDark ? 'rgba(71,85,105,0.3)' : 'rgba(180,210,240,0.3)',
      }]}>
        {/* Back button */}
        <TouchableOpacity 
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Centered Title & Counter */}
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Saved Posts
          </Text>
          {!loading && (
            <Text style={[styles.headerCounter, { color: colors.textSecondary }]}>
              {savedPosts.length} {savedPosts.length === 1 ? 'saved' : 'saved'}
            </Text>
          )}
        </View>

        {/* Spacer for balance */}
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2C7BE5" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your saved posts...
          </Text>
        </View>
      ) : savedPosts.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={savedPosts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerCounter: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  
  // List
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  
  // Post Card
  postCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    marginBottom: 16,
    shadowColor: '#4A90D9',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  postImageContainer: {
    width: '100%',
    aspectRatio: 16 / 10,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  overlayContent: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorTextWrap: {
    gap: 1,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  postTime: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  videoIndicator: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -28,
    marginLeft: -28,
  },
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(44, 123, 229, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 3,
  },
  
  // Post Content
  postContent: {
    padding: 16,
    paddingBottom: 12,
  },
  postTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  postCaption: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Actions Row
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  savedBtn: {
    backgroundColor: 'rgba(44, 123, 229, 0.1)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconWrap: {
    marginBottom: 24,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  ctaButton: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#2C7BE5',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    gap: 10,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
