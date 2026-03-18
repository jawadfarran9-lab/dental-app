import { useTheme } from '@/src/context/ThemeContext';
import { useClinicPreferences } from '@/src/hooks/useClinicPreferences';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Option = { label: string; minutes: number | null };

const OPTIONS: Option[] = [
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: 'Off', minutes: null },
];

export default function DailyLimitScreen() {
  const { colors, isDark } = useTheme();
  const { settings, loading, updateSettings } = useClinicPreferences();

  const currentMinutes = settings.dailyLimitEnabled ? settings.dailyLimitMinutes : null;

  const handleSelect = (opt: Option) => {
    if (opt.minutes === null) {
      updateSettings({ dailyLimitEnabled: false, dailyLimitMinutes: null });
    } else {
      updateSettings({ dailyLimitEnabled: true, dailyLimitMinutes: opt.minutes });
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={isDark ? '#64748B' : '#94A3B8'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.description, { color: isDark ? '#8A96A6' : '#64748B' }]}>
          Set a daily time limit reminder for app usage.
        </Text>

        {OPTIONS.map((opt, idx) => {
          const isActive = opt.minutes === currentMinutes;
          return (
            <Pressable
              key={opt.label}
              style={({ pressed }) => [
                styles.row,
                isActive && { backgroundColor: isDark ? 'rgba(61,158,255,0.10)' : 'rgba(61,158,255,0.06)' },
                pressed && !isActive && { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' },
                {
                  borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  borderBottomWidth: idx < OPTIONS.length - 1 ? StyleSheet.hairlineWidth : 0,
                },
              ]}
              onPress={() => handleSelect(opt)}
            >
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                {opt.label}
              </Text>
              {isActive && (
                <Ionicons name="checkmark" size={20} color="#3D9EFF" />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingVertical: 12 },
  description: { fontSize: 14, paddingHorizontal: 20, paddingBottom: 16, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    minHeight: 52,
  },
  optionText: { fontSize: 16, fontWeight: '400' },
});
