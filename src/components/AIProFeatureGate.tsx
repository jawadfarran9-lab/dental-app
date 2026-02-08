/**
 * AI Pro Feature Gate
 * Wrapper component that gates features behind Pro subscription
 * Shows upgrade prompt if user doesn't have Pro
 */

import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewProps,
} from 'react-native';
import { AIProUpgradePrompt } from './AIProUpgradePrompt';

export interface AIProFeatureGateProps extends ViewProps {
  /**
   * Whether user has AI Pro enabled
   */
  hasAIPro: boolean;

  /**
   * Clinic ID for analytics
   */
  clinicId?: string;

  /**
   * Context for analytics
   */
  context?: string;

  /**
   * Feature name for locked state display
   */
  featureName?: string;

  /**
   * Whether to show the locked overlay
   */
  showLocked?: boolean;

  /**
   * Children to render (only shown if hasAIPro or showLocked is false)
   */
  children: React.ReactNode;
}

/**
 * Component that gates AI features behind Pro subscription
 * Shows locked state with upgrade option if user doesn't have Pro
 */
export const AIProFeatureGate: React.FC<AIProFeatureGateProps> = ({
  hasAIPro,
  clinicId,
  context,
  featureName,
  showLocked = true,
  children,
  ...viewProps
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // If user has Pro, show content normally
  if (hasAIPro) {
    return <View {...viewProps}>{children}</View>;
  }

  // If feature is not locked (opt-out), show content anyway
  if (!showLocked) {
    return <View {...viewProps}>{children}</View>;
  }

  // Show locked state
  return (
    <View {...viewProps}>
      {/* Locked Overlay */}
      <View
        style={[
          styles.lockedContainer,
          { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)' },
        ]}
      >
        {/* Blurred Content (for visual reference) */}
        <View style={[styles.blurredContent, { opacity: 0.4 }]}>
          {children}
        </View>

        {/* Lock Overlay */}
        <View
          style={[
            styles.lockOverlay,
            { backgroundColor: isDark ? 'rgba(15, 15, 15, 0.9)' : 'rgba(255, 255, 255, 0.95)' },
          ]}
        >
          <View style={styles.lockContent}>
            <View
              style={[
                styles.lockIcon,
                { backgroundColor: isDark ? '#2e1065' : '#fdf2f8' },
              ]}
            >
              <Ionicons name="lock-closed" size={40} color="#d946ef" />
            </View>

            <Text style={[styles.lockTitle, { color: colors.textPrimary }]}>
              {t('ai.featureGating.proFeatureOnly', 'Premium Feature')}
            </Text>

            <Text
              style={[
                styles.lockDescription,
                { color: colors.textSecondary },
              ]}
            >
              {featureName
                ? t(
                    'ai.featureGating.limitedAccess',
                    'You have limited AI access. Upgrade for unlimited.',
                  )
                : t(
                    'ai.featureGating.upgradePrompt',
                    'Unlock advanced AI features with AI Pro',
                  )}
            </Text>

            <TouchableOpacity
              style={[styles.upgradeButton, { backgroundColor: '#d946ef' }]}
              onPress={() => setShowUpgradePrompt(true)}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.upgradeButtonText}>
                {t('ai.featureGating.upgradeButton', 'Get AI Pro')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Upgrade Prompt Modal */}
      <AIProUpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        clinicId={clinicId}
        context={context}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  lockedContainer: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 10,
  },
  blurredContent: {
    opacity: 0.4,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  lockContent: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  lockIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  lockTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  lockDescription: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 19,
  },
  upgradeButton: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
