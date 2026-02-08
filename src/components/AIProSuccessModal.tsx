/**
 * AI Pro Subscription Success Modal
 * Shows confirmation after successful AI Pro subscription
 */

import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Dimensions,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface AIProSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  onStartChat: () => void;
  planName?: string;
}

export function AIProSuccessModal({
  visible,
  onClose,
  onStartChat,
  planName = 'AI Pro',
}: AIProSuccessModalProps) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  
  const styles = useMemo(() => createStyles(colors), [colors]);

  const features = [
    {
      icon: 'sparkles',
      title: 'Detailed Analysis',
      description: 'Get in-depth explanations for all dental conditions',
    },
    {
      icon: 'medical',
      title: 'Treatment Plans',
      description: 'Receive comprehensive treatment recommendations',
    },
    {
      icon: 'shield-checkmark',
      title: 'Priority Support',
      description: 'Access premium support and resources',
    },
    {
      icon: 'trending-up',
      title: 'Advanced Features',
      description: 'Unlock all advanced AI analysis tools',
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          {/* Success Animation */}
          <View style={styles.animationContainer}>
            <View style={styles.successBadge}>
              <Ionicons name="checkmark" size={60} color={colors.success} />
            </View>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Title */}
            <Text style={[styles.title, { color: colors.text }]}>
              {t('aiPro.subscriptionSuccess') || 'AI Pro Activated!'}
            </Text>

            <Text style={[styles.subtitle, { color: colors.gray }]}>
              {t('aiPro.welcomeToAIPro') || 'Welcome to AI Pro. Your subscription is now active.'}
            </Text>

            {/* Plan Info */}
            <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.planHeader}>
                <Ionicons name="star" size={24} color={colors.primary} />
                <Text style={[styles.planName, { color: colors.text }]}>
                  {planName}
                </Text>
              </View>
              <Text style={[styles.planPrice, { color: colors.primary }]}>
                {t('aiPro.monthlyBilling') || 'Billed monthly'}
              </Text>
            </View>

            {/* Features List */}
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              {t('aiPro.nowUnlocked') || 'Now Unlocked:'}
            </Text>

            <View style={styles.featuresList}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.surface }]}>
                    <Ionicons
                      name={feature.icon as any}
                      size={24}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>
                      {feature.title}
                    </Text>
                    <Text style={[styles.featureDescription, { color: colors.gray }]}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={onStartChat}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>
                {t('aiPro.startChatting') || 'Start Chatting'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                {t('common.close') || 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modal: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: SCREEN_HEIGHT * 0.9,
      overflow: 'hidden',
    },
    animationContainer: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingTop: 30,
    },
    successBadge: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.success + '20',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.success,
    },
    content: {
      paddingHorizontal: 20,
      paddingVertical: 20,
    },
    contentContainer: {
      paddingBottom: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 14,
      marginBottom: 24,
      textAlign: 'center',
      lineHeight: 20,
    },
    planCard: {
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    planHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    planName: {
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
    planPrice: {
      fontSize: 12,
      marginLeft: 32,
    },
    featuresTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 12,
    },
    featuresList: {
      gap: 12,
      marginBottom: 20,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    featureContent: {
      flex: 1,
    },
    featureTitle: {
      fontSize: 13,
      fontWeight: '600',
      marginBottom: 2,
    },
    featureDescription: {
      fontSize: 12,
      lineHeight: 16,
    },
    buttonContainer: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
