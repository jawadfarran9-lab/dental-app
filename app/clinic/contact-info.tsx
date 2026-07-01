import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AVATAR_PALETTE: readonly (readonly [string, string])[] = [
  ['#4D9DFF', '#1E6BE6'],
  ['#A989FF', '#7C3AED'],
  ['#34DDB0', '#0EA37A'],
  ['#FF92B3', '#E0517E'],
  ['#FFC36B', '#F59E0B'],
  ['#7B8CFF', '#4F46E5'],
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ClinicContactInfoScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { clinicId } = useClinic();
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name?: string }>();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!clinicId || !patientId) {
      setLoading(false);
      return;
    }
    getDoc(doc(db, 'clinics', clinicId, 'patients', patientId as string))
      .then((snap) => {
        if (snap.exists()) setPatient({ id: snap.id, ...(snap.data() as any) });
      })
      .catch((e) => console.error('[contact-info] load error', e))
      .finally(() => setLoading(false));
  }, [clinicId, patientId]);

  const displayName = patient?.name || (name as string) || 'Patient';
  const code = patient?.code;
  const palette = AVATAR_PALETTE[hashName(displayName) % AVATAR_PALETTE.length];

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };

  const handleCopyCode = async () => {
    if (!code) return;
    await Clipboard.setStringAsync(String(code));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  const pillBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
  const pillBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)';

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.headerBtn,
            { backgroundColor: pressed ? backBgPressed : backBg },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={backIconColor} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Patient info</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={textSecondary} />
        </View>
      ) : (
        <View style={styles.hero}>
          <LinearGradient
            colors={palette as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarInitials}>{initialsOf(displayName)}</Text>
          </LinearGradient>

          <Text style={[styles.name, { color: textPrimary }]} numberOfLines={2}>
            {displayName}
          </Text>

          {code ? (
            <Pressable
              onPress={handleCopyCode}
              style={({ pressed }) => [
                styles.codePill,
                { backgroundColor: pillBg, borderColor: pillBorder },
                pressed && { opacity: 0.75 },
              ]}
              hitSlop={6}
            >
              <Text style={[styles.codeText, { color: textSecondary }]}>
                Code · {String(code)}
              </Text>
              <Ionicons
                name={copied ? 'checkmark-outline' : 'copy-outline'}
                size={16}
                color={copied ? '#10B981' : '#3D9EFF'}
              />
              {copied ? (
                <Text style={[styles.copiedLabel, { color: '#10B981' }]}>Copied</Text>
              ) : null}
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerBtn: {
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
  headerText: { flex: 1, paddingTop: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  hero: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    gap: 14,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  copiedLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
