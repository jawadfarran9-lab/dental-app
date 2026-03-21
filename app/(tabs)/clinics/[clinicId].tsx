import { db, storage } from '@/firebaseConfig';
import ClinicProfileMapCard from '@/src/components/ClinicProfileMapCard';
import ClinicTypeBadge from '@/src/components/ClinicTypeBadge';
import CreatePostModal from '@/src/components/CreatePostModal';
import StarAvatar from '@/src/components/StarAvatar';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import { useClinicDistance } from '@/src/hooks/useClinicDistance';
import { fetchClinicMedia } from '@/src/services/clinicMediaService';
import { PostType } from '@/src/services/postCreationService';
import { fetchClinicPublicOwner } from '@/src/services/publicClinics';
import { ClinicMedia } from '@/src/types/clinicMedia';
import { DAYS_ORDER, formatDayLabel } from '@/src/types/clinicSchedule';
import { ClinicData, fetchClinicData } from '@/src/utils/clinicDataUtils';
import { getClinicOpenStatus } from '@/src/utils/workingHoursStatus';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
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
  }: {
    item: ClinicMedia;
    onPress: (id: string) => void;
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

  // ─── Create Post/Reel Modal ───
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [createPostType, setCreatePostType] = useState<PostType>('post');

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
    if (label === 'Create Post') {
      closeCreateSheet();
      setTimeout(() => {
        setCreatePostType('post');
        setCreatePostVisible(true);
      }, 350);
      return;
    }
    if (label === 'Create Reel') {
      closeCreateSheet();
      setTimeout(() => {
        setCreatePostType('reel');
        setCreatePostVisible(true);
      }, 350);
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
  const [manualClose, setManualClose] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean | null>(null);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  // Refetch on focus so manualClose changes from Profile are reflected
  const fetchClinic = useCallback(() => {
    if (!clinicId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [data, pub] = await Promise.all([
        fetchClinicData(clinicId),
        fetchClinicPublicOwner(clinicId),
      ]);
      if (!cancelled) {
        setClinic(data);
        setManualClose(pub?.manualClose === true);
        setManualOpen(pub?.manualOpen === true);
        setIsPublished(pub?.isPublished === true);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clinicId]);

  useFocusEffect(fetchClinic);

  // ── Inactive state detection ──
  // Use === false (not !== true) so null (unknown/loading) is NOT treated as inactive
  const ownerInactive = isOwner && auth.isSubscribed === false;
  const visitorInactive = !isOwner && isPublished === false;

  // ── Manual status override (owner only, active subscription only) ──
  const canToggleDot = isOwner && auth.isSubscribed === true;

  const setClinicStatus = useCallback(async (mode: 'open' | 'close' | 'schedule') => {
    if (!canToggleDot || !clinicId) return;
    const prev = { manualClose, manualOpen };
    const next =
      mode === 'open'     ? { manualClose: false, manualOpen: true } :
      mode === 'close'    ? { manualClose: true,  manualOpen: false } :
      /* schedule */        { manualClose: false, manualOpen: false };

    // Derive status for lightweight public reads (map markers, list cards)
    let derivedStatus: 'open' | 'closed' = 'closed';
    if (next.manualClose) {
      derivedStatus = 'closed';
    } else if (next.manualOpen) {
      derivedStatus = 'open';
    } else if (clinic?.workingHours) {
      derivedStatus = getClinicOpenStatus(clinic.workingHours).status === 'open' ? 'open' : 'closed';
    }

    setManualClose(next.manualClose);
    setManualOpen(next.manualOpen);
    try {
      await setDoc(doc(db, 'clinics_public', clinicId), { ...next, status: derivedStatus }, { merge: true });
    } catch (err) {
      console.error('Clinic status update failed:', err);
      setManualClose(prev.manualClose);
      setManualOpen(prev.manualOpen);
      Alert.alert('Status Update Failed', 'Unable to update clinic status. Please try again.');
    }
  }, [canToggleDot, clinicId, manualClose, manualOpen, clinic?.workingHours]);

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

  // ─── User location (for distance display) ───
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;
      const loc = await Location.getCurrentPositionAsync({});
      if (!cancelled) setUserCoords(loc.coords);
    })();
    return () => { cancelled = true; };
  }, []);

  // ─── Distance (shared hook: Haversine → Google upgrade) ───
  const clinicGeo = clinic?.location?.lat && clinic?.location?.lng
    ? { lat: clinic.location.lat, lng: clinic.location.lng }
    : null;
  const userGeo = userCoords
    ? { lat: userCoords.latitude, lng: userCoords.longitude }
    : null;
  const { distanceKm, distanceText: rawDistanceText, durationMinutes } = useClinicDistance(userGeo, clinicGeo);
  const distanceText = rawDistanceText ? `${rawDistanceText} away` : undefined;

  // ─── Drive time (derived from hook's durationMinutes, Haversine estimate as fallback) ───
  const driveTimeText = useMemo(() => {
    if (durationMinutes != null) {
      const m = durationMinutes;
      if (m < 60) return `~${m} min drive`;
      const h = Math.floor(m / 60);
      const r = m % 60;
      return r > 0 ? `~${h}h ${r}m drive` : `~${h}h drive`;
    }
    if (distanceKm != null && isFinite(distanceKm)) {
      const mins = Math.round((distanceKm / 50) * 60);
      if (mins < 1) return '~1 min drive';
      if (mins < 60) return `~${mins} min drive`;
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `~${h}h ${m}m drive` : `~${h}h drive`;
    }
    return undefined;
  }, [durationMinutes, distanceKm]);

  const locationLine = [displayCity, displayCountry].filter(Boolean).join(', ');
  const phone = clinic?.clinicPhone || clinic?.phone || '';
  const profileImageUri =
    localProfileImage ||
    clinic?.profileImageUrl ||
    clinic?.imageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4A90D9&color=fff&size=256`;

  // ─── Open / Closed status (live, updates every minute) ───
  const [openStatus, setOpenStatus] = useState(() => {
    if (!clinic?.workingHours) return null;
    return getClinicOpenStatus(clinic.workingHours);
  });

  useEffect(() => {
    if (!clinic?.workingHours) { setOpenStatus(null); return; }
    const update = () => setOpenStatus(getClinicOpenStatus(clinic.workingHours!));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [clinic?.workingHours]);

  /** Human-readable countdown string, e.g. "Closes in 2h 15m" or "Opens in 10h 12m" */
  const statusSubtitle = useMemo(() => {
    if (!openStatus) return '';
    const now = new Date();
    if (openStatus.status === 'open') {
      const [ch, cm] = openStatus.closesAt.split(':').map(Number);
      let diffMin = (ch * 60 + cm) - (now.getHours() * 60 + now.getMinutes());
      if (diffMin <= 0) return 'Closing soon';
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      return h > 0 ? `Closes in ${h}h ${m}m` : `Closes in ${m}m`;
    }
    if (openStatus.opensAt) {
      const [oh, om] = openStatus.opensAt.split(':').map(Number);
      let diffMin = (oh * 60 + om) - (now.getHours() * 60 + now.getMinutes());
      if (diffMin <= 0) diffMin += 24 * 60; // next day
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      return h > 0 ? `Opens in ${h}h ${m}m` : `Opens in ${m}m`;
    }
    return 'Closed today';
  }, [openStatus]);

  /** True when clinic is open but closing within 60 minutes */
  const closingSoon = useMemo(() => {
    if (!openStatus || openStatus.status !== 'open') return false;
    const now = new Date();
    const [ch, cm] = openStatus.closesAt.split(':').map(Number);
    const diffMin = (ch * 60 + cm) - (now.getHours() * 60 + now.getMinutes());
    return diffMin > 0 && diffMin <= 60;
  }, [openStatus]);

  // ─── Working Hours expandable card ───
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const hoursOverlay = useRef(new Animated.Value(0)).current;
  const hoursScale = useRef(new Animated.Value(0.96)).current;
  const hoursTranslateY = useRef(new Animated.Value(10)).current;
  // Stagger anims for rows (status + 7 days = 8 slots)
  const rowAnims = useRef(DAYS_ORDER.map(() => new Animated.Value(0))).current;
  const statusRowAnim = useRef(new Animated.Value(0)).current;

  const openHoursCard = useCallback(() => {
    // Reset values
    hoursScale.setValue(0.96);
    hoursTranslateY.setValue(10);
    hoursOverlay.setValue(0);
    statusRowAnim.setValue(0);
    rowAnims.forEach(a => a.setValue(0));

    setHoursExpanded(true);
    Animated.parallel([
      Animated.spring(hoursScale, {
        toValue: 1,
        damping: 18,
        stiffness: 260,
        useNativeDriver: true,
      }),
      Animated.timing(hoursTranslateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(hoursOverlay, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.stagger(40, [
        Animated.timing(statusRowAnim, { toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ...rowAnims.map(a =>
          Animated.timing(a, { toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ),
      ]),
    ]).start();
  }, [hoursScale, hoursTranslateY, hoursOverlay, statusRowAnim, rowAnims]);

  const closeHoursCard = useCallback(() => {
    Animated.parallel([
      Animated.timing(hoursScale, { toValue: 0.96, duration: 160, useNativeDriver: true }),
      Animated.timing(hoursTranslateY, { toValue: 10, duration: 160, useNativeDriver: true }),
      Animated.timing(hoursOverlay, { toValue: 0, duration: 140, useNativeDriver: true }),
    ]).start(() => setHoursExpanded(false));
  }, [hoursScale, hoursTranslateY, hoursOverlay]);

  /** Build compact summary lines from working hours (e.g. "Mon–Fri 09:00–17:00") */
  const hoursSummaryLines = useMemo(() => {
    if (!clinic?.workingHours) return [];
    const wh = clinic.workingHours;
    const lines: string[] = [];
    // Group consecutive days with same schedule
    let rangeStart: string | null = null;
    let rangeEnd: string | null = null;
    let rangeTime: string | null = null;

    const flush = () => {
      if (rangeStart && rangeTime) {
        const label = rangeStart === rangeEnd
          ? rangeStart.slice(0, 3)
          : `${rangeStart.slice(0, 3)}–${rangeEnd!.slice(0, 3)}`;
        lines.push(`${label} ${rangeTime}`);
      }
      rangeStart = null;
      rangeEnd = null;
      rangeTime = null;
    };

    for (const day of DAYS_ORDER) {
      const ds = wh[day];
      if (!ds.enabled) {
        flush();
        continue;
      }
      const time = `${ds.open}–${ds.close}`;
      if (rangeTime === time) {
        rangeEnd = formatDayLabel(day);
      } else {
        flush();
        const dayLabel = formatDayLabel(day);
        rangeStart = dayLabel;
        rangeEnd = dayLabel;
        rangeTime = time;
      }
    }
    flush();
    return lines;
  }, [clinic?.workingHours]);

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
      <MediaGridItem item={item} onPress={handleMediaPress} />
    ),
    [handleMediaPress],
  );

  const ItemSeparator = useCallback(() => <View style={{ height: GRID_GAP }} />, []);

  // ─── Dot pulse animation (must be before early returns) ───
  const dotPulse = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(0.85)).current;
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(dotPulse, { toValue: 1.08, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dotPulse, { toValue: 1,    duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dotOpacity, { toValue: 1,    duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dotOpacity, { toValue: 0.85, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [dotPulse, dotOpacity]);

  // ─── Header sparkle animation (must be before early returns) ───
  const sparkleOpacities = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0.1 + Math.random() * 0.2)),
  ).current;
  const sparkleDrifts = useRef(
    Array.from({ length: 8 }, () => new Animated.Value(0)),
  ).current;
  useEffect(() => {
    const anims = sparkleOpacities.map((opAnim, i) => {
      const dur = 3000 + i * 300;
      const opLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(opAnim, { toValue: 0.85, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opAnim, { toValue: 0.15, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      const driftDur = 3600 + i * 400;
      const driftLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleDrifts[i], { toValue: 6,  duration: driftDur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(sparkleDrifts[i], { toValue: -6, duration: driftDur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      return { opLoop, driftLoop, delay: i * 300 };
    });
    anims.forEach(({ opLoop, driftLoop, delay }) =>
      setTimeout(() => { opLoop.start(); driftLoop.start(); }, delay),
    );
    return () => anims.forEach(({ opLoop, driftLoop }) => { opLoop.stop(); driftLoop.stop(); });
  }, [sparkleOpacities, sparkleDrifts]);

  // ─── Name sparkle animation (must be before early returns) ───
  const nameSparkleOp = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0)),
  ).current;
  const nameSparkleX = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0)),
  ).current;
  const nameSparkleY = useRef(
    Array.from({ length: 3 }, () => new Animated.Value(0)),
  ).current;
  useEffect(() => {
    const anims = nameSparkleOp.map((opAnim, i) => {
      const dur = 3000 + i * 400;
      const driftDur = 4000 + i * 500;
      const opLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(opAnim, { toValue: 0.9, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opAnim, { toValue: 0,   duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      const xLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(nameSparkleX[i], { toValue: 3,  duration: driftDur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(nameSparkleX[i], { toValue: -3, duration: driftDur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      const yLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(nameSparkleY[i], { toValue: 5,  duration: driftDur + 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(nameSparkleY[i], { toValue: -5, duration: driftDur + 400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      );
      return { opLoop, xLoop, yLoop, delay: i * 400 };
    });
    anims.forEach(({ opLoop, xLoop, yLoop, delay }) =>
      setTimeout(() => { opLoop.start(); xLoop.start(); yLoop.start(); }, delay),
    );
    return () => anims.forEach(({ opLoop, xLoop, yLoop }) => { opLoop.stop(); xLoop.stop(); yLoop.stop(); });
  }, [nameSparkleOp, nameSparkleX, nameSparkleY]);

  // ─── Name glow breathing + tap scale (must be before early returns) ───
  const nameGlowOp = useRef(new Animated.Value(0.7)).current;
  const nameTapScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(nameGlowOp, { toValue: 1,   duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(nameGlowOp, { toValue: 0.7, duration: 2500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    glow.start();
    return () => glow.stop();
  }, [nameGlowOp]);

  // ─── Loading state ───
  // ─── Gradient background wrapper ───
  const GradientBg = useCallback(({ children }: { children: React.ReactNode }) => (
    isDark ? (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {children}
      </SafeAreaView>
    ) : (
      <LinearGradient
        colors={['#E0F2FE', '#E4F3FC', '#EDF8FF', '#F5FBFF', '#E4F5FC', '#E0F2FE']}
        locations={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          {children}
        </SafeAreaView>
      </LinearGradient>
    )
  ), [isDark, colors.background]);

  if (loading) {
    return (
      <GradientBg>
        {/* Back button while loading */}
        <View style={styles.backBar}>
          <TouchableOpacity
            onPress={() => router.replace('/clinics' as any)}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#F0F2F5' : '#1A2B3F'} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#3D9EFF" />
        </View>
      </GradientBg>
    );
  }

  // ─── Visitor inactive guard ───
  if (visitorInactive) {
    return (
      <GradientBg>
        <View style={styles.backBar}>
          <TouchableOpacity onPress={() => router.replace('/clinics' as any)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={isDark ? '#F0F2F5' : '#1A2B3F'} />
          </TouchableOpacity>
        </View>
        <View style={styles.inactiveWrap}>
          <Ionicons name="business-outline" size={56} color={isDark ? '#454F5C' : '#B0BAC5'} />
          <Text style={[styles.inactiveTitle, { color: isDark ? '#8A96A6' : '#7A8A9C' }]}>
            Clinic Unavailable
          </Text>
          <Text style={[styles.inactiveSubtitle, { color: isDark ? '#5A6878' : '#B0BAC5' }]}>
            This clinic is currently not available.
          </Text>
        </View>
      </GradientBg>
    );
  }

  // ─── Dot color logic ───
  const dotColor = ownerInactive
    ? '#94A3B8' // GRAY  — subscription inactive
    : manualClose
      ? '#EF4444' // RED  — owner manually closed
      : manualOpen
        ? '#10B981' // GREEN — owner manually opened
        : openStatus?.status === 'closed'
          ? '#EF4444' // RED  — closed by schedule
          : openStatus?.status === 'open'
            ? '#10B981' // GREEN — open by schedule
            : '#94A3B8'; // GRAY — status not yet loaded

  // ─── Header component for FlatList ───
  const ListHeader = (
    <>
      {/* ══════ Header Sparkle Layer ══════ */}
      <View style={sparkleStyles.layer} pointerEvents="none">
        {([
          { top: 18, left: 35,  type: 'small' },
          { top: 42, left: 115, type: 'medium' },
          { top: 24, right: 50, type: 'glow' },
          { top: 56, right: 125, type: 'small' },
          { top: 12, left: 195, type: 'medium' },
          { top: 48, left: 70,  type: 'glow' },
          { top: 32, right: 22, type: 'small' },
          { top: 38, left: 160, type: 'medium' },
        ] as const).map(({ type, ...pos }, i) => (
          <Animated.View
            key={i}
            style={[
              type === 'small' ? sparkleStyles.dotSmall
                : type === 'medium' ? sparkleStyles.dotMedium
                : sparkleStyles.dotGlow,
              pos,
              {
                opacity: sparkleOpacities[i],
                transform: [{ translateY: sparkleDrifts[i] }],
              },
            ]}
          />
        ))}
      </View>

      {/* ══════ Top Navigation Bar ══════ */}
      <View style={styles.navBar}>
        <View style={styles.navLeft}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.navBtn}
            activeOpacity={0.7}
            onPress={() => router.replace('/clinics' as any)}
          >
            <Ionicons name="arrow-back" size={24} color={isDark ? '#F0F2F5' : '#1A2B3F'} />
          </TouchableOpacity>
        </View>

        {/* Centered clinic name in header */}
        <View style={styles.navCenter}>
          <Pressable
            onPressIn={() => Animated.spring(nameTapScale, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
            onPressOut={() => Animated.spring(nameTapScale, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
          >
          <Animated.View style={[styles.heroTitleWrap, { transform: [{ scale: nameTapScale }] }]}>
            {/* Name sparkle orbit */}
            <View style={nameSparkleStyles.orbit} pointerEvents="none">
              {([
                { top: -5, left: 16,  type: 'small' },
                { top: 14, right: -4, type: 'glow' },
                { top: 6,  left: 80,  type: 'medium' },
              ] as const).map(({ type, ...pos }, i) => (
                <Animated.View
                  key={`ns${i}`}
                  style={[
                    type === 'small' ? nameSparkleStyles.dotSmall
                      : type === 'medium' ? nameSparkleStyles.dotMedium
                      : nameSparkleStyles.dotGlow,
                    pos,
                    {
                      opacity: nameSparkleOp[i],
                      transform: [
                        { translateX: nameSparkleX[i] },
                        { translateY: nameSparkleY[i] },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
            <Text
              style={[styles.navTitle, { color: isDark ? '#F0F2F5' : '#0F172A' }]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            <View style={styles.heroUnderline} />
          </Animated.View>
          </Pressable>
        </View>

        <View style={styles.navRight}>
          {isOwner && (
            <>
              <TouchableOpacity
                style={styles.navBtn}
                activeOpacity={0.7}
                onPress={() => router.push('/notifications' as any)}
              >
                <Ionicons name="notifications-outline" size={24} color={isDark ? '#F0F2F5' : '#1A2B3F'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.navBtn}
                activeOpacity={0.7}
                onPress={() => router.push(`/clinic/clinic-settings?clinicId=${clinicId}`)}
              >
                <Ionicons name="ellipsis-vertical" size={22} color={isDark ? '#F0F2F5' : '#1A2B3F'} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Status dot positioned under the ⋮ menu — owner + subscribed only */}
      {isOwner && auth.isSubscribed === true && (
        <View style={styles.dotWrap} pointerEvents="box-none">
          <Pressable
            onPress={canToggleDot ? () => setStatusMenuVisible(true) : undefined}
            style={styles.dotPressable}
          >
            <Animated.View
              style={[
                styles.statusDot,
                { backgroundColor: dotColor, transform: [{ scale: dotPulse }], opacity: dotOpacity },
              ]}
            />
          </Pressable>
        </View>
      )}

      {/* ══════ Owner Inactive Banner ══════ */}
      {ownerInactive && (
        <View style={[styles.inactiveBanner, { backgroundColor: isDark ? 'rgba(148,163,184,0.10)' : 'rgba(148,163,184,0.08)' }]}>
          <Ionicons name="alert-circle-outline" size={20} color="#94A3B8" />
          <Text style={[styles.inactiveBannerText, { color: isDark ? '#8A96A6' : '#7A8A9C' }]}>
            Your subscription is inactive. Renew to reactivate your clinic.
          </Text>
          <TouchableOpacity
            style={styles.renewCta}
            activeOpacity={0.7}
            onPress={() => router.push('/clinic/subscribe' as any)}
          >
            <Text style={styles.renewCtaText}>Renew</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ══════ Profile Header ══════ */}
      <View style={styles.profileSection}>
        <View style={styles.avatarRow}>
          <View style={styles.avatarWrap}>
            <StarAvatar size={110} uri={profileImageUri} borderWidth={3} />
            {uploadingImage && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#FFF" />
              </View>
            )}
          </View>

          {isOwner && !ownerInactive && (
            <TouchableOpacity style={styles.navBtn} activeOpacity={0.7} onPress={openCreateSheet}>
              <Ionicons name="add" size={26} color={isDark ? '#F0F2F5' : '#1A2B3F'} />
            </TouchableOpacity>
          )}
        </View>

        <ClinicTypeBadge clinicType={clinic?.clinicType} />

        <View style={styles.profileRow}>
          {/* ── Left: Contact Column ── */}
          <View style={styles.contactColumn}>
            {!!locationLine && (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={isDark ? '#8A96A6' : '#7A8A9C'} />
                <Text style={[styles.infoText, { color: isDark ? '#C0CAD4' : '#1A2B3F', fontSize: 20, fontWeight: '700' }]}>
                  {locationLine}
                </Text>
              </View>
            )}

            {!!phone && (
              <TouchableOpacity style={styles.infoRow} onPress={handleCall} activeOpacity={0.6}>
                <Ionicons name="call-outline" size={17} color="#3D9EFF" />
                <Text style={[styles.infoText, { color: '#3D9EFF', fontSize: 17, fontWeight: '700' }]}>{phone}</Text>
              </TouchableOpacity>
            )}

          </View>

          {/* ── Right: Working Hours Column ── */}
          {!!clinic?.workingHours && (
            <View style={styles.hoursColumn}>
              <Pressable onPress={openHoursCard} style={[
                styles.hoursCardCollapsed,
                { backgroundColor: isDark ? 'rgba(61,158,255,0.08)' : 'rgba(61,158,255,0.10)',
                  borderColor: isDark ? 'rgba(61,158,255,0.20)' : 'rgba(61,158,255,0.25)' },
              ]}>
                <View style={styles.hoursCardHeader}>
                  <Ionicons name="time-outline" size={15} color="#3D9EFF" />
                  <Text style={[styles.hoursCardTitle, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>
                    Working Hours
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={isDark ? '#8A96A6' : '#7A8A9C'} />
                </View>
                {hoursSummaryLines.map((line, i) => (
                  <Text key={i} style={[styles.hoursCardLine, { color: isDark ? '#8A96A6' : '#6A7A8C' }]}>
                    {line}
                  </Text>
                ))}
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Map Preview Card ── */}
        {!!(clinic?.location?.lat && clinic?.location?.lng) && (
          <ClinicProfileMapCard
            latitude={clinic.location.lat}
            longitude={clinic.location.lng}
            clinicName={displayName}
            address={clinic.location.address}
            distanceText={distanceText}
            driveTimeText={driveTimeText}
            onPress={handleGetDirections}
          />
        )}
      </View>

      {/* ══════ Section Divider + Posts / Reels ══════ */}
      <View style={styles.tabsContainer}>
        <View style={[styles.profileDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

        {/* ══════ Posts / Reels Tabs ══════ */}
        <View style={[styles.tabBar, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
          activeOpacity={0.7}
        >
          <Ionicons
            name="grid-outline"
            size={22}
            color={activeTab === 'posts' ? (isDark ? '#F0F2F5' : '#1A2B3F') : (isDark ? '#5A6878' : '#B0BAC5')}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'posts' ? (isDark ? '#F0F2F5' : '#1A2B3F') : (isDark ? '#5A6878' : '#B0BAC5'),
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
            color={activeTab === 'reels' ? (isDark ? '#F0F2F5' : '#1A2B3F') : (isDark ? '#5A6878' : '#B0BAC5')}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: activeTab === 'reels' ? (isDark ? '#F0F2F5' : '#1A2B3F') : (isDark ? '#5A6878' : '#B0BAC5'),
                fontWeight: activeTab === 'reels' ? '700' : '500',
              },
            ]}
          >
            Reels
          </Text>
        </TouchableOpacity>
        </View>
      </View>
    </>
  );

  // ─── Empty state ───
  const EmptyGrid = (
    <View style={styles.emptyGrid}>
      <Ionicons
        name={activeTab === 'posts' ? 'camera-outline' : 'videocam-outline'}
        size={48}
        color={isDark ? '#454F5C' : '#B0BAC5'}
      />
      <Text style={[styles.emptyText, { color: isDark ? '#5A6878' : '#B0BAC5' }]}>
        {activeTab === 'posts' ? 'No posts yet' : 'No reels yet'}
      </Text>
    </View>
  );

  return (
    <GradientBg>
      <FlatList
        data={filteredMedia}
        renderItem={renderMediaItem}
        keyExtractor={keyExtractor}
        numColumns={NUM_COLUMNS}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={mediaLoading ? (
          <View style={styles.emptyGrid}>
            <ActivityIndicator size="small" color="#3D9EFF" />
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
      {/* ══════ Expanded Working Hours Modal ══════ */}
      {hoursExpanded && clinic?.workingHours && (
        <Modal visible transparent animationType="none" statusBarTranslucent>
          <View style={hoursModalStyles.root}>
            {/* Overlay backdrop */}
            <Pressable style={StyleSheet.absoluteFill} onPress={closeHoursCard}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: 'rgba(0,0,0,0.35)',
                    opacity: hoursOverlay,
                  },
                ]}
              />
            </Pressable>

            {/* Expanded card */}
            <Animated.View
              style={[
                hoursModalStyles.card,
                {
                  backgroundColor: isDark ? 'rgba(30,42,60,0.97)' : 'rgba(255,255,255,0.92)',
                  borderColor: isDark ? 'rgba(61,158,255,0.18)' : 'rgba(61,158,255,0.25)',
                  transform: [
                    { scale: hoursScale },
                    { translateY: hoursTranslateY },
                  ],
                  opacity: hoursOverlay,
                },
              ]}
            >
              <Pressable onPress={closeHoursCard}>
                {/* Header */}
                <View style={hoursModalStyles.header}>
                  <Ionicons name="time-outline" size={20} color="#3D9EFF" />
                  <Text style={[hoursModalStyles.title, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>
                    Working Hours
                  </Text>
                  <Ionicons name="chevron-up" size={16} color={isDark ? '#8A96A6' : '#7A8A9C'} />
                </View>

                {/* Open/Closed status */}
                {(() => {
                  const effectiveOpen = manualClose ? false : manualOpen ? true : openStatus?.status === 'open';
                  const isManual = manualClose || manualOpen;
                  const statusColor = effectiveOpen ? '#10B981' : '#EF4444';
                  const statusLabel = effectiveOpen ? 'Open Now' : 'Closed Now';
                  const subLabel = manualClose
                    ? 'Manually closed'
                    : manualOpen
                      ? 'Manual override'
                      : statusSubtitle;
                  return (
                    <Animated.View style={[
                      hoursModalStyles.statusRow,
                      {
                        opacity: statusRowAnim,
                        transform: [{ translateY: statusRowAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                      },
                    ]}>
                      <View
                        style={[
                          hoursModalStyles.statusDot,
                          { backgroundColor: statusColor },
                        ]}
                      />
                      <Text
                        style={[
                          hoursModalStyles.statusText,
                          { color: statusColor },
                        ]}
                      >
                        {statusLabel}
                      </Text>
                      <Text style={[hoursModalStyles.statusSub, { color: isDark ? '#8A96A6' : '#6B7280' }]}>
                        {subLabel}
                      </Text>
                      {closingSoon && !isManual && (
                        <Text style={hoursModalStyles.closingSoonBadge}>
                          Closing Soon
                        </Text>
                      )}
                    </Animated.View>
                  );
                })()}

                {/* Full schedule */}
                {DAYS_ORDER.map((day, idx) => {
                  const ds = clinic.workingHours![day];
                  const isLast = idx === DAYS_ORDER.length - 1;
                  const anim = rowAnims[idx];
                  return (
                    <Animated.View
                      key={day}
                      style={[
                        hoursModalStyles.row,
                        !isLast && {
                          borderBottomWidth: 0.5,
                          borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                        },
                        {
                          opacity: anim,
                          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
                        },
                      ]}
                    >
                      <Text style={[hoursModalStyles.dayLabel, { color: isDark ? '#F0F2F5' : '#2A3A52' }]}>
                        {formatDayLabel(day)}
                      </Text>
                      <Text
                        style={[
                          hoursModalStyles.dayValue,
                          { color: ds.enabled ? (isDark ? '#7BB8FF' : '#3D9EFF') : (isDark ? '#5A6878' : '#9AA5B1') },
                        ]}
                      >
                        {ds.enabled ? `${ds.open} – ${ds.close}` : 'Closed'}
                      </Text>
                    </Animated.View>
                  );
                })}
              </Pressable>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* ══════ Clinic Status Menu (Owner) ══════ */}
      {statusMenuVisible && canToggleDot && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setStatusMenuVisible(false)}
        >
          <Pressable
            style={statusMenuStyles.overlay}
            onPress={() => setStatusMenuVisible(false)}
          >
            <View style={[
              statusMenuStyles.card,
              { backgroundColor: isDark ? 'rgba(30,42,60,0.97)' : 'rgba(255,255,255,0.96)' },
            ]}>
              <Text style={[statusMenuStyles.heading, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>
                Clinic Status
              </Text>

              <TouchableOpacity
                style={[
                  statusMenuStyles.option,
                  manualOpen && statusMenuStyles.optionActive,
                ]}
                activeOpacity={0.7}
                onPress={() => { setClinicStatus('open'); setStatusMenuVisible(false); }}
              >
                <View style={[statusMenuStyles.optionDot, { backgroundColor: '#10B981' }]} />
                <Text style={[statusMenuStyles.optionText, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>
                  Open Clinic Now
                </Text>
                {manualOpen && <Ionicons name="checkmark" size={18} color="#10B981" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  statusMenuStyles.option,
                  manualClose && statusMenuStyles.optionActive,
                ]}
                activeOpacity={0.7}
                onPress={() => { setClinicStatus('close'); setStatusMenuVisible(false); }}
              >
                <View style={[statusMenuStyles.optionDot, { backgroundColor: '#EF4444' }]} />
                <Text style={[statusMenuStyles.optionText, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>
                  Close Clinic Now
                </Text>
                {manualClose && <Ionicons name="checkmark" size={18} color="#EF4444" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  statusMenuStyles.option,
                  !manualClose && !manualOpen && statusMenuStyles.optionActive,
                ]}
                activeOpacity={0.7}
                onPress={() => { setClinicStatus('schedule'); setStatusMenuVisible(false); }}
              >
                <View style={[statusMenuStyles.optionDot, { backgroundColor: '#3D9EFF' }]} />
                <Text style={[statusMenuStyles.optionText, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>
                  Return to Schedule
                </Text>
                {!manualClose && !manualOpen && <Ionicons name="checkmark" size={18} color="#3D9EFF" />}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* ══════ Create Post/Reel Modal ══════ */}
      {clinicId && (
        <CreatePostModal
          visible={createPostVisible}
          onClose={() => setCreatePostVisible(false)}
          clinicId={clinicId}
          clinicName={clinic?.clinicName}
          initialType={createPostType}
          isDark={isDark}
        />
      )}
    </GradientBg>
  );
}

/* ── Expanded Hours Modal Styles ── */

const sparkleStyles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    height: 80,
    overflow: 'hidden',
    zIndex: 0,
  },
  glow: {
    position: 'absolute',
    top: -20,
    left: '30%' as any,
    width: 160,
    height: 80,
    borderRadius: 80,
    backgroundColor: 'rgba(61,158,255,0.12)',
  },
  dotSmall: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotMedium: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotGlow: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOpacity: 0.6,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 1,
      },
    }),
  },
});

/* ── Name Sparkle Styles ── */
const nameSparkleStyles = StyleSheet.create({
  orbit: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'visible',
  },
  glowLayer: {
    position: 'absolute',
    top: '-20%' as any,
    left: '-5%' as any,
    width: '110%' as any,
    height: '140%' as any,
    borderRadius: 24,
    backgroundColor: 'rgba(61,158,255,0.12)',
  },
  dotSmall: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotMedium: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotGlow: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOpacity: 0.6,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 0 },
      },
      android: {
        elevation: 1,
      },
    }),
  },
});

const hoursModalStyles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '85%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingVertical: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#3D9EFF',
        shadowOpacity: 0.12,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusSub: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 13,
    marginTop: 2,
  },
  closingSoonBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 6,
    marginTop: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});

/* ── Status Menu Styles ── */
const statusMenuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '80%',
    maxWidth: 340,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOpacity: 0.15,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
    }),
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: 'rgba(61,158,255,0.08)',
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});

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
  inactiveWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  inactiveTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  inactiveSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  inactiveBannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  renewCta: {
    backgroundColor: '#3D9EFF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  renewCtaText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
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
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 12 : 4,
    paddingBottom: 8,
    minHeight: 48,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 40,
    zIndex: 1,
  },
  navCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleWrap: {
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(61,158,255,0.06)',
  },
  navTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0,
    marginBottom: 4,
  },
  heroUnderline: {
    width: 64,
    height: 3,
    borderRadius: 3,
    marginTop: 6,
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    opacity: 0.9,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderTopWidth: 0.5,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 3,
      },
    }),
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
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 0,
    paddingHorizontal: 18,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatarWrap: {
    marginBottom: 12,
    alignSelf: 'flex-start',
    marginLeft: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 8,
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

  dotWrap: {
    alignItems: 'flex-end',
    paddingRight: 31,
    marginTop: 14,
    marginBottom: 0,
  },
  dotPressable: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOpacity: 0.15,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 22,
  },
  contactColumn: {
    flex: 1,
  },
  hoursColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  hoursCardCollapsed: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    width: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#3D9EFF',
        shadowOpacity: 0.10,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  hoursCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  hoursCardTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  hoursCardLine: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.05,
  },
  profileDivider: {
    height: 1,
    marginTop: 0,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  tabsContainer: {
    marginTop: 0,
  },

  /* ── Tabs ── */
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginTop: 0,
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
    borderBottomColor: '#3D9EFF',
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
