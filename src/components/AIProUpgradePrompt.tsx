/**
 * AI Pro Upgrade Prompt Modal
 * Shows when user tries to access Pro-only features
 * Encourages upgrade with benefits and call-to-action
 */

import { useTheme } from '@/src/context/ThemeContext';
import {
    trackUpgradePromptClicked,
    trackUpgradePromptShown,
} from '@/src/utils/aiProAnalytics';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export interface AIProUpgradePromptProps {
  /**
   * Whether the modal is visible
   */
  visible: boolean;

  /**
   * Callback when modal is closed
   */
  onClose: () => void;

  /**
   * Clinic ID for analytics
   */
  clinicId?: string;

  /**
   * Context for analytics (e.g., 'ai_chat', 'advanced_analysis')
   */
  context?: string;
}

export const AIProUpgradePrompt: React.FC<AIProUpgradePromptProps> = ({
  visible,
  onClose,
  clinicId,
  context,
}) => {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  // Track prompt impression
  useEffect(() => {
    if (visible) {
      trackUpgradePromptShown(clinicId, context);
    }
  }, [visible, clinicId, context]);

  const handleUpgrade = async () => {
    // Track click
    await trackUpgradePromptClicked(clinicId);

    // Close modal and navigate to subscription page
    onClose();
    router.push('/clinic/subscribe' as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.backdrop]} />
      </TouchableOpacity>

      {/* Modal Content */}
      <View style={styles.centeredView}>
        <View
          style={[
            styles.modalView,
            { backgroundColor: colors.background },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isDark ? '#4c1d95' : '#fdf2f8' },
              ]}
            >
              <Ionicons name="sparkles" size={32} color="#d946ef" />
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t('ai.featureGating.proFeatureOnly', 'Premium Feature')}
            </Text>

            {/* Description */}
            <Text
              style={[styles.description, { color: colors.textSecondary }]}
            >
              {t(
                'ai.featureGating.upgradePrompt',
                'Unlock advanced AI features with AI Pro',
              )}
            </Text>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <Text style={[styles.featuresTitle, { color: colors.textPrimary }]}>
                {t('subscription.aiProAddOn', 'AI Pro includes:')}
              </Text>

              {[
                {
                  icon: 'sparkles',
                  title: t(
                    'subscription.aiProFeature1',
                    'Intelligent note generation',
                  ),
                  description: 'Auto-generate treatment notes',
                },
                {
                  icon: 'chatbubble-ellipses',
                  title: t(
                    'subscription.aiProFeature2',
                    'Patient message analysis',
                  ),
                  description: 'Analyze patient messages',
                },
                {
                  icon: 'bulb',
                  title: t(
                    'subscription.aiProFeature3',
                    'Treatment recommendations',
                  ),
                  description: 'Get AI-powered suggestions',
                },
              ].map((feature, idx) => (
                <View key={idx} style={styles.featureItem}>
                  <View
                    style={[
                      styles.featureIconContainer,
                      {
                        backgroundColor: isDark ? '#2e1065' : '#fef5ff',
                      },
                    ]}
                  >
                    <Ionicons
                      name={feature.icon as any}
                      size={20}
                      color="#d946ef"
                    />
                  </View>
                  <View style={styles.featureInfo}>
                    <Text
                      style={[
                        styles.featureTitle,
                        { color: colors.textPrimary },
                      ]}
                    >
                      {feature.title}
                    </Text>
                    <Text
                      style={[
                        styles.featureDescription,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Pricing */}
            <View
              style={[
                styles.pricingContainer,
                {
                  backgroundColor: isDark ? '#1a1a2e' : '#f8f8ff',
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.price, { color: '#d946ef' }]}>
                $9.99/month
              </Text>
              <Text style={[styles.pricingNote, { color: colors.textSecondary }]}>
                {t('subscription.billedMonthly', 'Billed monthly')}
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.cardBorder }]}
              onPress={onClose}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                {t('common.notNow', 'Not now')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: '#d946ef' }]}
              onPress={handleUpgrade}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {t('ai.featureGating.upgradeButton', 'Get AI Pro')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalView: {
    borderRadius: 16,
    width: '100%',
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 20,
    lineHeight: 21,
  },
  featuresContainer: {
    gap: 12,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 12,
    fontWeight: '400',
  },
  pricingContainer: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  pricingNote: {
    fontSize: 12,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
