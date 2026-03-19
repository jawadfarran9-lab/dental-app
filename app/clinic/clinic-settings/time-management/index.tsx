import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicPreferences } from '@/src/hooks/useClinicPreferences';
import { formatSeconds, useWeeklyUsage } from '@/src/hooks/useWeeklyUsage';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type SettingsRow = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const SETTINGS_ITEMS: SettingsRow[] = [
  { key: 'daily-limit', title: 'Daily Limit', icon: 'hourglass-outline', route: '/clinic/clinic-settings/time-management/daily-limit' },
  { key: 'sleep-mode', title: 'Sleep Mode', icon: 'moon-outline', route: '/clinic/clinic-settings/time-management/sleep-mode' },
];

function formatDailyLimit(enabled: boolean, minutes: number | null): string {
  if (!enabled || minutes === null) return 'Off';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (rem === 0) return hrs === 1 ? '1 hour' : `${hrs} hours`;
  return `${hrs} hr ${rem} min`;
}

function getRowValue(key: string, settings: { dailyLimitEnabled: boolean; dailyLimitMinutes: number | null; sleepModeEnabled: boolean; sleepStartTime: string; sleepEndTime: string }): string {
  if (key === 'daily-limit') return formatDailyLimit(settings.dailyLimitEnabled, settings.dailyLimitMinutes);
  if (key === 'sleep-mode') {
    if (!settings.sleepModeEnabled) return 'Off';
    return `${settings.sleepStartTime || '23:00'} – ${settings.sleepEndTime || '07:00'}`;
  }
  return 'Off';
}

const CHART_HEIGHT = 130;
const STAGGER_DELAY = 30;

function useCardEntrance(delay = 0) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 300, delay, useNativeDriver: true }),
    ]).start();
  }, []);
  return { opacity: fade, transform: [{ translateY: slide }] };
}

function AnimatedSettingsRow({ item, idx, total, colors, value, onPress }: { item: SettingsRow; idx: number; total: number; colors: any; value: string; onPress: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const baseDelay = 200;

  useEffect(() => {
    const delay = baseDelay + idx * STAGGER_DELAY;
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, delay, useNativeDriver: true }).start();
    Animated.timing(translateY, { toValue: 0, duration: 250, delay, useNativeDriver: true }).start();
  }, []);

  const onPressIn = () => { Animated.timing(scaleAnim, { toValue: 0.97, duration: 120, useNativeDriver: true }).start(); };
  const onPressOut = () => { Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start(); };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          {
            opacity: pressed ? 0.7 : 1,
            backgroundColor: pressed ? colors.rowHighlight : 'transparent',
            borderBottomColor: colors.borderTint,
            borderBottomWidth: idx < total - 1 ? StyleSheet.hairlineWidth : 0,
          },
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
      >
        <View style={styles.rowLeft}>
          <Ionicons name={item.icon} size={23} color={colors.iconMuted} style={styles.rowIcon} />
          <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowValue, { color: '#5A6B7C' }]}>{value}</Text>
          <Ionicons name="chevron-forward" size={20} color={'#1A2B3F'} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function TimeManagementIndex() {
  const router = useRouter();
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const { colors, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const { settings } = useClinicPreferences();
  const [showInfo, setShowInfo] = useState(false);
  const { week, averageLabel, todayIndex } = useWeeklyUsage(clinicId);

  const barMax = Math.max(...week.map((d) => d.seconds), 1); // min 1 to avoid division by zero

  const card1Style = useCardEntrance(0);
  const card2Style = useCardEntrance(80);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [tooltipX, setTooltipX] = useState(0);
  const chartLayoutRef = useRef({ x: 0, width: 0 });
  const chartRef = useRef<View>(null);
  const tooltipScale = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeIndex !== null) {
      tooltipScale.setValue(0.8);
      tooltipOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(tooltipScale, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 8 }),
        Animated.timing(tooltipOpacity, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(tooltipScale, { toValue: 0.8, duration: 120, useNativeDriver: true }),
        Animated.timing(tooltipOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  }, [activeIndex]);

  const handleTouch = useCallback((pageX: number) => {
    const { x, width } = chartLayoutRef.current;
    if (width === 0) return;
    const relativeX = pageX - x;
    const barWidth = width / week.length;
    const index = Math.floor(relativeX / barWidth);
    if (index >= 0 && index < week.length) {
      setActiveIndex(index);
      setTooltipX(index * barWidth + barWidth / 2);
    }
  }, [week.length]);

  // Rebuild panResponder when week.length changes (always 7, but safe)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => handleTouch(e.nativeEvent.pageX),
      onPanResponderMove: (e) => handleTouch(e.nativeEvent.pageX),
      onPanResponderRelease: () => setActiveIndex(null),
      onPanResponderTerminate: () => setActiveIndex(null),
    }),
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <PremiumGradientBackground isDark={isDark} showSparkles={true} />
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => setShowInfo(true)} style={{ marginRight: 16 }}>
              <Ionicons name="information-circle-outline" size={22} color="#1A2B3F" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>

        {/* ── Daily Average Card ── */}
        <Animated.View style={[card1Style]}>
        <View style={[
          styles.card,
          { backgroundColor: colors.cardBg, shadowColor: colors.shadow },
        ]}>
          <Text style={[styles.cardLabel, { color: '#5A6B7C' }]}>
            Daily Average
          </Text>
          <Text style={[styles.heroValue, { color: colors.brandBlue }]}>
            {averageLabel}
          </Text>
        </View>
        </Animated.View>

        {/* ── Weekly Chart Card ── */}
        <Animated.View style={[card2Style]}>
        <View style={[
          styles.card,
          { backgroundColor: colors.cardBg, shadowColor: colors.shadow },
        ]}>
          <Text style={[styles.cardLabel, { color: '#5A6B7C' }]}>
            This Week
          </Text>
          <View style={styles.chartWrapper}>
            {activeIndex !== null && (
              <Animated.View
                style={[
                  styles.tooltip,
                  {
                    left: tooltipX - 30,
                    backgroundColor: colors.tooltipBg,
                    shadowColor: colors.shadow,
                    transform: [{ scale: tooltipScale }],
                    opacity: tooltipOpacity,
                  },
                ]}
              >
                <Text style={[styles.tooltipText, { color: colors.tooltipText }]}>
                  {formatSeconds(week[activeIndex].seconds)}
                </Text>
              </Animated.View>
            )}
            <View
              ref={chartRef}
              style={styles.chartContainer}
              onLayout={() => {
                chartRef.current?.measure((_x, _y, width, _h, pageX) => {
                  chartLayoutRef.current = { x: pageX, width };
                });
              }}
              {...panResponder.panHandlers}
            >
              {week.map((day, i) => {
                const barH = day.seconds > 0 ? (day.seconds / barMax) * CHART_HEIGHT : 0;
                const isActive = i === activeIndex;
                const isToday = i === todayIndex;
                return (
                  <View key={day.key} style={styles.barColumn}>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.bar,
                          {
                            height: barH,
                            backgroundColor: isActive
                              ? colors.brandBlue
                              : isToday
                                ? colors.brandBlue
                                : colors.brandBlueTint,
                            opacity: activeIndex !== null && !isActive ? 0.4 : 1,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.dayLabel, { color: isActive ? colors.brandBlue : isToday ? colors.brandBlue : '#5A6B7C' }]}>
                      {day.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
        </Animated.View>

        {/* ── Settings Navigation ── */}
        <Text style={[styles.sectionHeader, { color: '#1A2B3F' }]}>
          Settings
        </Text>
        {SETTINGS_ITEMS.map((item, idx) => (
          <AnimatedSettingsRow
            key={item.key}
            item={item}
            idx={idx}
            total={SETTINGS_ITEMS.length}
            colors={colors}
            value={getRowValue(item.key, settings)}
            onPress={() => router.push(`${item.route}?clinicId=${clinicId}` as any)}
          />
        ))}

      </ScrollView>

      {showInfo && (
        <Modal
          transparent
          animationType="fade"
          onRequestClose={() => setShowInfo(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowInfo(false)}>
            <View
              style={[styles.modalSheet, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF' }]}
              onStartShouldSetResponder={() => true}
            >
              <Text style={[styles.modalBody, { color: isDark ? '#C8D0DA' : '#333333' }]}>
                This feature allows you to control when notifications are sent to avoid disturbances and improve focus during your day.
              </Text>

              <TouchableOpacity
                style={styles.modalAction}
                onPress={() => {
                  // FUTURE: connect to AI screen
                }}
              >
                <Text style={{ color: '#3D9EFF', fontSize: 16, fontWeight: '600' }}>
                  Learn more
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalAction}
                onPress={() => setShowInfo(false)}
              >
                <Text style={{ color: isDark ? '#8A96A6' : '#1A2B3F', fontSize: 16, fontWeight: '500' }}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingVertical: 16 },

  // Card
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 18,
    padding: 20,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.8 },
  heroValue: { fontSize: 38, fontWeight: '800', textAlign: 'center', paddingVertical: 10 },

  // Chart
  chartWrapper: { position: 'relative' as const },
  tooltip: {
    position: 'absolute' as const,
    top: -36,
    zIndex: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  tooltipText: { fontSize: 13, fontWeight: '600' as const },
  chartContainer: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, justifyContent: 'space-between' as const, height: CHART_HEIGHT + 24, paddingTop: 8 },
  barColumn: { flex: 1, alignItems: 'center' },
  barTrack: { height: CHART_HEIGHT, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '55%', borderTopLeftRadius: 8, borderTopRightRadius: 8, minHeight: 4 },
  dayLabel: { fontSize: 11, fontWeight: '500', marginTop: 6 },

  // Settings section
  sectionHeader: { fontSize: 12, fontWeight: '600', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    minHeight: 54,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowIcon: { marginRight: 16, width: 24, textAlign: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '500' },
  rowValue: { fontSize: 14, fontWeight: '500' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 30 },
  modalBody: { fontSize: 16, lineHeight: 22, textAlign: 'center' },
  modalAction: { marginTop: 16, paddingVertical: 14, alignItems: 'center' },
});
