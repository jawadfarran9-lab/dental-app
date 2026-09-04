import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { deleteChatForClinic } from '@/src/services/chatClear';
import { requestOpenSearch } from '@/src/state/chatSearchSignal';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { clinicId } = useAuth();
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name?: string }>();

  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [mediaCount, setMediaCount] = useState(0);
  const [starredCount, setStarredCount] = useState(0);
  const [clearedForClinicAt, setClearedForClinicAt] = useState<number>(0);
  const [clearing, setClearing] = useState(false);
  useEffect(() => {
    if (!patientId) return;
    const qy = query(
      collection(db, `patients/${patientId}/messages`),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(
      qy,
      (snap) => {
        let count = 0;
        snap.forEach((d) => {
          const m: any = d.data();
          const t = typeof m.createdAt === 'number' ? m.createdAt : 0;
          if (t <= clearedForClinicAt) return;
          if (m.type === 'image' && m.imageUrl) count += 1;
          else if (m.type === 'video' && m.videoUrl) count += 1;
          else if (m.type === 'album' && Array.isArray(m.media)) count += m.media.length;
        });
        setMediaCount(count);
        setStarredCount(snap.docs.filter((d) => (d.data() as any).starredClinic === true).length);
      },
      (e) => console.error('[contact-info] media count sub error', e),
    );
    return () => unsub();
  }, [patientId, clearedForClinicAt]);

  useEffect(() => {
    if (!clinicId || !patientId) return;
    const unsub = onSnapshot(
      doc(db, 'threads', `${clinicId}_${patientId}`),
      (snap) => {
        const v = snap.exists() ? (snap.data() as any).clearedForClinicAt : 0;
        setClearedForClinicAt(typeof v === 'number' ? v : 0);
      },
      (e) => console.error('[contact-info] thread marker sub error', e),
    );
    return () => unsub();
  }, [clinicId, patientId]);


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

  const handleDeleteChat = () => {
    if (!clinicId || !patientId || clearing) return;
    Alert.alert(
      'Delete chat?',
      'This removes the chat from your list and clears it on your side. The patient keeps their copy. The chat returns (starting fresh) if either side sends a new message.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setClearing(true);
              await deleteChatForClinic({
                clinicId: clinicId as string,
                patientId: patientId as string,
              });
              const r = router as any;
              if (typeof r.dismiss === 'function') {
                try { r.dismiss(2); } catch { r.back(); requestAnimationFrame(() => r.back()); }
              } else {
                r.back();
                requestAnimationFrame(() => r.back());
              }
            } catch (e) {
              console.error('[contact-info] delete chat error', e);
              Alert.alert('Could not delete', 'Please try again.');
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  };

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;

  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  const pillBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.7)';
  const pillBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)';

  const cardBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.55)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.75)';
  const rowIconBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(61,158,255,0.14)';
  const rowIconColor = '#3D9EFF';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(27,37,66,0.06)';
  const chevronColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(27,37,66,0.35)';

  const phone: string | undefined = patient?.phone || undefined;
  const email: string | undefined = patient?.email || undefined;
  const address: string | undefined = patient?.address || undefined;
  const genderRaw: string | undefined = patient?.gender || undefined;
  const genderDisplay = genderRaw
    ? genderRaw.charAt(0).toUpperCase() + genderRaw.slice(1).toLowerCase()
    : undefined;
  const dob: string | undefined = patient?.dateOfBirth || undefined;

  const hasContact = !!(phone || email);

  const renderRow = (opts: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value: string;
    onPress?: () => void;
    showChevron?: boolean;
    isLast?: boolean;
  }) => {
    const { icon, label, value, onPress, showChevron, isLast } = opts;
    const body = (
      <View style={styles.rowInner}>
        <View style={[styles.rowIconWrap, { backgroundColor: rowIconBg }]}>
          <Ionicons name={icon} size={18} color={rowIconColor} />
        </View>
        <View style={styles.rowBody}>
          <Text style={[styles.rowLabel, { color: textSecondary }]}>{label}</Text>
          <Text style={[styles.rowValue, { color: textPrimary }]} numberOfLines={2}>
            {value}
          </Text>
        </View>
        {showChevron ? (
          <Ionicons name="chevron-forward" size={18} color={chevronColor} />
        ) : null}
      </View>
    );
    return (
      <View>
        {onPress ? (
          <Pressable
            onPress={onPress}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
          >
            {body}
          </Pressable>
        ) : (
          <View style={styles.row}>{body}</View>
        )}
        {!isLast ? (
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        ) : null}
      </View>
    );
  };

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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
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

          {hasContact ? (
            <>
              <Text style={[styles.eyebrow, { color: textSecondary }]}>CONTACT</Text>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {phone
                  ? renderRow({
                      icon: 'call-outline',
                      label: 'Phone',
                      value: phone,
                      onPress: () => Linking.openURL(`tel:${phone}`),
                      showChevron: true,
                      isLast: !email,
                    })
                  : null}
                {email
                  ? renderRow({
                      icon: 'mail-outline',
                      label: 'Email',
                      value: email,
                      onPress: () => Linking.openURL(`mailto:${email}`),
                      showChevron: true,
                      isLast: true,
                    })
                  : null}
              </View>
            </>
          ) : null}

          <Text style={[styles.eyebrow, { color: textSecondary }]}>DETAILS</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {(() => {
              const rows: React.ReactNode[] = [];
              const push = (node: React.ReactNode) => rows.push(node);
              if (dob) {
                push(
                  renderRow({
                    icon: 'calendar-outline',
                    label: 'Date of birth',
                    value: dob,
                  }),
                );
              }
              if (genderDisplay) {
                push(
                  renderRow({
                    icon: 'person-outline',
                    label: 'Gender',
                    value: genderDisplay,
                  }),
                );
              }
              if (address) {
                push(
                  renderRow({
                    icon: 'location-outline',
                    label: 'Address',
                    value: address,
                  }),
                );
              }
              push(
                renderRow({
                  icon: 'person-circle-outline',
                  label: 'Profile',
                  value: 'View full profile',
                  onPress: () => router.push(`/clinic/${patientId}` as any),
                  showChevron: true,
                  isLast: true,
                }),
              );
              return rows.map((r, i) => (
                <View key={i}>{r}</View>
              ));
            })()}
          </View>

          <Text style={[styles.eyebrow, { color: textSecondary }]}>CHAT</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {renderRow({
              icon: 'search',
              label: 'Search',
              value: 'Search in this chat',
              onPress: () => {
                requestOpenSearch();
                if (router.canGoBack()) router.back();
              },
              showChevron: true,
              isLast: false,
            })}
            {renderRow({
              icon: 'archive-outline',
              label: 'Archive this chat',
              value: 'Move this chat to the Archived folder',
              onPress: () => router.push({
                pathname: '/clinic/patient-archive' as any,
                params: { patientId: patientId ?? '', name: (name as string) ?? '' },
              }),
              showChevron: true,
              isLast: true,
            })}
          </View>

          <Text style={[styles.eyebrow, { color: textSecondary }]}>STARRED</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {renderRow({
              icon: 'star',
              label: 'Starred messages',
              value: starredCount > 0 ? `${starredCount} message${starredCount === 1 ? '' : 's'}` : 'None yet',
              onPress: () => router.push({ pathname: '/clinic/starred', params: { patientId, name: displayName } } as any),
              showChevron: true,
              isLast: true,
            })}
          </View>

          <Text style={[styles.eyebrow, { color: textSecondary }]}>MEDIA</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {renderRow({
              icon: 'images-outline',
              label: 'Media',
              value: mediaCount > 0 ? `${mediaCount} item${mediaCount === 1 ? '' : 's'}` : 'None yet',
              onPress: () => router.push({
                pathname: '/clinic/media-all' as any,
                params: { patientId: patientId ?? '', name: name ?? '' },
              }),
              showChevron: true,
              isLast: true,
            })}
          </View>

          <Text style={[styles.eyebrow, { color: textSecondary }]}>DANGER ZONE</Text>
          <View
            style={[
              styles.card,
              { backgroundColor: cardBg, borderColor: cardBorder },
            ]}
          >
            <Pressable
              onPress={handleDeleteChat}
              disabled={clearing}
              style={({ pressed }) => [
                styles.row,
                pressed && !clearing && { opacity: 0.7 },
                clearing && { opacity: 0.5 },
              ]}
            >
              <View style={styles.rowInner}>
                <View
                  style={[
                    styles.rowIconWrap,
                    { backgroundColor: 'rgba(239,68,68,0.14)' },
                  ]}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </View>
                <View style={styles.rowBody}>
                  <Text style={[styles.rowLabel, { color: textSecondary }]}>
                    DELETE CHAT
                  </Text>
                  <Text
                    style={[styles.rowValue, { color: '#EF4444' }]}
                    numberOfLines={2}
                  >
                    Removes this chat from your list and clears it on your side. The patient keeps their copy.
                  </Text>
                </View>
                {clearing ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : null}
              </View>
            </Pressable>
          </View>
        </ScrollView>
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
    marginTop: 14,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1 },
  rowLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginLeft: 62,
  },

});
