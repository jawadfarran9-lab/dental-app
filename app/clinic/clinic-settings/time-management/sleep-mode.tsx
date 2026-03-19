import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicPreferences } from '@/src/hooks/useClinicPreferences';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';

const ALL_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const CHIP_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function timeStringToDate(t: string): Date {
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

function dateToTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function AnimatedChip({ day, label, active, colors, onPress }: { day: string; label: string; active: boolean; colors: any; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const onPressIn = () => { Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }).start(); };
  const onPressOut = () => { Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 24, bounciness: 10 }).start(); };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={[
          styles.chip,
          { backgroundColor: active ? colors.brandBlue : colors.chipInactive },
        ]}
      >
        <Text style={[styles.chipText, { color: active ? colors.toggleThumb : '#5A6B7C' }]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function SleepModeScreen() {
  const { colors, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const { settings, loading, updateSettings } = useClinicPreferences();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(contentSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: 'transparent' }]}>
        <PremiumGradientBackground isDark={isDark} showSparkles={true} />
        <ActivityIndicator size="large" color={'#5A6B7C'} />
      </View>
    );
  }

  const enabled = settings.sleepModeEnabled;
  const startTime = settings.sleepStartTime || '23:00';
  const endTime = settings.sleepEndTime || '07:00';
  const days: string[] = settings.sleepDays || [];

  const handleToggle = (val: boolean) => {
    if (val) {
      const hasDays = settings.sleepDays && settings.sleepDays.length > 0;
      updateSettings({
        sleepModeEnabled: true,
        sleepDays: hasDays
          ? settings.sleepDays
          : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      });
    } else {
      updateSettings({ sleepModeEnabled: false });
    }
  };

  const handleStartChange = (_: any, date?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) {
      updateSettings({ sleepStartTime: dateToTimeString(date) });
    }
  };

  const handleEndChange = (_: any, date?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (date) {
      updateSettings({ sleepEndTime: dateToTimeString(date) });
    }
  };

  const toggleDay = (day: string) => {
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    updateSettings({ sleepDays: next });
  };

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <PremiumGradientBackground isDark={isDark} showSparkles={true} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
        <Animated.View style={{ opacity: contentFade, transform: [{ translateY: contentSlide }] }}>

        {/* ── Toggle ── */}
        <View style={[styles.toggleRow, { borderBottomColor: colors.borderTint }]}>
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Sleep Mode</Text>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.toggleTrackOff, true: colors.toggleTrackOn }}
            thumbColor={colors.toggleThumb}
          />
        </View>

        {/* ── Time Range ── */}
        <Text style={[styles.sectionLabel, { color: '#5A6B7C' }]}>
          Quiet Hours
        </Text>

        <Pressable
          style={[styles.timeRow, { borderBottomColor: colors.borderTint }]}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={[styles.timeLabel, { color: colors.textPrimary }]}>Start</Text>
          <Text style={[styles.timeValue, { color: colors.brandBlue }]}>{startTime}</Text>
        </Pressable>

        {showStartPicker && (
          <DateTimePicker
            value={timeStringToDate(startTime)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartChange}
          />
        )}

        <Pressable
          style={[styles.timeRow, { borderBottomColor: colors.borderTint }]}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={[styles.timeLabel, { color: colors.textPrimary }]}>End</Text>
          <Text style={[styles.timeValue, { color: colors.brandBlue }]}>{endTime}</Text>
        </Pressable>

        {showEndPicker && (
          <DateTimePicker
            value={timeStringToDate(endTime)}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndChange}
          />
        )}

        {/* ── Days ── */}
        <Text style={[styles.sectionLabel, { color: '#5A6B7C' }]}>
          Active Days
        </Text>
        <View style={styles.chipsRow}>
          {ALL_DAYS.map((day, i) => {
            const active = days.includes(day);
            return (
              <AnimatedChip
                key={day}
                day={day}
                label={CHIP_LABELS[i]}
                active={active}
                colors={colors}
                onPress={() => toggleDay(day)}
              />
            );
          })}
        </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingVertical: 8 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: { fontSize: 16, fontWeight: '600' },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 10,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeLabel: { fontSize: 16, fontWeight: '500' },
  timeValue: { fontSize: 16, fontWeight: '700' },

  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  chip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '700' },
});
