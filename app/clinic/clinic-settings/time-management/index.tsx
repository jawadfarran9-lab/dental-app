import { useTheme } from '@/src/context/ThemeContext';
import { useClinicPreferences } from '@/src/hooks/useClinicPreferences';
import { formatSeconds, useWeeklyUsage } from '@/src/hooks/useWeeklyUsage';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type SettingsRow = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
};

const SETTINGS_ITEMS: SettingsRow[] = [
  { key: 'daily-limit', title: 'Daily Limit', icon: 'hourglass-outline', route: '/clinic/clinic-settings/time-management/daily-limit' },
  { key: 'sleep-mode', title: 'Sleep Mode', icon: 'moon-outline', route: '/clinic/clinic-settings/time-management/sleep-mode' },
  { key: 'notification-schedule', title: 'Notification Schedule', icon: 'notifications-outline', route: '/clinic/clinic-settings/time-management/notification-schedule' },
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

export default function TimeManagementIndex() {
  const router = useRouter();
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const { colors, isDark } = useTheme();
  const { settings } = useClinicPreferences();
  const { week, averageLabel, todayIndex } = useWeeklyUsage(clinicId);

  const barMax = Math.max(...week.map((d) => d.seconds), 1); // min 1 to avoid division by zero

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Daily Average Card ── */}
        <View style={[
          styles.card,
          { backgroundColor: isDark ? 'rgba(30,42,60,0.6)' : '#FFFFFF' },
        ]}>
          <Text style={[styles.cardLabel, { color: isDark ? '#8A96A6' : '#64748B' }]}>
            Daily Average
          </Text>
          <Text style={[styles.heroValue, { color: '#3D9EFF' }]}>
            {averageLabel}
          </Text>
        </View>

        {/* ── Weekly Chart Card ── */}
        <View style={[
          styles.card,
          { backgroundColor: isDark ? 'rgba(30,42,60,0.6)' : '#FFFFFF' },
        ]}>
          <Text style={[styles.cardLabel, { color: isDark ? '#8A96A6' : '#64748B' }]}>
            This Week
          </Text>
          <View style={styles.chartWrapper}>
            {activeIndex !== null && (
              <Animated.View
                style={[
                  styles.tooltip,
                  {
                    left: tooltipX - 30,
                    backgroundColor: isDark ? 'rgba(30,42,60,0.95)' : 'rgba(255,255,255,0.95)',
                    shadowColor: '#000',
                    transform: [{ scale: tooltipScale }],
                    opacity: tooltipOpacity,
                  },
                ]}
              >
                <Text style={[styles.tooltipText, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
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
                              ? '#3D9EFF'
                              : isToday
                                ? '#3D9EFF'
                                : isDark ? 'rgba(61,158,255,0.35)' : 'rgba(61,158,255,0.25)',
                            opacity: activeIndex !== null && !isActive ? 0.4 : 1,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.dayLabel, { color: isActive ? '#3D9EFF' : isToday ? '#3D9EFF' : isDark ? '#64748B' : '#94A3B8' }]}>
                      {day.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* ── Settings Navigation ── */}
        <Text style={[styles.sectionHeader, { color: isDark ? '#8A96A6' : '#64748B' }]}>
          Settings
        </Text>
        {SETTINGS_ITEMS.map((item, idx) => (
          <Pressable
            key={item.key}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: pressed
                  ? isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                  : 'transparent',
                borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                borderBottomWidth: idx < SETTINGS_ITEMS.length - 1 ? StyleSheet.hairlineWidth : 0,
              },
            ]}
            onPress={() => router.push(`${item.route}?clinicId=${clinicId}` as any)}
          >
            <View style={styles.rowLeft}>
              <Ionicons
                name={item.icon}
                size={22}
                color={isDark ? '#B0BEC5' : '#546E7A'}
                style={styles.rowIcon}
              />
              <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>
                {item.title}
              </Text>
            </View>
            <View style={styles.rowRight}>
              <Text style={[styles.rowValue, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                {getRowValue(item.key, settings)}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={isDark ? '#64748B' : '#94A3B8'} />
            </View>
          </Pressable>
        ))}

      </ScrollView>
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
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  heroValue: { fontSize: 36, fontWeight: '800', textAlign: 'center', paddingVertical: 8 },

  // Chart
  chartWrapper: { position: 'relative' as const },
  tooltip: {
    position: 'absolute' as const,
    top: -36,
    zIndex: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  tooltipText: { fontSize: 13, fontWeight: '600' as const },
  chartContainer: { flexDirection: 'row' as const, alignItems: 'flex-end' as const, justifyContent: 'space-between' as const, height: CHART_HEIGHT + 24, paddingTop: 8 },
  barColumn: { flex: 1, alignItems: 'center' },
  barTrack: { height: CHART_HEIGHT, justifyContent: 'flex-end', width: '100%', alignItems: 'center' },
  bar: { width: '55%', borderTopLeftRadius: 6, borderTopRightRadius: 6, minHeight: 4 },
  dayLabel: { fontSize: 11, fontWeight: '500', marginTop: 6 },

  // Settings section
  sectionHeader: { fontSize: 13, fontWeight: '600', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowIcon: { marginRight: 14, width: 24, textAlign: 'center' },
  rowTitle: { fontSize: 16, fontWeight: '400' },
  rowValue: { fontSize: 14, fontWeight: '400' },
});
