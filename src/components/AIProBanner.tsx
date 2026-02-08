/**
 * AI Pro Benefits Banner Component
 * Shows on home screen for clinics with AI Pro subscription
 * Highlights advanced features and benefits
 */

import { useTheme } from '@/src/context/ThemeContext';
import { trackAIProBannerClicked, trackAIProBannerShown } from '@/src/utils/aiProAnalytics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export interface AIProBannerProps {
  /**
   * Whether the banner should be visible
   */
  visible: boolean;

  /**
   * Clinic ID for analytics
   */
  clinicId?: string;

  /**
   * Callback when user clicks the banner
   */
  onPress?: () => void;
}

export const AIProBanner: React.FC<AIProBannerProps> = ({
  visible,
  clinicId,
  onPress,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  // Track banner impression
  useEffect(() => {
    if (visible) {
      trackAIProBannerShown(clinicId);
    }
  }, [visible, clinicId]);

  if (!visible) {
    return null;
  }

  const handlePress = async () => {
    // Track click
    await trackAIProBannerClicked(clinicId);

    // Call optional callback
    if (onPress) {
      onPress();
      return;
    }

    // Default: navigate to AI chat screen
    router.push('/(tabs)/ai');
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#2e1065' : '#f5e6ff',
          borderColor: '#d946ef',
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: isDark ? '#4c1d95' : '#fdf2f8' },
          ]}
        >
          <Ionicons name="sparkles" size={24} color="#d946ef" />
        </View>

        {/* Text */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: '#d946ef' }]}>
            ✨ {t('subscription.aiProAddOn', 'AI Pro')}
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('subscription.aiProDescription', 'Advanced AI features unlocked')}
          </Text>

          {/* Benefits */}
          <View style={styles.benefits}>
            {[
              t('subscription.aiProFeature1', 'Smart note generation'),
              t('subscription.aiProFeature2', 'Message analysis'),
              t('subscription.aiProFeature3', 'Recommendations'),
            ].map((benefit, idx) => (
              <View key={idx} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle-sharp" size={14} color="#d946ef" />
                <Text style={[styles.benefitText, { color: colors.textSecondary }]}>
                  {benefit}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Arrow */}
        <Ionicons name="chevron-forward" size={24} color="#d946ef" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
    marginHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
  },
  benefits: {
    gap: 4,
    marginTop: 6,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
