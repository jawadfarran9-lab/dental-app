import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface AppStoreRatingPromptProps {
  visible: boolean;
  onClose: () => void;
  onRatePressed?: () => void;
}

const AppStoreRatingPrompt: React.FC<AppStoreRatingPromptProps> = ({
  visible,
  onClose,
  onRatePressed,
}: AppStoreRatingPromptProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  // Theme-aware CTA color: blue for light, gold for dark
  const ctaColor = isDark ? '#D4AF37' : '#0a7ea4';

  const handleRatePressed = useCallback(async () => {
    try {
      // Platform-specific store links
      const storeUrl = Platform.OS === 'ios'
        ? 'https://apps.apple.com/app/besmile' // Replace with actual App ID
        : 'https://play.google.com/store/apps/details?id=com.besmile'; // Replace with actual package

      // Attempt to open store review prompt via app store link
      const supported = await Linking.canOpenURL(storeUrl);
      if (supported) {
        await Linking.openURL(storeUrl);
      } else {
        // Fallback: show alert with manual store link
        Alert.alert(
          t('storeRating.title'),
          t('storeRating.body')
        );
      }

      if (onRatePressed) {
        onRatePressed();
      }

      onClose();
    } catch (error) {
      console.error('Store link error:', error);
      // Gracefully handle error - just close modal
      onClose();
    }
  }, [onRatePressed, onClose, t]);

  const handleNotNow = useCallback(() => {
    onClose();
  }, [onClose]);

  const styles = React.useMemo(
    () => createStyles(colors, isDark, ctaColor, isRTL),
    [colors, isDark, ctaColor, isRTL]
  );

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleNotNow}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Heart Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="heart" size={56} color={ctaColor} />
          </View>

          {/* Title */}
          <Text
            style={[
              styles.title,
              { color: colors.textPrimary },
              isRTL && { textAlign: 'right' },
            ]}
          >
            {t('storeRating.title')}
          </Text>

          {/* Body Text */}
          <Text
            style={[
              styles.body,
              { color: colors.textSecondary },
              isRTL && { textAlign: 'right' },
            ]}
          >
            {t('storeRating.body')}
          </Text>

          {/* Buttons */}
          <View style={[styles.buttonRow, isRTL && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity
              style={[styles.buttonNotNow, { borderColor: colors.cardBorder }]}
              onPress={handleNotNow}
            >
              <Text style={[styles.buttonNotNowText, { color: colors.textPrimary }]}>
                {t('storeRating.cta_not_now')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.buttonRate, { backgroundColor: ctaColor }]}
              onPress={handleRatePressed}
            >
              <Ionicons
                name="star"
                size={18}
                color={isDark ? '#000' : '#fff'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.buttonRateText,
                  { color: isDark ? '#000' : '#fff' },
                ]}
              >
                {t('storeRating.cta_rate')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (
  colors: any,
  isDark: boolean,
  ctaColor: string,
  isRTL: boolean
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      borderRadius: 20,
      paddingHorizontal: 24,
      paddingVertical: 28,
      marginHorizontal: 20,
      maxWidth: 320,
      alignItems: 'center',
    },
    closeButton: {
      alignSelf: 'flex-end',
      marginBottom: 8,
    },
    iconContainer: {
      marginBottom: 20,
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 12,
    },
    body: {
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 22,
      marginBottom: 24,
      textAlign: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    buttonNotNow: {
      flex: 1,
      borderWidth: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonNotNowText: {
      fontWeight: '700',
      fontSize: 14,
    },
    buttonRate: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    },
    buttonRateText: {
      fontWeight: '700',
      fontSize: 14,
    },
  });

export default AppStoreRatingPrompt;
