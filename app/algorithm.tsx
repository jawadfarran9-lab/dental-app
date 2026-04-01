import { clearHiddenReels, clearInterestedReels, loadCategoryProfile, saveCategoryProfile } from '@/services/engagementService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ---- All known categories (source of truth for chip list) ----
const ALL_CATEGORIES = ['veneers', 'orthodontics', 'implants', 'whitening', 'cosmetic'] as const;

// ---- State model: each category is "more" | "less" | "neutral" ----
type Preference = 'more' | 'less' | 'neutral';

// Map numeric score → preference state
function scoreToPreference(score: number): Preference {
  if (score >= 2) return 'more';
  if (score <= -2) return 'less';
  return 'neutral';
}

// Map preference state → numeric score for ranking engine
function preferenceToScore(pref: Preference): number {
  if (pref === 'more') return 3;
  if (pref === 'less') return -3;
  return 0;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ---- Category Chip ----
function CategoryChip({
  category,
  preference,
  onToggleMore,
  onToggleLess,
}: {
  category: string;
  preference: Preference;
  onToggleMore: () => void;
  onToggleLess: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  // Entry animation when chip appears/moves sections
  useEffect(() => {
    translateAnim.setValue(6);
    opacityAnim.setValue(0.4);
    Animated.parallel([
      Animated.timing(translateAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [preference]);

  const bounce = useCallback((action: 'more' | 'less') => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.05, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    if (action === 'more') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [scaleAnim]);

  const isMore = preference === 'more';
  const isLess = preference === 'less';

  const chipBg = isMore
    ? 'rgba(52,199,89,0.18)'
    : isLess
    ? 'rgba(255,69,58,0.14)'
    : 'rgba(255,255,255,0.06)';

  const chipBorder = isMore
    ? 'rgba(52,199,89,0.5)'
    : isLess
    ? 'rgba(255,69,58,0.35)'
    : 'rgba(255,255,255,0.1)';

  const labelColor = isMore ? '#34C759' : isLess ? '#FF453A' : '#fff';

  return (
    <Animated.View style={[
      styles.chipRow,
      { transform: [{ scale: scaleAnim }, { translateY: translateAnim }], opacity: opacityAnim },
    ]}>
      <View style={[styles.chipLabel, { backgroundColor: chipBg, borderColor: chipBorder }]}>
        <Text style={[styles.chipText, { color: labelColor }]}>{capitalize(category)}</Text>
        {preference !== 'neutral' && (
          <Ionicons
            name={isMore ? 'arrow-up-circle' : 'arrow-down-circle'}
            size={16}
            color={labelColor}
            style={{ marginLeft: 6 }}
          />
        )}
      </View>
      <View style={styles.chipActions}>
        <Pressable
          onPress={() => { bounce('more'); onToggleMore(); }}
          hitSlop={8}
          style={[
            styles.actionButton,
            isMore && styles.actionButtonActiveGreen,
          ]}
        >
          <Ionicons name="add" size={18} color={isMore ? '#34C759' : 'rgba(255,255,255,0.5)'} />
        </Pressable>
        <Pressable
          onPress={() => { bounce('less'); onToggleLess(); }}
          hitSlop={8}
          style={[
            styles.actionButton,
            isLess && styles.actionButtonActiveRed,
          ]}
        >
          <Ionicons name="remove" size={18} color={isLess ? '#FF453A' : 'rgba(255,255,255,0.5)'} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

export default function AlgorithmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Raw numeric profile from engine — source of truth
  const [rawProfile, setRawProfile] = useState<Record<string, number> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Floating feedback toast
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(msg);
    toastOpacity.setValue(0);
    Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start();
      toastTimer.current = null;
    }, 1200);
  }, [toastOpacity]);

  useEffect(() => {
    loadCategoryProfile().then(setRawProfile);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Derived preference map
  const preferences: Record<string, Preference> = {};
  if (rawProfile) {
    for (const cat of ALL_CATEGORIES) {
      preferences[cat] = scoreToPreference(rawProfile[cat] ?? 0);
    }
  }

  const persistProfile = useCallback((updated: Record<string, number>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      saveCategoryProfile(updated);
    }, 400);
  }, []);

  const setPreference = useCallback((category: string, pref: Preference) => {
    setRawProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, [category]: preferenceToScore(pref) };
      persistProfile(updated);
      return updated;
    });
  }, [persistProfile]);

  const toggleMore = useCallback((category: string) => {
    const current = preferences[category] ?? 'neutral';
    const next = current === 'more' ? 'neutral' : 'more';
    setPreference(category, next);
    showToast(next === 'more' ? 'Showing more like this' : `${capitalize(category)} reset to default`);
  }, [preferences, setPreference, showToast]);

  const toggleLess = useCallback((category: string) => {
    const current = preferences[category] ?? 'neutral';
    const next = current === 'less' ? 'neutral' : 'less';
    setPreference(category, next);
    showToast(next === 'less' ? "We'll show less of this" : `${capitalize(category)} reset to default`);
  }, [preferences, setPreference, showToast]);

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Preferences',
      'This will clear all your category preferences. Your feed will return to default.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setRawProfile({});
            saveCategoryProfile({});
            clearHiddenReels();
            clearInterestedReels();
          },
        },
      ],
    );
  }, []);

  const moreCategories = ALL_CATEGORIES.filter((c) => preferences[c] === 'more');
  const lessCategories = ALL_CATEGORIES.filter((c) => preferences[c] === 'less');
  const neutralCategories = ALL_CATEGORIES.filter((c) => preferences[c] === 'neutral');

  const isLoading = rawProfile === null;
  const hasPreferences = moreCategories.length > 0 || lessCategories.length > 0;
  const isPersonalized = moreCategories.length >= 3;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Floating feedback toast */}
      <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Your Algorithm</Text>
        <View style={styles.backButton} />
      </View>

      <Text style={styles.subtitle}>
        Your feed adapts instantly to your choices
      </Text>
      <Text style={styles.subtitleSecondary}>
        Based on your activity and interactions
      </Text>

      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading preferences…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Empty state — no preferences yet */}
          {!hasPreferences && (
            <View style={styles.emptyState}>
              <Ionicons name="sparkles-outline" size={32} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyTitle}>Start customizing your feed</Text>
              <Text style={styles.emptyHint}>Tap + to see more · Tap − to see less</Text>
            </View>
          )}

          {/* More section */}
          {moreCategories.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="arrow-up-circle" size={18} color="#34C759" />
                <Text style={[styles.sectionTitle, { color: '#34C759' }]}>Seeing more of</Text>
              </View>
              {moreCategories.map((cat) => (
                <CategoryChip
                  key={cat}
                  category={cat}
                  preference="more"
                  onToggleMore={() => toggleMore(cat)}
                  onToggleLess={() => toggleLess(cat)}
                />
              ))}
            </View>
          )}

          {/* Less section */}
          {lessCategories.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="arrow-down-circle" size={18} color="#FF453A" />
                <Text style={[styles.sectionTitle, { color: '#FF453A' }]}>Seeing less of</Text>
              </View>
              {lessCategories.map((cat) => (
                <CategoryChip
                  key={cat}
                  category={cat}
                  preference="less"
                  onToggleMore={() => toggleMore(cat)}
                  onToggleLess={() => toggleLess(cat)}
                />
              ))}
            </View>
          )}

          {/* All categories section — always visible */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="grid-outline" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.sectionTitle}>All categories</Text>
            </View>
            <Text style={styles.sectionHint}>
              {hasPreferences ? "You're customizing your feed" : 'Tap + to see more · Tap − to see less'}
            </Text>
            {(hasPreferences ? neutralCategories : ALL_CATEGORIES).map((cat) => (
              <CategoryChip
                key={cat}
                category={cat}
                preference={preferences[cat] ?? 'neutral'}
                onToggleMore={() => toggleMore(cat)}
                onToggleLess={() => toggleLess(cat)}
              />
            ))}
            {hasPreferences && neutralCategories.length === 0 && (
              <Text style={styles.sectionHint}>All categories have been customized</Text>
            )}
          </View>

          {/* Smart micro message */}
          {isPersonalized && (
            <Text style={styles.microMessage}>
              ✨ Your feed is getting more personalized
            </Text>
          )}

          {/* Reset */}
          {hasPreferences && (
            <Pressable
              style={({ pressed }) => [styles.resetButton, pressed && styles.resetPressed]}
              onPress={handleReset}
            >
              <Ionicons name="refresh-outline" size={18} color="#FF453A" />
              <Text style={styles.resetText}>Reset personalization</Text>
            </Pressable>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backButton: {
    width: 36,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 2,
  },
  subtitleSecondary: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 32,
    paddingBottom: 4,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  chipLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.2,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chipActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  actionButtonActiveGreen: {
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderColor: 'rgba(52,199,89,0.4)',
  },
  actionButtonActiveRed: {
    backgroundColor: 'rgba(255,69,58,0.12)',
    borderColor: 'rgba(255,69,58,0.3)',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,69,58,0.2)',
    backgroundColor: 'rgba(255,69,58,0.06)',
  },
  resetPressed: {
    opacity: 0.6,
  },
  resetText: {
    color: '#FF453A',
    fontSize: 14,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    top: 105,
    left: 32,
    right: 32,
    zIndex: 100,
    alignItems: 'center',
  },
  toastText: {
    backgroundColor: 'rgba(30,30,30,0.92)',
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    overflow: 'hidden',
  },
  microMessage: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 8,
    marginBottom: 8,
  },
  emptyTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '600',
  },
  emptyHint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
  },
});
