import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import WorkingHoursEditor from '@/src/components/WorkingHoursEditor';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
    DAYS_ORDER,
    WeeklySchedule,
    createDefaultSchedule,
    formatDayLabel,
    isValidTimeRange,
} from '@/src/types/clinicSchedule';
import { fetchClinicData } from '@/src/utils/clinicDataUtils';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#3D9EFF';
const ACCENT_DARK = '#1E6FD9';
const INDIGO = '#4F46E5';

export default function WorkingHoursScreen() {
  useClinicRoleGuard(['owner']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHours] = useState<WeeklySchedule>(
    createDefaultSchedule()
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clinicId) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchClinicData(clinicId);
        if (cancelled) return;
        setWorkingHours(data?.workingHours ?? createDefaultSchedule());
      } catch (err) {
        console.error('[WORKING-HOURS] load error', err);
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

  const handleSave = async () => {
    if (saving) return;
    if (!clinicId) {
      Alert.alert("Couldn't save", 'Missing clinic session. Please reopen the page.');
      return;
    }

    const enabled = DAYS_ORDER.filter((d) => workingHours[d].enabled);
    if (enabled.length === 0) {
      Alert.alert('Working hours', 'Enable at least one day.');
      return;
    }
    const bad = enabled.find(
      (d) => !isValidTimeRange(workingHours[d].open, workingHours[d].close)
    );
    if (bad) {
      Alert.alert(
        'Working hours',
        `Check the opening and closing times for ${formatDayLabel(bad)}.`
      );
      return;
    }

    try {
      setSaving(true);
      await setDoc(
        doc(db, 'clinics', clinicId),
        { workingHours },
        { merge: true }
      );
      Alert.alert('Saved', 'Your working hours have been updated.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('[WORKING-HOURS] save error', err);
      Alert.alert("Couldn't save", 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.10)' : '#EEF2F8';
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

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
            Working hours
          </Text>
          <Text style={[styles.headerSubtitle, { color: textSecondary }]}>
            Set days and opening times
          </Text>
        </View>

        <View
          style={[
            styles.headerPin,
            { backgroundColor: 'rgba(79,70,229,0.16)' },
          ]}
        >
          <Ionicons name="time-outline" size={20} color={INDIGO} />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={ACCENT} />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: insets.bottom + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.eyebrow, { color: textSecondary }]}>
              WEEKLY SCHEDULE
            </Text>
            <View
              style={[
                styles.card,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <WorkingHoursEditor
                value={workingHours}
                onChange={setWorkingHours}
              />
            </View>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.primaryBtnWrap,
                {
                  transform: [{ scale: pressed && !saving ? 0.98 : 1 }],
                  opacity: saving ? 0.7 : 1,
                },
              ]}
            >
              <LinearGradient
                colors={[ACCENT, ACCENT_DARK] as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryBtn}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save changes</Text>
                )}
              </LinearGradient>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
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
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12.5,
  },
  headerPin: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 8,
  },

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
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },

  primaryBtnWrap: {
    borderRadius: 16,
    marginTop: 18,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
