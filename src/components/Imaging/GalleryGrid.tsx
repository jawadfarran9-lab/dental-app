/**
 * GalleryGrid Component
 * 
 * Displays a grid of patient images (X-rays/Photos) as thumbnails.
 * Used in the Patient Imaging Gallery screen.
 */

import { useTheme } from '@/src/context/ThemeContext';
import { PatientImage } from '@/src/types/imaging';
import { Ionicons } from '@expo/vector-icons';
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const GRID_SPACING = 4;
const ITEM_SIZE = (SCREEN_WIDTH - GRID_SPACING * (NUM_COLUMNS + 1)) / NUM_COLUMNS;

interface GalleryGridProps {
  images: PatientImage[];
  onImagePress: (image: PatientImage) => void;
}

export default function GalleryGrid({ images, onImagePress }: GalleryGridProps) {
  const { colors } = useTheme();

  if (images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No images yet
        </Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary, opacity: 0.7 }]}>
          Tap the + button to add images
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {images.map((image) => (
        <TouchableOpacity
          key={image.imageId}
          style={[styles.gridItem, { backgroundColor: colors.card }]}
          onPress={() => onImagePress(image)}
          activeOpacity={0.8}
        >
          <Image
            source={{
              uri: image.downloadUrlPreview || image.downloadUrlOriginal,
            }}
            style={styles.image}
            resizeMode="cover"
          />
          {/* Annotation indicator */}
          {(image.annotations?.strokes?.length > 0 ||
            image.annotations?.texts?.length > 0) && (
            <View style={styles.annotationBadge}>
              <Ionicons name="brush" size={12} color="#FFFFFF" />
            </View>
          )}
          {/* Image type indicator */}
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor:
                  image.type === 'xray' ? '#6366F1' : '#10B981',
              },
            ]}
          >
            <Ionicons
              name={image.type === 'xray' ? 'scan-outline' : 'camera-outline'}
              size={10}
              color="#FFFFFF"
            />
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_SPACING / 2,
    paddingTop: GRID_SPACING,
  },
  gridItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: GRID_SPACING / 2,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  annotationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#F59E0B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    borderRadius: 8,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
  },
});
