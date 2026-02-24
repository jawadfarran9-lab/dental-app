import { useTheme } from '@/src/context/ThemeContext';
import {
    DAYS_ORDER,
    WeeklySchedule,
    formatDayLabel,
} from '@/src/types/clinicSchedule';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface WorkingHoursSummaryProps {
  workingHours: WeeklySchedule;
}

const ACCENT = '#3D9EFF';

export default function WorkingHoursSummary({ workingHours }: WorkingHoursSummaryProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.50)', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={18} color={ACCENT} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Working Hours</Text>
      </View>
      {DAYS_ORDER.map((day, idx) => {
        const ds = workingHours[day];
        const isLast = idx === DAYS_ORDER.length - 1;
        return (
          <View
            key={day}
            style={[
              styles.row,
              !isLast && { borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' },
            ]}
          >
            <Text style={[styles.dayLabel, { color: colors.textPrimary }]}>
              {formatDayLabel(day)}
            </Text>
            <Text
              style={[
                styles.dayValue,
                { color: ds.enabled ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              {ds.enabled ? `${ds.open} – ${ds.close}` : 'Closed'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  dayValue: {
    fontSize: 14,
    fontWeight: '500',
  },
});
