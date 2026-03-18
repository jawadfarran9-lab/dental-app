import { db } from '@/firebaseConfig';
import { useTheme } from '@/src/context/ThemeContext';
import { useAuth } from '@/src/hooks/useAuth';
import { fetchClinicPublicOwner } from '@/src/services/publicClinics';
import { ClinicData, fetchClinicData } from '@/src/utils/clinicDataUtils';
import { getClinicOpenStatus } from '@/src/utils/workingHoursStatus';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ClinicStatusScreen() {
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const { colors, isDark } = useTheme();
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

  const setClinicStatus = useCallback(async (mode: 'open' | 'close' | 'schedule') => {
    if (!canToggle || !clinicId) return;
    const prev = { manualClose, manualOpen };
    const next =
      mode === 'open'     ? { manualClose: false, manualOpen: true } :
      mode === 'close'    ? { manualClose: true,  manualOpen: false } :
      /* schedule */        { manualClose: false, manualOpen: false };

    let derivedStatus: 'open' | 'closed' = 'closed';
    if (next.manualClose) {
      derivedStatus = 'closed';
    } else if (next.manualOpen) {
      derivedStatus = 'open';
    } else if (clinic?.workingHours) {
      derivedStatus = getClinicOpenStatus(clinic.workingHours).status === 'open' ? 'open' : 'closed';
    }

    setManualClose(next.manualClose);
    setManualOpen(next.manualOpen);
    try {
      await setDoc(doc(db, 'clinics_public', clinicId), { ...next, status: derivedStatus }, { merge: true });
    } catch (err) {
      console.error('Clinic status update failed:', err);
      setManualClose(prev.manualClose);
      setManualOpen(prev.manualOpen);
      Alert.alert('Status Update Failed', 'Unable to update clinic status. Please try again.');
    }
  }, [canToggle, clinicId, manualClose, manualOpen, clinic?.workingHours]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.textSecondary} />
      </View>
    );
  }

  if (!canToggle) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary, fontSize: 15 }}>
          Only clinic owners with an active subscription can change status.
        </Text>
      </View>
    );
  }

  const OPTIONS: { mode: 'open' | 'close' | 'schedule'; label: string; color: string; active: boolean }[] = [
    { mode: 'open',     label: 'Open Clinic Now',    color: '#10B981', active: manualOpen },
    { mode: 'close',    label: 'Close Clinic Now',   color: '#EF4444', active: manualClose },
    { mode: 'schedule', label: 'Return to Schedule', color: '#3D9EFF', active: !manualClose && !manualOpen },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[
        styles.card,
        { backgroundColor: isDark ? 'rgba(30,42,60,0.97)' : 'rgba(255,255,255,0.96)' },
      ]}>
        <Text style={[styles.heading, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>
          Clinic Status
        </Text>

        {OPTIONS.map(({ mode, label, color, active }) => (
          <TouchableOpacity
            key={mode}
            style={[styles.option, active && styles.optionActive]}
            activeOpacity={0.7}
            onPress={() => setClinicStatus(mode)}
          >
            <View style={[styles.optionDot, { backgroundColor: color }]} />
            <Text style={[styles.optionText, { color: isDark ? '#F0F2F5' : '#1A2B3F' }]}>
              {label}
            </Text>
            {active && <Ionicons name="checkmark" size={18} color={color} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#0D1B2A',
        shadowOpacity: 0.15,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 10 },
    }),
  },
  heading: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: 'rgba(61,158,255,0.08)',
  },
  optionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
