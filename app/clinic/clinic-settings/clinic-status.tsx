import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import { updateClinicStatus } from '@/src/services/clinicStatusService';
import { fetchClinicPublicOwner } from '@/src/services/publicClinics';
import { ClinicData, fetchClinicData } from '@/src/utils/clinicDataUtils';
import { getClinicOpenStatus } from '@/src/utils/workingHoursStatus';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Easing,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type OptionDef = {
  mode: 'open' | 'close' | 'schedule';
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  tint: string;
  active: boolean;
};

export default function ClinicStatusScreen() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const { colors, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const auth = useAuth();

  const isOwner = !!(auth.clinicId && clinicId && auth.clinicId === clinicId);
  const canToggle = isOwner && auth.isSubscribed === true;

  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [manualClose, setManualClose] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(() => {
    if (!clinicId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [data, pub] = await Promise.all([
        fetchClinicData(clinicId),
        fetchClinicPublicOwner(clinicId),
      ]);
      if (!cancelled) {
        setClinic(data);
        setManualClose(pub?.manualClose === true);
        setManualOpen(pub?.manualOpen === true);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clinicId]);

  useFocusEffect(fetchStatus);

  // ── Success toast ──
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTransY = useRef(new Animated.Value(10)).current;

  const flashToast = useCallback(() => {
    setShowToast(true);
    toastOpacity.setValue(0);
    toastTransY.setValue(10);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1000),
        Animated.timing(toastOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(toastTransY, { toValue: 0, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.delay(1000),
        Animated.timing(toastTransY, { toValue: -10, duration: 400, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start(() => setShowToast(false));
  }, [toastOpacity, toastTransY]);

  const setClinicStatus = useCallback(async (mode: 'open' | 'close' | 'schedule') => {
    if (!canToggle || !clinicId) return;
    const prev = { manualClose, manualOpen };
    const optimistic =
      mode === 'open'     ? { manualClose: false, manualOpen: true } :
      mode === 'close'    ? { manualClose: true,  manualOpen: false } :
      /* schedule */        { manualClose: false, manualOpen: false };
    setManualClose(optimistic.manualClose);
    setManualOpen(optimistic.manualOpen);
    try {
      await updateClinicStatus(clinicId, mode, clinic?.workingHours);
      flashToast();
    } catch (err) {
      console.error('Clinic status update failed:', err);
      setManualClose(prev.manualClose);
      setManualOpen(prev.manualOpen);
      Alert.alert('Status Update Failed', 'Unable to update clinic status. Please try again.');
    }
  }, [canToggle, clinicId, manualClose, manualOpen, clinic?.workingHours, flashToast]);

  // ── Status dot pulse ──
  const dotScale = useRef(new Animated.Value(1)).current;
  const dotOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(dotScale, { toValue: 1.25, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dotScale, { toValue: 1,    duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dotOpacity, { toValue: 0.6, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dotOpacity, { toValue: 1,   duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [dotScale, dotOpacity]);

  // ── Card entry spring ──
  const cardScale = useRef(new Animated.Value(0.96)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(cardScale, { toValue: 1, friction: 8, tension: 60, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [cardScale, cardOpacity]);

  // Schedule-derived info for Auto mode detail
  const scheduleStatus = useMemo(() => {
    if (!clinic?.workingHours) return null;
    return getClinicOpenStatus(clinic.workingHours);
  }, [clinic?.workingHours]);

  const statusHeader = useMemo(() => {
    if (manualOpen)  return { label: 'OPEN NOW',  sub: 'Your clinic is visible to patients', color: '#10B981' };
    if (manualClose) return { label: 'CLOSED',    sub: 'Patients cannot see your clinic',    color: '#EF4444' };
    return             { label: 'AUTO MODE', sub: 'Following your working hours',       color: '#3D9EFF' };
  }, [manualOpen, manualClose]);

  // Tap scale refs
  const scaleRefs = useRef([new Animated.Value(1), new Animated.Value(1), new Animated.Value(1)]).current;

  const handlePress = useCallback((mode: 'open' | 'close' | 'schedule', idx: number) => {
    Animated.sequence([
      Animated.spring(scaleRefs[idx], { toValue: 0.94, stiffness: 180, damping: 12, mass: 1, useNativeDriver: true }),
      Animated.spring(scaleRefs[idx], { toValue: 1,    stiffness: 180, damping: 12, mass: 1, useNativeDriver: true }),
    ]).start();
    setClinicStatus(mode);
  }, [setClinicStatus, scaleRefs]);

  if (loading) {
    return (
      <View style={[s.centered, { backgroundColor: 'transparent' }]}>
        <PremiumGradientBackground isDark={isDark} showSparkles={true} />
        <ActivityIndicator size="large" color={colors.textSecondary} />
      </View>
    );
  }

  if (!canToggle) {
    return (
      <View style={[s.centered, { backgroundColor: 'transparent' }]}>
        <PremiumGradientBackground isDark={isDark} showSparkles={true} />
        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
          Only clinic owners with an active subscription can change status.
        </Text>
      </View>
    );
  }

  const isAuto = !manualClose && !manualOpen;

  const OPTIONS: OptionDef[] = [
    {
      mode: 'open', label: 'Open Clinic Now',
      subtitle: 'Patients can find and contact you',
      icon: 'checkmark-circle', color: '#10B981',
      tint: isDark ? 'rgba(16,185,129,0.10)' : 'rgba(16,185,129,0.06)',
      active: manualOpen,
    },
    {
      mode: 'close', label: 'Close Clinic Now',
      subtitle: 'Hide clinic from patients',
      icon: 'close-circle', color: '#EF4444',
      tint: isDark ? 'rgba(239,68,68,0.10)' : 'rgba(239,68,68,0.06)',
      active: manualClose,
    },
    {
      mode: 'schedule', label: 'Return to Schedule',
      subtitle: 'Follow your schedule automatically',
      icon: 'time', color: '#3D9EFF',
      tint: isDark ? 'rgba(61,158,255,0.10)' : 'rgba(61,158,255,0.06)',
      active: isAuto,
    },
  ];

  let autoDetail: string | null = null;
  if (isAuto && scheduleStatus) {
    if (scheduleStatus.status === 'open' && scheduleStatus.closesAt) {
      autoDetail = `Next change: closes at ${scheduleStatus.closesAt}`;
    } else if (scheduleStatus.status === 'closed' && scheduleStatus.opensAt) {
      autoDetail = `Next change: opens at ${scheduleStatus.opensAt}`;
    }
  }

  const glowShadow = Platform.OS === 'ios'
    ? { shadowColor: statusHeader.color, shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: 4 } }
    : { elevation: 10 };

  // Per-option glow for selected state (iOS)
  const optionGlow = (color: string) => Platform.OS === 'ios'
    ? { shadowColor: color, shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 3 } }
    : { elevation: 6 };

  return (
    <View style={[s.container, { backgroundColor: 'transparent', paddingTop: headerHeight + 12 }]}>
      <PremiumGradientBackground isDark={isDark} showSparkles={true} />

      {/* ── Status Header ── */}
      <Animated.View style={[
        s.card,
        s.glass,
        glowShadow,
        { backgroundColor: isDark ? 'rgba(30,42,60,0.97)' : 'rgba(255,255,255,0.72)' },
        { transform: [{ scale: cardScale }], opacity: cardOpacity },
      ]}>
        <View style={s.statusHeaderRow}>
          <Animated.View style={[
            s.statusDotLarge,
            { backgroundColor: statusHeader.color, transform: [{ scale: dotScale }], opacity: dotOpacity },
          ]} />
          <Text style={[s.statusLabel, { color: statusHeader.color }]}>
            {statusHeader.label}
          </Text>
        </View>
        <Text style={[s.statusSub, { color: isDark ? '#8A96A6' : '#7A8A9C' }]}>
          {statusHeader.sub}
        </Text>
        {isAuto && autoDetail && (
          <View style={s.autoDetailRow}>
            <Ionicons name="time-outline" size={14} color={isDark ? '#6B7A8D' : '#94A3B8'} />
            <Text style={[s.autoDetailText, { color: isDark ? '#6B7A8D' : '#94A3B8' }]}>
              {autoDetail}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* ── Options ── */}
      <Animated.View style={[
        s.card,
        s.glass,
        { backgroundColor: isDark ? 'rgba(30,42,60,0.97)' : 'rgba(255,255,255,0.72)', marginTop: 8 },
        { transform: [{ scale: cardScale }], opacity: cardOpacity },
      ]}>
        <Text style={[s.heading, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>
          Clinic Hours & Status
        </Text>
        <Text style={[s.description, { color: isDark ? '#8A96A6' : '#7A8A9C' }]}>
          Control how your clinic appears to patients
        </Text>

        {OPTIONS.map(({ mode, label, subtitle, icon, color, tint, active }, idx) => (
          <Animated.View key={mode} style={[
            { transform: [{ scale: scaleRefs[idx] }] },
            active ? optionGlow(color) : undefined,
          ]}>
            <TouchableOpacity
              style={[
                s.option,
                { backgroundColor: active ? tint : 'transparent' },
                active
                  ? { borderColor: `${color}99`, borderWidth: 1 }
                  : { borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderWidth: 1 },
              ]}
              activeOpacity={0.92}
              onPress={() => handlePress(mode, idx)}
            >
              <View style={s.optionLeft}>
                <View style={[
                  s.iconCircle,
                  {
                    backgroundColor: active
                      ? (color === '#10B981' ? 'rgba(34,197,94,0.15)'
                        : color === '#EF4444' ? 'rgba(239,68,68,0.15)'
                        : 'rgba(59,130,246,0.15)')
                      : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  },
                ]}>
                  <Ionicons name={icon} size={24} color={color} />
                </View>
                <View style={s.optionTextWrap}>
                  <Text style={[s.optionTitle, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>
                    {label}
                  </Text>
                  <Text style={[s.optionSub, { color: isDark ? '#6B7A8D' : '#94A3B8' }]}>
                    {subtitle}
                  </Text>
                </View>
              </View>
              {active && <Ionicons name="checkmark-circle" size={20} color={color} />}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </Animated.View>

      {/* ── Success toast ── */}
      {showToast && (
        <Animated.View style={[
          s.toast,
          {
            opacity: toastOpacity,
            transform: [{ translateY: toastTransY }],
            backgroundColor: isDark ? 'rgba(30,42,60,0.95)' : 'rgba(255,255,255,0.95)',
          },
        ]}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={[s.toastText, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>Status updated</Text>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 22,
  },
  glass: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
    }),
  },
  // ── Status header ──
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginBottom: 5,
  },
  statusDotLarge: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusSub: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  autoDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.10)',
  },
  autoDetailText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  // ── Options card ──
  heading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    marginBottom: 18,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionSub: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  // ── Toast ──
  toast: {
    position: 'absolute',
    bottom: 44,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },
      android: { elevation: 8 },
    }),
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
