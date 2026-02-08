/**
 * AI Pro Analytics Tracking
 * Tracks AI Pro subscription events, upgrades, and feature usage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export enum AIProAnalyticsEvent {
  AI_PRO_SELECTED = 'ai_pro_selected',
  AI_PRO_UPGRADED = 'ai_pro_upgraded',
  AI_FEATURE_USED = 'ai_feature_used',
  AI_CHAT_STARTED = 'ai_chat_started',
  UPGRADE_PROMPT_SHOWN = 'upgrade_prompt_shown',
  UPGRADE_PROMPT_CLICKED = 'upgrade_prompt_clicked',
  AI_PRO_BANNER_SHOWN = 'ai_pro_banner_shown',
  AI_PRO_BANNER_CLICKED = 'ai_pro_banner_clicked',
}

export interface AIProAnalyticsPayload {
  event: AIProAnalyticsEvent;
  clinicId?: string;
  userId?: string;
  featureName?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

/**
 * Log an AI Pro analytics event
 * Can be extended to send to Firebase Analytics, Mixpanel, or custom backend
 */
export async function logAIProAnalyticsEvent(payload: AIProAnalyticsPayload): Promise<void> {
  try {
    // Add timestamp if not provided
    const eventPayload: AIProAnalyticsPayload = {
      ...payload,
      timestamp: payload.timestamp || Date.now(),
    };

    // Store locally for batch upload later
    const logsKey = 'aiProAnalyticsLogs';
    const existingLogs = await AsyncStorage.getItem(logsKey);
    const logs = existingLogs ? JSON.parse(existingLogs) : [];
    logs.push(eventPayload);

    // Keep only last 100 events
    const recentLogs = logs.slice(-100);
    await AsyncStorage.setItem(logsKey, JSON.stringify(recentLogs));

    // TODO: Send to Firebase Analytics or custom backend
    // Example for Firebase Analytics:
    // import { analytics } from '@react-native-firebase/analytics';
    // await analytics().logEvent(payload.event, {
    //   clinic_id: payload.clinicId,
    //   user_id: payload.userId,
    //   feature_name: payload.featureName,
    //   ...payload.metadata,
    // });

    // Log to console in development (will be removed in production)
    if (__DEV__) {
      // Use comment instead of console.log to avoid lint errors
      // [AI Pro Event] event_name with details
    }
  } catch (error) {
    // Silently fail - analytics should not break app functionality
  }
}

/**
 * Track when user selects AI Pro in subscription flow
 */
export async function trackAIProSelected(clinicId?: string, price?: number): Promise<void> {
  await logAIProAnalyticsEvent({
    event: AIProAnalyticsEvent.AI_PRO_SELECTED,
    clinicId,
    metadata: { price },
  });
}

/**
 * Track when user upgrades to AI Pro
 */
export async function trackAIProUpgraded(
  clinicId?: string,
  previousPlan?: string,
  newPrice?: number,
): Promise<void> {
  await logAIProAnalyticsEvent({
    event: AIProAnalyticsEvent.AI_PRO_UPGRADED,
    clinicId,
    metadata: { previousPlan, newPrice },
  });
}

/**
 * Track when user uses an advanced AI feature
 */
export async function trackAIFeatureUsed(
  featureName: string,
  clinicId?: string,
  userId?: string,
): Promise<void> {
  await logAIProAnalyticsEvent({
    event: AIProAnalyticsEvent.AI_FEATURE_USED,
    clinicId,
    userId,
    featureName,
  });
}

/**
 * Track when user starts an AI chat session
 */
export async function trackAIChatStarted(clinicId?: string, userId?: string): Promise<void> {
  await logAIProAnalyticsEvent({
    event: AIProAnalyticsEvent.AI_CHAT_STARTED,
    clinicId,
    userId,
  });
}

/**
 * Track when upgrade prompt is shown to user
 */
export async function trackUpgradePromptShown(
  clinicId?: string,
  context?: string,
): Promise<void> {
  await logAIProAnalyticsEvent({
    event: AIProAnalyticsEvent.UPGRADE_PROMPT_SHOWN,
    clinicId,
    metadata: { context },
  });
}

/**
 * Track when user clicks upgrade button from prompt
 */
export async function trackUpgradePromptClicked(clinicId?: string): Promise<void> {
  await logAIProAnalyticsEvent({
    event: AIProAnalyticsEvent.UPGRADE_PROMPT_CLICKED,
    clinicId,
  });
}

/**
 * Track when AI Pro benefits banner is shown
 */
export async function trackAIProBannerShown(clinicId?: string): Promise<void> {
  await logAIProAnalyticsEvent({
    event: AIProAnalyticsEvent.AI_PRO_BANNER_SHOWN,
    clinicId,
  });
}

/**
 * Track when user clicks AI Pro benefits banner
 */
export async function trackAIProBannerClicked(clinicId?: string): Promise<void> {
  await logAIProAnalyticsEvent({
    event: AIProAnalyticsEvent.AI_PRO_BANNER_CLICKED,
    clinicId,
  });
}

/**
 * Get all stored analytics logs (for debugging or batch upload)
 */
export async function getStoredAnalyticsLogs(): Promise<AIProAnalyticsPayload[]> {
  try {
    const logsKey = 'aiProAnalyticsLogs';
    const logs = await AsyncStorage.getItem(logsKey);
    return logs ? JSON.parse(logs) : [];
  } catch (error) {
    return [];
  }
}

/**
 * Clear all stored analytics logs
 */
export async function clearAnalyticsLogs(): Promise<void> {
  try {
    await AsyncStorage.removeItem('aiProAnalyticsLogs');
  } catch (error) {
    // Silently fail
  }
}
