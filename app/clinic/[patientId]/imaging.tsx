/**
 * STEP G - Patient Imaging Gallery Screen
 * 
 * Gallery view with X-ray/Photos tabs
 * - Grid thumbnails
 * - Add image button
 * - Pagination (20 limit + Load More)
 */

import GalleryGrid from '@/src/components/Imaging/GalleryGrid';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { fetchPatientImages, uploadPatientImage } from '@/src/services/patientImages';
import { ImageType, PatientImage } from '@/src/types/imaging';
import { compressImage } from '@/src/utils/imageCompress';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PatientImagingScreen() {
  useClinicGuard(); // 🔐 حماية الصفحة - clinic members only
  
  const { patientId } = useLocalSearchParams();
  const { clinicId, clinicUser } = useClinic();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [activeTab, setActiveTab] = useState<ImageType>('xray');
  const [images, setImages] = useState<PatientImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!clinicUser || !clinicId || !patientId) {
      router.replace('/clinic/login' as any);
      return;
    }

    loadImages(true);
  }, [clinicId, patientId, activeTab, clinicUser]);

  const loadImages = async (isInitial: boolean = false) => {
    if (!clinicId || !patientId) return;

    if (isInitial) {
      setLoading(true);
      setImages([]);
      setLastDoc(null);
      setHasMore(false);
    } else {
      if (!hasMore || loadingMore) return;
      setLoadingMore(true);
    }

    try {
      const result = await fetchPatientImages(
        clinicId,
        patientId as string,
        activeTab,
        20,
        isInitial ? undefined : lastDoc || undefined
      );

      if (isInitial) {
        setImages(result.images);
      } else {
        setImages((prev) => [...prev, ...result.images]);
      }

      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error: any) {
      console.error('[LOAD IMAGES ERROR]', error);
      Alert.alert(t('clinicImaging.loadErrorTitle'), t('clinicImaging.loadErrorMessage'));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleAddImage = async () => {
    if (!clinicId || !patientId || !clinicUser) return;

    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('clinicImaging.permissionDeniedTitle'),
          t('clinicImaging.permissionDeniedMessage')
        );
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled) return;

      const imageUri = result.assets[0].uri;

      setUploading(true);
      setUploadProgress(0);

      // Compress image
      const compressed = await compressImage(imageUri);

      // Generate unique ID
      const imageId = `img_${Date.now()}`;

      // Upload to Firebase
      const uploadedImage = await uploadPatientImage(
        clinicId,
        patientId as string,
        imageId,
        compressed.uri,
        activeTab,
        compressed.width,
        compressed.height,
        clinicId,
        (progress) => {
          setUploadProgress(Math.round(progress));
        }
      );

      // Add to list
      setImages((prev) => [uploadedImage, ...prev]);

      Alert.alert(t('clinicImaging.uploadSuccessTitle'), t('clinicImaging.uploadSuccessMessage'));
    } catch (error: any) {
      console.error('[ADD IMAGE ERROR]', error);
      Alert.alert(
        t('clinicImaging.uploadErrorTitle'),
        error.message || t('clinicImaging.uploadErrorMessage')
      );
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleImagePress = (image: PatientImage) => {
    router.push(`/clinic/${patientId}/image/${image.imageId}` as any);
  };

  if (!clinicUser) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary }}>{t('clinicImaging.notAuthenticated')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}> 
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{t('clinicImaging.title')}</Text>
        <TouchableOpacity
          onPress={handleAddImage}
          style={[styles.addButton, { backgroundColor: colors.buttonBackground }]}
          disabled={uploading}
        >
          <Ionicons name="add" size={24} color={colors.buttonText} />
        </TouchableOpacity>
      </View>

      {/* Upload Progress */}
      {uploading && (
        <View style={[styles.uploadProgress, { backgroundColor: colors.bannerOverlay }]}> 
          <Text style={[styles.uploadText, { color: colors.accentBlue }]}>
            {t('clinicImaging.uploading', { progress: uploadProgress })}
          </Text>
          <ActivityIndicator color={colors.accentBlue} />
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'xray' && { borderBottomColor: colors.accentBlue, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('xray')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'xray' && { color: colors.accentBlue }]}>
            {t('clinicImaging.tabXray')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photo' && { borderBottomColor: colors.accentBlue, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('photo')}
        >
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTab === 'photo' && { color: colors.accentBlue }]}>
            {t('clinicImaging.tabPhotos')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Gallery */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2E8BFD" />
        </View>
      ) : (
        <ScrollView style={styles.gallery}>
          <GalleryGrid images={images} onImagePress={handleImagePress} />

          {/* Load More Button */}
          {hasMore && (
            <TouchableOpacity
              style={[styles.loadMoreButton, { backgroundColor: colors.card }]}
              onPress={() => loadImages(false)}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color={colors.accentBlue} />
              ) : (
                <Text style={[styles.loadMoreText, { color: colors.accentBlue }]}>
                  {t('clinicImaging.loadMore')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gallery: {
    flex: 1,
  },
  loadMoreButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
