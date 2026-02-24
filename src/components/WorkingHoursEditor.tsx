import { useTheme } from '@/src/context/ThemeContext';
import {
    DAYS_ORDER,
    DayOfWeek,
    WeeklySchedule,
    formatDayLabel,
} from '@/src/types/clinicSchedule';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface WorkingHoursEditorProps {
  value: WeeklySchedule;
  onChange: (next: WeeklySchedule) => void;
}

const ACCENT = '#3D9EFF';

/** Strip non-digit/colon chars; auto-insert colon after 2 digits. */
function sanitizeTimeInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** Clamp + zero-pad a partial time string into valid "HH:MM". */
function normalizeTime(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length === 0) return '09:00';

  let hh: number;
  let mm: number;

  if (digits.length <= 2) {
    // e.g. "9" -> 09:00, "14" -> 14:00
    hh = Math.min(Number(digits), 23);
    mm = 0;
  } else {
    // e.g. "930" -> 09:30, "093" -> 09:03, "1745" -> 17:45
    hh = Math.min(Number(digits.slice(0, 2)), 23);
    mm = Math.min(Number(digits.slice(2, 4).padEnd(2, '0')), 59);
  }

  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

const VALID_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function WorkingHoursEditor({ value, onChange }: WorkingHoursEditorProps) {
  const { colors, isDark } = useTheme();

  const toggleDay = (day: DayOfWeek) => {
    const current = value[day];
    const enabling = !current.enabled;
    const needsDefaults = enabling && (!VALID_TIME_RE.test(current.open) || !VALID_TIME_RE.test(current.close));
    onChange({
      ...value,
      [day]: {
        enabled: enabling,
        open: needsDefaults ? '09:00' : current.open,
        close: needsDefaults ? '17:00' : current.close,
      },
    });
  };

  const handleChangeText = (day: DayOfWeek, field: 'open' | 'close', raw: string) => {
    onChange({
      ...value,
      [day]: { ...value[day], [field]: sanitizeTimeInput(raw) },
    });
  };

  const handleBlur = (day: DayOfWeek, field: 'open' | 'close') => {
    const current = value[day][field];
    const normalized = normalizeTime(current);
    if (normalized !== current) {
      onChange({
        ...value,
        [day]: { ...value[day], [field]: normalized },
      });
    }
  };

  return (
    <View>
      {DAYS_ORDER.map((day) => {
        const ds = value[day];
        return (
          <View
            key={day}
            style={[
              styles.dayRow,
              {
                borderBottomColor: isDark
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.05)',
              },
            ]}
          >
            {/* Label + toggle */}
            <View style={styles.dayHeader}>
              <Text style={[styles.dayLabel, { color: colors.textPrimary }]}>
                {formatDayLabel(day)}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleDay(day)}
                style={[
                  styles.togglePill,
                  ds.enabled
                    ? { backgroundColor: ACCENT }
                    : {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.06)',
                      },
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: ds.enabled ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {ds.enabled ? 'Open' : 'Closed'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time inputs (only when enabled) */}
            {ds.enabled && (
              <View style={styles.timeRow}>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(255,255,255,0.9)',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.08)',
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="09:00"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={ds.open}
                  onChangeText={(t) => handleChangeText(day, 'open', t)}
                  onBlur={() => handleBlur(day, 'open')}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <Text style={[styles.timeSeparator, { color: colors.textSecondary }]}>
                  –
                </Text>
                <TextInput
                  style={[
                    styles.timeInput,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.08)'
                        : 'rgba(255,255,255,0.9)',
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.1)'
                        : 'rgba(0,0,0,0.08)',
                      color: colors.textPrimary,
                    },
                  ]}
                  placeholder="17:00"
                  placeholderTextColor={colors.inputPlaceholder}
                  value={ds.close}
                  onChangeText={(t) => handleChangeText(day, 'close', t)}
                  onBlur={() => handleBlur(day, 'close')}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dayRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  togglePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  timeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 16,
    fontWeight: '600',
  },
});
