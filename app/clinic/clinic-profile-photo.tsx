import { db, storage } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import StarAvatar from '@/src/components/StarAvatar';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { fetchClinicData } from '@/src/utils/clinicDataUtils';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#3D9EFF';
const ACCENT_DARK = '#1E6FD9';
const VIOLET = '#8B5CF6';
const ROSE = '#E11D48';

function deriveInitials(name?: string | null): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function ClinicProfilePhotoScreen() {
  useClinicRoleGuard(['owner']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState<string>('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clinicId) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchClinicData(clinicId);
        if (cancelled) return;
        setPhotoUrl(data?.profileImageUrl ?? null);
        setClinicName(data?.clinicName ?? '');
      } catch (err) {
        console.error('[CLINIC_PHOTO] load error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const nameOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.78, 1] });
  const nameScale = shimmer.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] });

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/settings' as any);
  };

  const handleUpload = async () => {
    if (uploading || removing) return;
    if (!clinicId) {
      setErrorText('Missing clinic session. Please reopen the page.');
      return;
    }
    setErrorText(null);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow photo library access to upload a profile image.',
      );
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

    setUploading(true);
    try {
      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response);
        xhr.onerror = () => reject(new Error('Failed to read image'));
        xhr.responseType = 'blob';
        xhr.open('GET', uri, true);
        xhr.send(null);
      });

      const storageRef = ref(storage, `clinics/${clinicId}/profile.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: 'image/jpeg',
      });

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

      await Promise.all([
        setDoc(
          doc(db, 'clinics', clinicId),
          { profileImageUrl: downloadURL },
          { merge: true },
        ),
        setDoc(
          doc(db, 'clinics_public', clinicId),
          { heroImage: downloadURL },
          { merge: true },
        ),
      ]);

      setPhotoUrl(downloadURL);
      Alert.alert('Success', 'Clinic profile photo updated.');
    } catch (err) {
      console.error('[CLINIC_PHOTO] upload error', err);
      setErrorText('Could not upload the image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (uploading || removing) return;
    if (!photoUrl) return;
    if (!clinicId) {
      setErrorText('Missing clinic session. Please reopen the page.');
      return;
    }

    Alert.alert(
      'Remove photo',
      'Your clinic will appear without a profile photo across BeSmile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoving(true);
            setErrorText(null);
            try {
              await Promise.all([
                setDoc(
                  doc(db, 'clinics', clinicId),
                  { profileImageUrl: '' },
                  { merge: true },
                ),
                setDoc(
                  doc(db, 'clinics_public', clinicId),
                  { heroImage: '' },
                  { merge: true },
                ),
              ]);
              setPhotoUrl(null);
            } catch (err) {
              console.error('[CLINIC_PHOTO] remove error', err);
              setErrorText('Could not remove the photo. Please try again.');
            } finally {
              setRemoving(false);
            }
          },
        },
      ],
    );
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const tintedBg = isDark ? 'rgba(61,158,255,0.10)' : 'rgba(186,230,253,0.22)';
  const tintedBorder = isDark ? 'rgba(61,158,255,0.22)' : 'rgba(125,211,252,0.45)';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';
  const ghostBorder = isDark ? 'rgba(225,29,72,0.45)' : 'rgba(225,29,72,0.35)';
  const ghostBg = isDark ? 'rgba(225,29,72,0.10)' : 'rgba(225,29,72,0.06)';

  const initials = deriveInitials(clinicName);
  const hasPhoto = !!photoUrl;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: pressed ? backBgPressed : backBg },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={backIconColor} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            Clinic profile photo
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Your face across BeSmile
          </Text>
        </View>

        <View
          style={[
            styles.headerPin,
            { backgroundColor: 'rgba(139,92,246,0.16)' },
          ]}
        >
          <Ionicons name="image-outline" size={20} color={VIOLET} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.eyebrow, { color: textSecondary }]}>
            CLINIC IDENTITY
          </Text>

          <View
            style={[
              styles.heroCard,
              { backgroundColor: tintedBg, borderColor: tintedBorder },
            ]}
          >
            <Animated.Text
              style={[
                styles.clinicName,
                {
                  color: textPrimary,
                  opacity: nameOpacity,
                  transform: [{ scale: nameScale }],
                  textShadowColor: isDark
                    ? 'rgba(125,211,252,0.55)'
                    : 'rgba(46,91,255,0.35)',
                },
              ]}
              numberOfLines={2}
            >
              {clinicName || 'Your clinic'}
            </Animated.Text>

            <View style={styles.avatarWrap}>
              <StarAvatar
                size={140}
                uri={photoUrl}
                initials={initials}
                variant="profile"
                borderWidth={3}
                showSparkle={hasPhoto}
              />
            </View>

            <Text style={[styles.caption, { color: textPrimary }]}>
              This photo represents your clinic across BeSmile. Your public
              profile, clinic search, and your dashboard.
            </Text>

            <View style={styles.updatesRow}>
              <Ionicons
                name="sync-outline"
                size={13}
                color={ACCENT}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.updatesText, { color: ACCENT }]}>
                Updates everywhere
              </Text>
            </View>
          </View>

          {errorText && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={ROSE} />
              <Text style={styles.errorText}>{errorText}</Text>
            </View>
          )}

          <Pressable
            onPress={handleUpload}
            disabled={uploading || removing}
            style={({ pressed }) => [
              styles.primaryBtnWrap,
              {
                transform: [{ scale: pressed && !uploading ? 0.98 : 1 }],
                opacity: uploading || removing ? 0.7 : 1,
              },
            ]}
          >
            <LinearGradient
              colors={[ACCENT, ACCENT_DARK] as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtn}
            >
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.primaryBtnInner}>
                  <Ionicons
                    name={hasPhoto ? 'camera-reverse-outline' : 'cloud-upload-outline'}
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryBtnText}>
                    {hasPhoto ? 'Replace photo' : 'Upload new photo'}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </Pressable>

          {hasPhoto && (
            <Pressable
              onPress={handleRemove}
              disabled={uploading || removing}
              style={({ pressed }) => [
                styles.ghostBtn,
                {
                  backgroundColor: ghostBg,
                  borderColor: ghostBorder,
                  transform: [{ scale: pressed && !removing ? 0.98 : 1 }],
                  opacity: uploading || removing ? 0.7 : 1,
                },
              ]}
            >
              {removing ? (
                <ActivityIndicator color={ROSE} />
              ) : (
                <View style={styles.primaryBtnInner}>
                  <Ionicons name="trash-outline" size={16} color={ROSE} />
                  <Text style={styles.ghostBtnText}>Remove photo</Text>
                </View>
              )}
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 21, fontWeight: '800', marginBottom: 2 },
  headerSubtitle: { fontSize: 12.5 },
  headerPin: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 8 },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 8,
  },

  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
  },
  clinicName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
    textAlign: 'center',
    marginBottom: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  avatarWrap: {
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#3D9EFF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: { elevation: 8 },
    }),
  },
  caption: {
    fontSize: 13.5,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 4,
    opacity: 0.85,
  },
  updatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  updatesText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  errorText: {
    color: ROSE,
    fontSize: 12.5,
    fontWeight: '600',
    flexShrink: 1,
  },

  primaryBtnWrap: {
    borderRadius: 16,
    marginTop: 18,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  ghostBtn: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    color: ROSE,
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
