import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { formatSeconds, useWeeklyUsage } from '@/src/hooks/useWeeklyUsage';
import { updateClinicStatus } from '@/src/services/clinicStatusService';
import { fetchClinicPublicOwner } from '@/src/services/publicClinics';
import { WeeklySchedule } from '@/src/types/clinicSchedule';
import { fetchClinicData } from '@/src/utils/clinicDataUtils';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { getClinicOpenStatus } from '@/src/utils/workingHoursStatus';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#3D9EFF';
const GREEN = '#10B981';
const RED = '#EF4444';

type Mode = 'open' | 'close' | 'schedule';

export default function ClinicStatusScreen() {
  useClinicRoleGuard(['owner']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId, isSubscribed } = useAuth();

  const [loading, setLoading] = useState(true);
  const [workingHours, setWorkingHours] = useState<WeeklySchedule | undefined>(
    undefined
  );
  const [manualClose, setManualClose] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [pending, setPending] = useState<Mode | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const canToggle = isSubscribed === true;

  const usage = useWeeklyUsage(clinicId ?? undefined);
  const [selectedIdx, setSelectedIdx] = useState<number>(usage.todayIndex);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clinicId) {
        setLoading(false);
        return;
      }
      try {
        const [data, pub] = await Promise.all([
          fetchClinicData(clinicId),
          fetchClinicPublicOwner(clinicId),
        ]);
        if (cancelled) return;
        setWorkingHours(data?.workingHours);
        setManualClose(pub?.manualClose === true);
        setManualOpen(pub?.manualOpen === true);
      } catch (err) {
        console.error('[CLINIC-STATUS] load error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/settings' as any);
  };

  const setMode = async (mode: Mode) => {
    if (!canToggle || !clinicId || pending) return;
    const prev = { manualClose, manualOpen };
    const optimistic =
      mode === 'open'
        ? { manualClose: false, manualOpen: true }
        : mode === 'close'
          ? { manualClose: true, manualOpen: false }
          : { manualClose: false, manualOpen: false };
    setManualClose(optimistic.manualClose);
    setManualOpen(optimistic.manualOpen);
    setPending(mode);
    setErrorMsg(null);
    try {
      await updateClinicStatus(clinicId, mode, workingHours);
      setToast('Status updated');
      setTimeout(() => setToast(null), 1600);
    } catch (err) {
      console.error('[CLINIC-STATUS] update failed', err);
      setManualClose(prev.manualClose);
      setManualOpen(prev.manualOpen);
      setErrorMsg('Could not update status. Please try again.');
    } finally {
      setPending(null);
    }
  };

  const isAuto = !manualOpen && !manualClose;

  const scheduleStatus = useMemo(() => {
    if (!workingHours) return null;
    return getClinicOpenStatus(workingHours);
  }, [workingHours]);

  const maxSeconds = useMemo(
    () => usage.week.reduce((m, d) => Math.max(m, d.seconds), 0),
    [usage.week]
  );

  const safeSelectedIdx =
    selectedIdx >= 0 && selectedIdx < usage.week.length
      ? selectedIdx
      : usage.todayIndex;
  const selectedDay = usage.week[safeSelectedIdx];

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const textMuted = colors.textTertiary;

  // Standard glass for chart + options cards (unchanged from before).
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.10)' : '#EEF2F8';

  // Transparent, lightly blue-tinted glass — sparkles + gradient show through.
  const tintedBg = isDark ? 'rgba(61,158,255,0.10)' : 'rgba(186,230,253,0.22)';
  const tintedBorder = isDark
    ? 'rgba(61,158,255,0.22)'
    : 'rgba(61,158,255,0.18)';

  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';
  const barTrack = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(13,27,42,0.05)';
  const barOther = isDark ? 'rgba(61,158,255,0.45)' : 'rgba(61,158,255,0.55)';

  const statusHeader = manualOpen
    ? { label: 'OPEN NOW', sub: 'Your clinic is manually open', color: GREEN }
    : manualClose
      ? { label: 'CLOSED', sub: 'Your clinic is manually closed', color: RED }
      : { label: 'AUTO MODE', sub: 'Following your working hours', color: ACCENT };

  let autoDetail: string | null = null;
  if (isAuto && scheduleStatus) {
    if (scheduleStatus.status === 'open') {
      autoDetail = `Next change: closes at ${scheduleStatus.closesAt}`;
    } else if (scheduleStatus.opensAt) {
      autoDetail = `Next change: opens at ${scheduleStatus.opensAt}`;
    }
  }

  type Opt = {
    mode: Mode;
    label: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    tint: string;
    active: boolean;
  };
  const options: Opt[] = [
    {
      mode: 'open',
      label: 'Open Clinic Now',
      subtitle: 'Patients can find and contact you',
      icon: 'checkmark-circle',
      color: GREEN,
      tint: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
      active: manualOpen,
    },
    {
      mode: 'close',
      label: 'Close Clinic Now',
      subtitle: 'Hide clinic from patients',
      icon: 'close-circle',
      color: RED,
      tint: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
      active: manualClose,
    },
    {
      mode: 'schedule',
      label: 'Return to Schedule',
      subtitle: 'Follow your schedule automatically',
      icon: 'time',
      color: ACCENT,
      tint: isDark ? 'rgba(61,158,255,0.12)' : 'rgba(61,158,255,0.08)',
      active: isAuto,
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            { backgroundColor: pressed ? backBgPressed : backBg },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={backIconColor} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            Clinic Status
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Open or close your clinic
          </Text>
        </View>

        <View
          style={[
            styles.headerPin,
            { backgroundColor: 'rgba(16,185,129,0.16)' },
          ]}
        >
          <Ionicons name="power" size={20} color={GREEN} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Section A — Daily Average (real Time-Management data) */}
          <Text
            style={[
              styles.eyebrow,
              { color: textSecondary, textAlign: 'center' },
            ]}
          >
            DAILY AVERAGE
          </Text>
          <View
            style={[
              styles.card,
              styles.cardTransparent,
              styles.avgCard,
              { backgroundColor: tintedBg, borderColor: tintedBorder },
            ]}
          >
            <Text style={[styles.avgValue, { color: ACCENT }]}>
              {usage.loading ? '—' : usage.averageLabel}
            </Text>
            <Text style={[styles.avgSub, { color: textMuted }]}>
              Last 7 days of app usage
            </Text>
          </View>

          {/* Chart card (kept as standard glass per spec) */}
          <Text style={[styles.eyebrow, { color: textSecondary }]}>
            THIS WEEK
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <View style={styles.selectedRow}>
              <Text style={[styles.selectedDay, { color: textPrimary }]}>
                {selectedDay
                  ? `${selectedDay.label} · ${formatSeconds(selectedDay.seconds)}`
                  : '—'}
              </Text>
              <Text style={[styles.selectedHint, { color: textMuted }]}>
                Tap a bar to view
              </Text>
            </View>

            <View style={styles.chartRow}>
              {usage.week.map((d, idx) => {
                const isSelected = idx === safeSelectedIdx;
                const hasUsage = d.seconds > 0;
                const ratio = maxSeconds > 0 ? d.seconds / maxSeconds : 0;
                const barHeightPct = hasUsage ? Math.max(ratio * 100, 10) : 6;
                const barColor = hasUsage
                  ? isSelected
                    ? ACCENT
                    : barOther
                  : barTrack;
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => setSelectedIdx(idx)}
                    style={styles.chartCol}
                  >
                    <Text
                      style={[
                        styles.barValue,
                        {
                          color: hasUsage ? textPrimary : textMuted,
                          opacity: hasUsage ? 1 : 0.6,
                        },
                      ]}
                    >
                      {hasUsage ? formatSeconds(d.seconds) : '–'}
                    </Text>
                    <View style={[styles.barTrack, { backgroundColor: barTrack }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: `${barHeightPct}%`,
                            backgroundColor: barColor,
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.barLabel,
                        {
                          color: isSelected ? ACCENT : textMuted,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Section B — Status overview (transparent tinted glass) */}
          <Text style={[styles.eyebrow, { color: textSecondary }]}>
            CURRENT STATUS
          </Text>
          <View
            style={[
              styles.card,
              styles.cardTransparent,
              { backgroundColor: tintedBg, borderColor: tintedBorder },
            ]}
          >
            <View style={styles.statusHeaderRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: statusHeader.color },
                ]}
              />
              <Text style={[styles.statusLabel, { color: statusHeader.color }]}>
                {statusHeader.label}
              </Text>
            </View>
            <Text style={[styles.statusSub, { color: textSecondary }]}>
              {statusHeader.sub}
            </Text>
            {isAuto && autoDetail && (
              <View
                style={[
                  styles.autoDetailRow,
                  {
                    borderTopColor: isDark
                      ? 'rgba(255,255,255,0.08)'
                      : 'rgba(13,27,42,0.06)',
                  },
                ]}
              >
                <Ionicons name="time-outline" size={14} color={textMuted} />
                <Text style={[styles.autoDetailText, { color: textMuted }]}>
                  {autoDetail}
                </Text>
              </View>
            )}
          </View>

          {/* Section C — Controls (standard glass) */}
          <Text style={[styles.eyebrow, { color: textSecondary }]}>
            CHANGE STATUS
          </Text>
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            {options.map((opt, idx) => {
              const last = idx === options.length - 1;
              const isPending = pending === opt.mode;
              return (
                <Pressable
                  key={opt.mode}
                  onPress={() => setMode(opt.mode)}
                  disabled={!canToggle || pending !== null}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: opt.active ? opt.tint : 'transparent',
                      borderColor: opt.active
                        ? `${ACCENT}99`
                        : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(13,27,42,0.06)',
                      opacity:
                        !canToggle || (pending && !isPending) || pressed
                          ? 0.85
                          : 1,
                      marginBottom: last ? 0 : 10,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionIcon,
                      {
                        backgroundColor: opt.active
                          ? opt.tint
                          : isDark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(13,27,42,0.04)',
                      },
                    ]}
                  >
                    <Ionicons name={opt.icon} size={22} color={opt.color} />
                  </View>
                  <View style={styles.optionTextWrap}>
                    <Text style={[styles.optionTitle, { color: textPrimary }]}>
                      {opt.label}
                    </Text>
                    <Text style={[styles.optionSub, { color: textMuted }]}>
                      {opt.subtitle}
                    </Text>
                  </View>
                  {isPending ? (
                    <ActivityIndicator color={ACCENT} />
                  ) : opt.active ? (
                    <Ionicons name="checkmark-circle" size={20} color={ACCENT} />
                  ) : null}
                </Pressable>
              );
            })}

            {!canToggle && (
              <Text style={[styles.gateNote, { color: textMuted }]}>
                An active subscription is required to change your clinic status.
              </Text>
            )}

            {errorMsg && (
              <Text style={[styles.errorNote, { color: RED }]}>{errorMsg}</Text>
            )}
            {toast && !errorMsg && (
              <Text style={[styles.toastNote, { color: GREEN }]}>{toast}</Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 21, fontWeight: '800', marginBottom: 2 },
  headerSubtitle: { fontSize: 12.5 },
  headerPin: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4, gap: 8 },

  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 12,
    marginBottom: 8,
  },

  card: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  cardTransparent: {
    shadowOpacity: 0,
    elevation: 0,
  },

  avgCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  avgValue: {
    fontSize: 58,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 10,
    textShadowColor: 'rgba(46,91,255,0.35)',
    textShadowOffset: { width: 0, height: 6 },
    textShadowRadius: 22,
  },
  avgSub: {
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
  },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statValue: { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  statSub: { fontSize: 12.5, fontWeight: '500' },
  statIconTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  selectedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedDay: { fontSize: 14, fontWeight: '800', letterSpacing: 0.2 },
  selectedHint: { fontSize: 11, fontWeight: '600' },

  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  barValue: { fontSize: 10.5, fontWeight: '700' },
  barTrack: {
    width: 14,
    height: 96,
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: { width: '100%', borderRadius: 8 },
  barLabel: { fontSize: 11, letterSpacing: 0.2 },

  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 4,
  },
  statusDot: { width: 11, height: 11, borderRadius: 6 },
  statusLabel: { fontSize: 18, fontWeight: '800', letterSpacing: 0.4 },
  statusSub: { fontSize: 13, lineHeight: 18 },
  autoDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  autoDetailText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: { flex: 1 },
  optionTitle: { fontSize: 14.5, fontWeight: '700', marginBottom: 2 },
  optionSub: { fontSize: 12, lineHeight: 16 },

  gateNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  errorNote: {
    fontSize: 12.5,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  toastNote: {
    fontSize: 12.5,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
});
