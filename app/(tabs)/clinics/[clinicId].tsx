import { db, storage } from '@/firebaseConfig';
import StarAvatar from '@/src/components/StarAvatar';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import { fetchClinicMedia } from '@/src/services/clinicMediaService';
import { ClinicMedia } from '@/src/types/clinicMedia';
import { ClinicData, fetchClinicData } from '@/src/utils/clinicDataUtils';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const NUM_COLUMNS = 3;
const GRID_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type TabKey = 'posts' | 'reels';

// ─── Grid Item (memoised) ───
const MediaGridItem = React.memo(
  ({
    item,
    onPress,
    isDark,
  }: {
    item: ClinicMedia;
    onPress: (id: string) => void;
    isDark: boolean;
  }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(item.id)}
      style={gridStyles.tile}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={gridStyles.tileImage}
        contentFit="cover"
        recyclingKey={item.id}
        transition={200}
      />

      {/* Video play indicator */}
      {item.isVideo && (
        <View style={gridStyles.videoOverlay}>
          <Ionicons name="play" size={22} color="#FFF" />
        </View>
      )}

      {/* Carousel / multi-image indicator */}
      {(item.mediaCount ?? 0) > 1 && (
        <View style={gridStyles.carouselOverlay}>
          <Ionicons name="copy-outline" size={14} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  ),
);

const gridStyles = StyleSheet.create({
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    backgroundColor: '#E8ECF0',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carouselOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});

/**
 * Clinic Profile Screen (inside tabs)
 *
 * Route: /(tabs)/clinics/[clinicId]
 * Phase 3 — Header + Posts/Reels tabs + media grid.
 * Tab bar remains visible.
 */
export default function ClinicProfileScreen() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const auth = useAuth();

  const isOwner = !!(auth.clinicId && clinicId && auth.clinicId === clinicId);

  // ─── Creation Hub Sheet ───
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const sheetAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const openCreateSheet = useCallback(() => {
    setShowCreateSheet(true);
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(sheetAnim, { toValue: 1, damping: 22, stiffness: 280, useNativeDriver: true }),
    ]).start();
  }, [backdropAnim, sheetAnim]);

  const closeCreateSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(sheetAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowCreateSheet(false));
  }, [backdropAnim, sheetAnim]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [localProfileImage, setLocalProfileImage] = useState<string | null>(null);

  const handleUploadProfileImage = useCallback(async () => {
    if (!clinicId) return;
    closeCreateSheet();

    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow photo library access to upload a profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;

    const uri = result.assets[0].uri;
    setUploadingImage(true);

    try {
      // Convert to blob via XHR (most reliable for RN)
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Failed to read image'));
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      // Upload to Storage
      const storageRef = ref(storage, `clinics/${clinicId}/profile.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: 'image/jpeg' });

      const downloadURL: string = await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (err) => reject(err),
          async () => {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          },
        );
      });

      // Write to Firestore
      await setDoc(doc(db, 'clinics', clinicId), { profileImageUrl: downloadURL }, { merge: true });

      // Instantly update avatar
      setLocalProfileImage(downloadURL);
      Alert.alert('Success', 'Profile image updated.');
    } catch {
      Alert.alert('Upload Failed', 'Could not upload the image. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  }, [clinicId, closeCreateSheet]);

  const handleCreateOption = useCallback((label: string) => {
    if (label === 'Upload Profile Image') {
      handleUploadProfileImage();
      return;
    }
    closeCreateSheet();
    setTimeout(() => {
      Alert.alert(label, `"${label}" will be available in the next update.`);
    }, 350);
  }, [closeCreateSheet, handleUploadProfileImage]);

  // ─── Clinic Data ───
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchClinicData(clinicId);
      if (!cancelled) {
        setClinic(data);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clinicId]);

  // ─── Media Data ───
  const [allMedia, setAllMedia] = useState<ClinicMedia[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    let cancelled = false;
    (async () => {
      setMediaLoading(true);
      const items = await fetchClinicMedia(clinicId);
      if (!cancelled) {
        setAllMedia(items);
        setMediaLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clinicId]);

  // ─── Tabs ───
  const [activeTab, setActiveTab] = useState<TabKey>('posts');

  const filteredMedia = useMemo(
    () => allMedia.filter((m) => (activeTab === 'posts' ? m.type === 'post' : m.type === 'reel')),
    [allMedia, activeTab],
  );

  // ─── Derived display values ───
  const displayName = clinic?.clinicName || 'Clinic';
  const displayCity = clinic?.city || '';
  const displayCountry = clinic?.countryCode || '';
  const locationLine = [displayCity, displayCountry].filter(Boolean).join(', ');
  const phone = clinic?.clinicPhone || clinic?.phone || '';
  const profileImageUri =
    localProfileImage ||
    clinic?.profileImageUrl ||
    clinic?.imageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4A90D9&color=fff&size=256`;

  // ─── Handlers ───
  const handleCall = useCallback(() => {
    if (phone) Linking.openURL(`tel:${phone}`);
  }, [phone]);

  const handleGetDirections = useCallback(() => {
    if (!clinic?.location?.lat || !clinic?.location?.lng) return;
    const { lat, lng } = clinic.location;
    const encodedLabel = encodeURIComponent(displayName);
    const appleUrl = `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodedLabel}`;
    const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    const url = Platform.OS === 'ios' ? appleUrl : googleUrl;
    Linking.openURL(url).catch(() => {
      Linking.openURL(googleUrl).catch(() => {});
    });
  }, [clinic?.location, displayName]);

  const handleMediaPress = useCallback(
    (mediaId: string) => {
      router.push(`/clinic/${clinicId}/media/${mediaId}` as any);
    },
    [clinicId, router],
  );

  const keyExtractor = useCallback((item: ClinicMedia) => item.id, []);

  const renderMediaItem = useCallback(
    ({ item }: { item: ClinicMedia }) => (
      <MediaGridItem item={item} onPress={handleMediaPress} isDark={isDark} />
    ),
    [handleMediaPress, isDark],
  );

  const ItemSeparator = useCallback(() => <View style={{ height: GRID_GAP }} />, []);

  // ─── Loading state ───
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
        {/* Back button while loading */}
        <View style={styles.backBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#1E3A5F'} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4A90D9" />
        </View>
      </SafeAreaView>
    );
  }

  // ─── Header component for FlatList ───
  const ListHeader = (
    <>
      {/* ══════ Top Navigation Bar ══════ */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.navBtn}
            activeOpacity={0.7}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#FFF' : '#1E3A5F'} />
          </TouchableOpacity>

          {isOwner && (
            <TouchableOpacity style={styles.navBtn} activeOpacity={0.7} onPress={openCreateSheet}>
              <Ionicons name="add" size={26} color={isDark ? '#FFF' : '#1E3A5F'} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.navRight}>
          {isOwner && (
            <>
              <TouchableOpacity
                style={styles.navBtn}
                activeOpacity={0.7}
                onPress={() => router.push('/notifications' as any)}
              >
                <Ionicons name="notifications-outline" size={24} color={isDark ? '#FFF' : '#1E3A5F'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} activeOpacity={0.7}>
                <Ionicons name="ellipsis-vertical" size={22} color={isDark ? '#FFF' : '#1E3A5F'} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ══════ Profile Header ══════ */}
      <View style={styles.profileSection}>
        <View style={styles.avatarWrap}>
          <StarAvatar size={110} uri={profileImageUri} borderWidth={3} />
          {uploadingImage && (
            <View style={styles.avatarOverlay}>
              <ActivityIndicator size="small" color="#FFF" />
            </View>
          )}
        </View>

        <View style={styles.nameRow}>
          <Text
            style={[styles.clinicName, { color: isDark ? '#FFF' : '#1E3A5F' }]}
            numberOfLines={2}
          >
            {displayName}
          </Text>
          {isOwner && (
            <Ionicons
              name="lock-closed"
              size={16}
              color={isDark ? '#7A8BA3' : '#A0AAB8'}
              style={styles.lockIcon}
            />
          )}
        </View>

        {!!locationLine && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color={isDark ? '#8A9AB5' : '#6B7C93'} />
            <Text style={[styles.infoText, { color: isDark ? '#8A9AB5' : '#6B7C93' }]}>
              {locationLine}
            </Text>
          </View>
        )}

        {!!phone && (
          <TouchableOpacity style={styles.infoRow} onPress={handleCall} activeOpacity={0.6}>
            <Ionicons name="call-outline" size={16} color="#4A90D9" />
            <Text style={[styles.infoText, { color: '#4A90D9' }]}>{phone}</Text>
          </TouchableOpacity>
        )}

        {!!(clinic?.location?.lat && clinic?.location?.lng) && (
          <TouchableOpacity style={styles.infoRow} onPress={handleGetDirections} activeOpacity={0.6}>
            <Ionicons name="navigate-outline" size={16} color="#4A90D9" />
            <Text style={[styles.infoText, { color: '#4A90D9' }]}>
              Get Directions
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ══════ Posts / Reels Tabs ══════ */}
      <View style={[styles.tabBar, { borderBottomColor: isDark ? '#2A3544' : '#E8ECF0' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={activeTab === 'posts' ? (isDark ? '#FFF' : '#1E3A5F') : (isDark ? '#5A6A80' : '#B0BEC5')}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'posts' ? (isDark ? '#FFF' : '#1E3A5F') : (isDark ? '#5A6A80' : '#B0BEC5'),
                fontWeight: activeTab === 'posts' ? '700' : '500',
              },
            ]}
          >
            Posts
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'reels' && styles.tabActive]}
          onPress={() => setActiveTab('reels')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="film-outline"
            size={22}
            color={activeTab === 'reels' ? (isDark ? '#FFF' : '#1E3A5F') : (isDark ? '#5A6A80' : '#B0BEC5')}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'reels' ? (isDark ? '#FFF' : '#1E3A5F') : (isDark ? '#5A6A80' : '#B0BEC5'),
                fontWeight: activeTab === 'reels' ? '700' : '500',
              },
            ]}
          >
            Reels
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ─── Empty state ───
  const EmptyGrid = (
    <View style={styles.emptyGrid}>
      <Ionicons
        name={activeTab === 'posts' ? 'camera-outline' : 'videocam-outline'}
        size={48}
        color={isDark ? '#3A4A5C' : '#D0D8E0'}
      />
      <Text style={[styles.emptyText, { color: isDark ? '#5A6A80' : '#B0BEC5' }]}>
        {activeTab === 'posts' ? 'No posts yet' : 'No reels yet'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#FFFFFF' }]}>
      <FlatList
        data={filteredMedia}
        renderItem={renderMediaItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={mediaLoading ? (
          <View style={styles.emptyGrid}>
            <ActivityIndicator size="small" color="#4A90D9" />
          </View>
        ) : EmptyGrid}
        ItemSeparatorComponent={ItemSeparator}
        columnWrapperStyle={{ gap: GRID_GAP }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      {/* ══════ Creation Hub Bottom Sheet ══════ */}
      <Modal visible={showCreateSheet} transparent animationType="none" statusBarTranslucent>
        <View style={sheetStyles.root}>
          {/* Backdrop */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeCreateSheet}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: 'rgba(0,0,0,0.45)', opacity: backdropAnim },
              ]}
            />
          </Pressable>

          {/* Sheet */}
          <Animated.View
            style={[
              sheetStyles.sheet,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                transform: [{
                  translateY: sheetAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0],
                  }),
                }],
              },
            ]}
          >
            {/* Handle */}
            <View style={sheetStyles.handleWrap}>
              <View style={[sheetStyles.handle, { backgroundColor: isDark ? '#48484A' : '#D1D1D6' }]} />
            </View>

            <Text style={[sheetStyles.title, { color: isDark ? '#F5F5F7' : '#1C1C1E' }]}>
              Create
            </Text>

            {([
              { icon: 'camera-outline' as const, label: 'Upload Profile Image', accent: '#4A90D9' },
              { icon: 'create-outline' as const, label: 'Create Post', accent: '#34C759' },
              { icon: 'sparkles-outline' as const, label: 'Create Story', accent: '#AF52DE' },
              { icon: 'film-outline' as const, label: 'Create Reel', accent: '#FF375F' },
            ]).map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={[
                  sheetStyles.option,
                  { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' },
                ]}
                activeOpacity={0.7}
                onPress={() => handleCreateOption(opt.label)}
              >
                <View style={[sheetStyles.iconCircle, { backgroundColor: opt.accent + '18' }]}>
                  <Ionicons name={opt.icon} size={22} color={opt.accent} />
                </View>
                <Text style={[sheetStyles.optionLabel, { color: isDark ? '#F5F5F7' : '#1C1C1E' }]}>
                  {opt.label}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={isDark ? '#48484A' : '#C7C7CC'} />
              </TouchableOpacity>
            ))}

            {/* Cancel */}
            <TouchableOpacity
              style={[sheetStyles.cancelBtn, { backgroundColor: isDark ? '#2C2C2E' : '#F5F5F7' }]}
              activeOpacity={0.7}
              onPress={closeCreateSheet}
            >
              <Text style={[sheetStyles.cancelText, { color: isDark ? '#8E8E93' : '#6B7280' }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            {/* Safe area bottom spacer */}
            <View style={{ height: Platform.OS === 'ios' ? 34 : 16 }} />
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Back Bar (loading state) ── */
  backBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 8,
    minHeight: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Nav Bar ── */
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 8,
    minHeight: 48,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 40,
    justifyContent: 'flex-end',
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Profile Section ── */
  profileSection: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  avatarWrap: {
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  clinicName: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  lockIcon: {
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
  },

  /* ── Tabs ── */
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#1E3A5F',
  },
  tabLabel: {
    fontSize: 14,
  },

  /* ── Empty ── */
  emptyGrid: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

/* ── Creation Hub Sheet Styles ── */
const sheetStyles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 24 },
    }),
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 16,
    marginTop: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
