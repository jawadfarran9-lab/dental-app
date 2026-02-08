import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ClinicRatingSheetProps {
  visible: boolean;
  clinicName: string;
  onClose: () => void;
  onSubmit?: (rating: number, feedback: string) => void;
  onFiveStarCelebration?: () => void;
}

const ClinicRatingSheet: React.FC<ClinicRatingSheetProps> = ({
  visible,
  clinicName,
  onClose,
  onSubmit,
  onFiveStarCelebration,
}: ClinicRatingSheetProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  // Theme-aware star color: blue for light, gold for dark
  const starColor = isDark ? '#D4AF37' : '#0a7ea4';

  const handleSubmit = useCallback(() => {
    if (rating === 0) {
      Alert.alert(t('common.validation'), t('clinicRating.validationError'));
      return;
    }

    // Trigger 5-star celebration if available
    if (rating === 5 && onFiveStarCelebration) {
      onFiveStarCelebration();
    }

    if (onSubmit) {
      onSubmit(rating, feedback);
    }

    Alert.alert(t('common.success'), t('clinicRating.ratingSubmitted'));
    setRating(0);
    setFeedback('');
    onClose();
  }, [rating, feedback, onClose, onSubmit, t, onFiveStarCelebration]);

  const handleCancel = useCallback(() => {
    setRating(0);
    setFeedback('');
    onClose();
  }, [onClose]);

  const styles = React.useMemo(
    () =>
      createStyles(colors, isDark, starColor, isRTL),
    [colors, isDark, starColor, isRTL]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={[styles.overlay]}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {t('clinicRating.title')}
              </Text>
              <TouchableOpacity
                onPress={handleCancel}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* Clinic Name */}
            <Text
              style={[
                styles.clinicName,
                { color: colors.textSecondary },
                isRTL && { textAlign: 'right' },
              ]}
            >
              {clinicName}
            </Text>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Rating Question */}
              <Text
                style={[
                  styles.question,
                  { color: colors.textPrimary },
                  isRTL && { textAlign: 'right' },
                ]}
              >
                {t('clinicRating.ratingTitle')}
              </Text>

              {/* Star Selector */}
              <View
                style={[
                  styles.starsContainer,
                  isRTL && { flexDirection: 'row-reverse' },
                ]}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={48}
                      color={star <= rating ? starColor : colors.cardBorder}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rating Label */}
              {rating > 0 && (
                <Text
                  style={[
                    styles.ratingLabel,
                    { color: starColor },
                    isRTL && { textAlign: 'right' },
                  ]}
                >
                  {rating === 1
                    ? `${rating} ${t('clinicRating.star')}`
                    : `${rating} ${t('clinicRating.stars')}`}
                </Text>
              )}

              {/* Feedback Label */}
              <Text
                style={[
                  styles.feedbackLabel,
                  { color: colors.textPrimary, marginTop: 20 },
                  isRTL && { textAlign: 'right' },
                ]}
              >
                {t('clinicRating.feedback')}
              </Text>

              {/* Feedback Textarea */}
              <TextInput
                style={[
                  styles.feedback,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.textPrimary,
                  },
                  isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                ]}
                placeholder={t('clinicRating.feedbackPlaceholder')}
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                numberOfLines={4}
                value={feedback}
                onChangeText={setFeedback}
                editable
              />

              {/* Buttons */}
              <View style={[styles.buttonRow, isRTL && { flexDirection: 'row-reverse' }]}>
                <TouchableOpacity
                  style={[styles.buttonCancel, { borderColor: colors.cardBorder }]}
                  onPress={handleCancel}
                >
                  <Text style={[styles.buttonText, { color: colors.textPrimary }]}>
                    {t('clinicRating.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.buttonSubmit,
                    { backgroundColor: rating > 0 ? starColor : colors.cardBorder },
                  ]}
                  onPress={handleSubmit}
                  disabled={rating === 0}
                >
                  <Text style={[styles.buttonSubmitText, { color: '#fff' }]}>
                    {t('clinicRating.submit')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (
  colors: any,
  isDark: boolean,
  starColor: string,
  isRTL: boolean
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 16,
      maxHeight: '85%',
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
    },
    clinicName: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 16,
    },
    scrollContent: {
      paddingBottom: 24,
    },
    question: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 20,
    },
    starsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    starButton: {
      padding: 4,
    },
    ratingLabel: {
      fontSize: 14,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 12,
    },
    feedbackLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    feedback: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginTop: 10,
      marginBottom: 20,
      height: 100,
      textAlignVertical: 'top',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'center',
    },
    buttonCancel: {
      flex: 1,
      borderWidth: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonSubmit: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    buttonText: {
      fontWeight: '700',
      fontSize: 14,
    },
    buttonSubmitText: {
      fontWeight: '700',
      fontSize: 14,
    },
  });

export default ClinicRatingSheet;
