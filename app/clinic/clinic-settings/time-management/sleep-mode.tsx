import { useTheme } from '@/src/context/ThemeContext';
import { useClinicPreferences } from '@/src/hooks/useClinicPreferences';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
    ActivityIndicator,
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

export default function SleepModeScreen() {
  const { colors, isDark } = useTheme();
  const { settings, loading, updateSettings } = useClinicPreferences();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={isDark ? '#64748B' : '#94A3B8'} />
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Toggle ── */}
        <View style={[styles.toggleRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Sleep Mode</Text>
          <Switch
            value={enabled}
            onValueChange={handleToggle}
            trackColor={{ false: isDark ? '#3A3F47' : '#D1D5DB', true: '#3D9EFF' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* ── Time Range ── */}
        <Text style={[styles.sectionLabel, { color: isDark ? '#8A96A6' : '#64748B' }]}>
          Quiet Hours
        </Text>

        <Pressable
          style={[styles.timeRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={[styles.timeLabel, { color: colors.textPrimary }]}>Start</Text>
          <Text style={[styles.timeValue, { color: '#3D9EFF' }]}>{startTime}</Text>
        </Pressable>

        {showStartPicker && (
          <DateTimePicker
            value={timeStringToDate(startTime)}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleStartChange}
          />
        )}

        <Pressable
          style={[styles.timeRow, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={[styles.timeLabel, { color: colors.textPrimary }]}>End</Text>
          <Text style={[styles.timeValue, { color: '#3D9EFF' }]}>{endTime}</Text>
        </Pressable>

        {showEndPicker && (
          <DateTimePicker
            value={timeStringToDate(endTime)}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleEndChange}
          />
        )}

        {/* ── Days ── */}
        <Text style={[styles.sectionLabel, { color: isDark ? '#8A96A6' : '#64748B' }]}>
          Active Days
        </Text>
        <View style={styles.chipsRow}>
          {ALL_DAYS.map((day, i) => {
            const active = days.includes(day);
            return (
              <Pressable
                key={day}
                onPress={() => toggleDay(day)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? '#3D9EFF'
                      : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: active ? '#FFFFFF' : isDark ? '#8A96A6' : '#64748B' }]}>
                  {CHIP_LABELS[i]}
                </Text>
              </Pressable>
            );
          })}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingVertical: 12 },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: { fontSize: 16, fontWeight: '500' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeLabel: { fontSize: 16, fontWeight: '400' },
  timeValue: { fontSize: 16, fontWeight: '600' },

  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '600' },
});
