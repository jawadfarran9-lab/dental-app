import { useTheme } from '@/src/context/ThemeContext';
import { PatientMedia } from '@/src/types/media';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    Image,
    Modal,
    PanResponder,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface FullScreenImageViewerProps {
  visible: boolean;
  image: PatientMedia | null;
  onClose: () => void;
  onAnnotate?: (image: PatientMedia) => void;
  isClinic?: boolean;
}

export const FullScreenImageViewer: React.FC<FullScreenImageViewerProps> = ({
  visible,
  image,
  onClose,
  onAnnotate,
  isClinic = false,
}: FullScreenImageViewerProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
  });

  const styles = StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: '#000',
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      paddingTop: 12 + (Platform.OS === 'ios' ? 20 : 0),
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFF',
    },
    closeButton: {
      padding: 8,
    },
    imageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000',
    },
    image: {
      width: screenWidth,
      height: screenHeight * 0.6,
      resizeMode: 'contain',
    },
    metadataContainer: {
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    metadataRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: 8,
    },
    metadataLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
      textTransform: 'uppercase',
    },
    metadataValue: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    annotationBadge: {
      backgroundColor: colors.buttonBackground,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    annotationBadgeText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.buttonText,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    buttonPrimary: {
      backgroundColor: colors.buttonBackground,
    },
    buttonSecondary: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    buttonTextPrimary: {
      color: colors.buttonText,
    },
    buttonTextSecondary: {
      color: colors.textPrimary,
    },
  });

  if (!image) return null;

  const displayUrl = image.annotatedUrl || image.originalUrl;
  const dateStr = new Date(image.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modal}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('imageViewer')}</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <MaterialIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Image Display */}
        <ScrollView
          style={styles.imageContainer}
          scrollEnabled={true}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <Image source={{ uri: displayUrl }} style={styles.image} />
        </ScrollView>

        {/* Metadata */}
        <View style={styles.metadataContainer}>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>{t('dateAdded')}</Text>
            <Text style={styles.metadataValue}>{dateStr}</Text>
          </View>

          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>{t('uploadedBy')}</Text>
            <Text style={styles.metadataValue}>{t('clinic')}</Text>
          </View>

          {image.hasAnnotation && (
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>{t('status')}</Text>
              <View style={styles.annotationBadge}>
                <Text style={styles.annotationBadgeText}>{t('annotated')}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        {isClinic && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                {t('close')}
              </Text>
            </TouchableOpacity>

            {onAnnotate && (
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => {
                  onAnnotate(image);
                  onClose();
                }}
              >
                <MaterialIcons name="edit" size={18} color="#000" />
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                  {t('annotate')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!isClinic && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                {t('close')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

export default FullScreenImageViewer;
