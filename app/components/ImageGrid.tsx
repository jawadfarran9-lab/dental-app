import { PatientMedia } from '@/src/types/media';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ImageGridProps {
  media: PatientMedia[];
  onSelectImage: (media: PatientMedia) => void;
  onDeleteImage: (mediaId: string) => Promise<void>;
  isClinic: boolean; // Only clinic can delete/annotate
  isLoading?: boolean;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  media,
  onSelectImage,
  onDeleteImage,
  isClinic,
  isLoading = false,
}: ImageGridProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.dark;
  const screenWidth = Dimensions.get('window').width;
  const itemWidth = (screenWidth - 48) / 2; // 2 columns with padding

  const handleDelete = (mediaId: string) => {
    if (!isClinic) return;

    Alert.alert(
      t('confirm'),
      t('deleteImageConfirm'),
      [
        { text: t('cancel'), onPress: () => {}, style: 'cancel' },
        {
          text: t('delete'),
          onPress: async () => {
            try {
              await onDeleteImage(mediaId);
            } catch (error) {
              Alert.alert(t('error'), t('failedToDeleteImage'));
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0B0F1A' : '#F5F5F5',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: isDark ? '#B0B0B0' : '#666',
      marginTop: 12,
      textAlign: 'center',
    },
    gridItem: {
      width: itemWidth,
      marginHorizontal: 8,
      marginVertical: 8,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: isDark ? '#1A1F2E' : '#FFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    imageContainer: {
      width: '100%',
      aspectRatio: 1,
      backgroundColor: isDark ? '#0F1419' : '#EEE',
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
      padding: 8,
      opacity: 0,
    },
    dateText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '600',
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginBottom: 4,
    },
    annotatedBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#D4AF37',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    annotatedBadgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#000',
    },
    deleteButton: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: '#FF6B6B',
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      opacity: 0,
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      </View>
    );
  }

  if (media.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="image-not-supported"
            size={48}
            color={isDark ? '#B0B0B0' : '#CCC'}
          />
          <Text style={styles.emptyText}>{t('noImagesUploaded')}</Text>
        </View>
      </View>
    );
  }

  const renderGridItem = ({ item }: { item: PatientMedia }) => {
    const displayUrl = item.annotatedUrl || item.originalUrl;
    const dateStr = new Date(item.createdAt).toLocaleDateString();

    return (
      <TouchableOpacity
        style={styles.gridItem}
        onPress={() => onSelectImage(item)}
        activeOpacity={0.8}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: displayUrl }} style={styles.image} />

          {item.hasAnnotation && (
            <View style={styles.annotatedBadge}>
              <Text style={styles.annotatedBadgeText}>ANNOTATED</Text>
            </View>
          )}

          {isClinic && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDelete(item.id)}
            >
              <MaterialIcons name="delete" size={18} color="#FFF" />
            </TouchableOpacity>
          )}

          <View style={[styles.overlay, { opacity: 1 }]}>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={media}
        renderItem={renderGridItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
        contentContainerStyle={{ paddingVertical: 8 }}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default ImageGrid;
