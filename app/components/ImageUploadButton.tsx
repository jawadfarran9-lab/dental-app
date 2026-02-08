import { useTheme } from '@/src/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ImageUploadButtonProps {
  onImageSelected: (imageUri: string) => Promise<void>;
  isLoading?: boolean;
  sessionId?: string;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onImageSelected,
  isLoading = false,
  sessionId,
}: ImageUploadButtonProps) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const [showOptions, setShowOptions] = useState(false);

  const handleCameraCapture = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('media.permissionDenied'), t('media.cameraPermissionRequired'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setShowOptions(false);
        await onImageSelected(imageUri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(t('common.error'), t('media.failedToCapture'));
    }
  };

  const handleGalleryPick = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('media.permissionDenied'), t('media.galleryPermissionRequired'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setShowOptions(false);
        await onImageSelected(imageUri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert(t('common.error'), t('media.failedToPickImage'));
    }
  };

  const styles = StyleSheet.create({
    button: {
      backgroundColor: colors.buttonBackground,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      margin: 12,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.buttonText,
    },
    modal: {
      flex: 1,
      backgroundColor: colors.scrim,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 32,
      paddingTop: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 16,
      marginHorizontal: 16,
      textAlign: 'center',
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      gap: 12,
    },
    optionText: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    cancelButton: {
      marginHorizontal: 16,
      marginTop: 12,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.buttonSecondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.buttonSecondaryText,
    },
  });

  return (
    <>
      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={() => setShowOptions(true)}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <>
            <MaterialIcons name="add-a-photo" size={20} color={colors.buttonText} />
            <Text style={styles.buttonText}>{t('media.addImage')}</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={showOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptions(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('media.selectImageSource')}</Text>

            <TouchableOpacity
              style={styles.option}
              onPress={handleCameraCapture}
            >
              <MaterialIcons name="photo-camera" size={24} color={colors.accentBlue} />
              <Text style={styles.optionText}>{t('media.takePhoto')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.option}
              onPress={handleGalleryPick}
            >
              <MaterialIcons name="photo-library" size={24} color={colors.accentBlue} />
              <Text style={styles.optionText}>{t('media.pickFromGallery')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowOptions(false)}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default ImageUploadButton;
