import { db } from '@/firebaseConfig';
import { useAuth } from '@/src/context/AuthContext';
import { createDoctorMember, listClinicMembers } from '@/src/services/clinicMembersService';
import { ClinicMember } from '@/src/types/members';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const C = {
  accent: '#2E5BFF',
  accent2: '#8B5CF6',
  ink: '#1B2542',
  ink2: '#5B6B82',
  muted: '#9AA7BD',
  fieldbg: '#F4F7FC',
  fieldbd: '#E6ECF6',
  line: '#EEF2F8',
  green: '#10B981',
  rose: '#F43F5E',
  gold: '#F5A300',
  goldDark: '#FF8A00',
  goldText: '#B97900',
  white: '#FFFFFF',
};

const DOCTOR_GRADIENTS: [string, string][] = [
  ['#4D9DFF', '#1E6BE6'],
  ['#A989FF', '#7C3AED'],
  ['#34DDB0', '#0EA37A'],
  ['#FF92B3', '#E0517E'],
  ['#FFC36B', '#F59E0B'],
];

function getInitials(displayName: string | undefined, email: string): string {
  const name = (displayName || '').trim();
  if (name) {
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => p.charAt(0).toUpperCase()).join('');
  }
  return (email || '?').charAt(0).toUpperCase();
}

function pickGradient(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return DOCTOR_GRADIENTS[hash % DOCTOR_GRADIENTS.length];
}

type SheetStep = 'paywall' | 'form';
type FormMode = 'create' | 'edit';

export default function ClinicTeamScreen() {
  useClinicRoleGuard(['owner']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { clinicId } = useAuth();

  const [members, setMembers] = useState<ClinicMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [clinicName, setClinicName] = useState<string>('');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStep, setSheetStep] = useState<SheetStep>('paywall');
  const [formMode, setFormMode] = useState<FormMode>('create');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function refreshMembers() {
    if (!clinicId) return;
    try {
      const data = await listClinicMembers(clinicId);
      setMembers(data);
    } catch (err) {
      console.error('[TEAM] refresh error', err);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clinicId) return;
      setLoading(true);
      try {
        const data = await listClinicMembers(clinicId);
        if (!cancelled) setMembers(data);
      } catch (err) {
        console.error('[TEAM] load error', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  useEffect(() => {
    let cancelled = false;
    async function loadClinicName() {
      if (!clinicId) return;
      try {
        const snap = await getDoc(doc(db, 'clinics', clinicId));
        if (cancelled || !snap.exists()) return;
        const data = snap.data() as { clinicName?: string; name?: string };
        const name = (data.clinicName || data.name || '').trim();
        if (name) setClinicName(name);
      } catch (err) {
        console.error('[TEAM] clinic name load error', err);
      }
    }
    loadClinicName();
    return () => {
      cancelled = true;
    };
  }, [clinicId]);

  const { owner, doctors } = useMemo(() => {
    const visible = members.filter((m) => m.status !== 'REMOVED');
    const ownerMember = visible.find((m) => m.role === 'owner') || null;
    const doctorMembers = visible.filter((m) => m.role === 'doctor');
    return { owner: ownerMember, doctors: doctorMembers };
  }, [members]);

  const totalCount = (owner ? 1 : 0) + doctors.length;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };

  const openSheetForCreate = () => {
    setFormMode('create');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    setSheetStep('paywall');
    setSheetOpen(true);
  };

  const openSheetForEdit = (member: ClinicMember) => {
    setFormMode('edit');
    setEmail(member.email || '');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirm(false);
    setSheetStep('form');
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
  };

  // Create a doctor (prototype: Firestore records only — no real auth or payment).
  const handleSubmit = async () => {
    if (submitting) return;
    if (formMode === 'edit') {
      // Edit not wired yet — keep as placeholder.
      closeSheet();
      return;
    }
    if (!clinicId) {
      Alert.alert('Error', 'Missing clinic session. Please reopen the page.');
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please re-enter the same password in both fields.');
      return;
    }
    const duplicate = members.some(
      (m) => (m.email || '').toLowerCase() === trimmedEmail && m.status !== 'REMOVED'
    );
    if (duplicate) {
      Alert.alert('Email already in use', 'A member of this clinic already uses this email.');
      return;
    }

    try {
      setSubmitting(true);
      await createDoctorMember(clinicId, trimmedEmail, password);
      await refreshMembers();
      closeSheet();
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      Alert.alert(
        'Doctor created',
        'They can now log in with this email and password.'
      );
    } catch (err: any) {
      console.error('[TEAM] create doctor failed', err);
      Alert.alert('Could not create doctor', err?.message || 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Placeholder — no backend wiring yet
  const handleRemoveDoctor = (_member: ClinicMember) => {
    // no-op for now
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={['#F4F8FF', '#EEF3FE', '#F6F9FF'] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backBtn,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={C.ink} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Team</Text>
          <Text style={styles.headerSubtitle}>Manage your clinic's doctors</Text>
        </View>

        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{totalCount}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Add Doctor CTA */}
        <Pressable
          onPress={openSheetForCreate}
          style={({ pressed }) => [
            styles.addCtaWrap,
            { transform: [{ scale: pressed ? 0.985 : 1 }] },
          ]}
        >
          <LinearGradient
            colors={[C.accent, C.accent2] as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addCta}
          >
            <View style={styles.addCtaIconTile}>
              <Ionicons name="add" size={22} color={C.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addCtaTitle}>Add a doctor</Text>
              <Text style={styles.addCtaSubtitle}>$3.99 / month per doctor</Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={C.white} />
          </LinearGradient>
        </Pressable>

        {/* TEAM MEMBERS */}
        <Text style={styles.eyebrow}>TEAM MEMBERS</Text>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={C.accent} />
          </View>
        ) : (
          <>
            {owner && <OwnerCard member={owner} clinicName={clinicName} />}

            {doctors.length === 0 ? (
              <Text style={styles.emptyHint}>
                No doctors yet. Add your first doctor above.
              </Text>
            ) : (
              doctors.map((doc) => (
                <DoctorCard
                  key={doc.id}
                  member={doc}
                  onEdit={() => openSheetForEdit(doc)}
                  onRemove={() => handleRemoveDoctor(doc)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Bottom sheet */}
      <BottomSheet
        visible={sheetOpen}
        onClose={closeSheet}
        step={sheetStep}
        mode={formMode}
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        showPassword={showPassword}
        showConfirm={showConfirm}
        onChangeEmail={setEmail}
        onChangePassword={setPassword}
        onChangeConfirm={setConfirmPassword}
        onToggleShowPassword={() => setShowPassword((v) => !v)}
        onToggleShowConfirm={() => setShowConfirm((v) => !v)}
        onContinueToForm={() => setSheetStep('form')}
        onSubmit={handleSubmit}
      />
    </View>
  );
}

function OwnerCard({ member, clinicName }: { member: ClinicMember; clinicName: string }) {
  const rawDisplayName = (member.displayName || '').trim();
  const isRealName =
    rawDisplayName.length > 0 && rawDisplayName.toLowerCase() !== 'owner';
  const resolvedName = isRealName
    ? rawDisplayName
    : (clinicName.trim() || 'Clinic owner');
  const initials = getInitials(resolvedName, member.email);
  return (
    <LinearGradient
      colors={['#FFFDF8', '#FFF8EC'] as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.ownerCard}
    >
      <LinearGradient
        colors={[C.gold, C.goldDark] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatar}
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {resolvedName}
          </Text>
          <View style={styles.ownerBadge}>
            <Text style={styles.ownerBadgeText}>OWNER</Text>
          </View>
        </View>
        <Text style={styles.cardEmail} numberOfLines={1}>
          {member.email}
        </Text>
      </View>

      <View style={styles.youPill}>
        <Text style={styles.youPillText}>You</Text>
      </View>
    </LinearGradient>
  );
}

function DoctorCard({
  member,
  onEdit,
  onRemove,
}: {
  member: ClinicMember;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const initials = getInitials(member.displayName, member.email);
  const grad = pickGradient(member.id || member.email || 'x');
  const isActive = member.status === 'ACTIVE';

  return (
    <View style={styles.doctorCard}>
      <LinearGradient
        colors={grad as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatar}
      >
        <Text style={styles.avatarText}>{initials}</Text>
      </LinearGradient>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {member.displayName || member.email}
          </Text>
          <View style={styles.doctorBadge}>
            <Text style={styles.doctorBadgeText}>DOCTOR</Text>
          </View>
        </View>
        <Text style={styles.cardEmail} numberOfLines={1}>
          {member.email}
        </Text>
        {isActive && (
          <View style={styles.activeRow}>
            <View style={styles.activeDot} />
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
      </View>

      <View style={styles.doctorActions}>
        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [
            styles.actionTile,
            { backgroundColor: C.fieldbg, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="pencil" size={16} color={C.accent} />
        </Pressable>
        <Pressable
          onPress={onRemove}
          style={({ pressed }) => [
            styles.actionTile,
            {
              backgroundColor: 'rgba(244, 63, 94, 0.12)',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="close" size={18} color={C.rose} />
        </Pressable>
      </View>
    </View>
  );
}

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  step: SheetStep;
  mode: FormMode;
  email: string;
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  showConfirm: boolean;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onChangeConfirm: (v: string) => void;
  onToggleShowPassword: () => void;
  onToggleShowConfirm: () => void;
  onContinueToForm: () => void;
  onSubmit: () => void;
}

function BottomSheet(p: SheetProps) {
  const insets = useSafeAreaInsets();
  const screenH = Dimensions.get('window').height;
  const sheetHeight = Math.round(screenH * 0.75);

  return (
    <Modal
      visible={p.visible}
      transparent
      animationType="slide"
      onRequestClose={p.onClose}
    >
      <View style={styles.sheetBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={p.onClose} />
        <View
          style={[
            styles.sheet,
            { height: sheetHeight, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={styles.sheetGrabWrap}>
            <View style={styles.sheetGrab} />
          </View>
          <Pressable onPress={p.onClose} style={styles.sheetClose}>
            <Ionicons name="close" size={22} color={C.ink2} />
          </Pressable>

          {p.step === 'paywall' ? (
            <PaywallStep onContinue={p.onContinueToForm} />
          ) : (
            <FormStep {...p} />
          )}
        </View>
      </View>
    </Modal>
  );
}

function PaywallStep({ onContinue }: { onContinue: () => void }) {
  const benefits = [
    'Private doctor account & login',
    'Login details emailed automatically',
    'You can edit or remove anytime',
  ];
  return (
    <ScrollView
      contentContainerStyle={styles.sheetContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[C.accent, C.accent2] as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.paywallIconTile}
      >
        <Ionicons name="star" size={26} color={C.white} />
      </LinearGradient>

      <Text style={styles.paywallTitle}>Add a doctor seat</Text>

      <View style={styles.priceRow}>
        <Text style={styles.priceBig}>$3.99</Text>
        <Text style={styles.pricePeriod}> / month</Text>
      </View>

      <Text style={styles.paywallSubtitle}>
        Each doctor gets their own secure login. Billed monthly, cancel anytime.
      </Text>

      <View style={styles.benefitList}>
        {benefits.map((b) => (
          <View key={b} style={styles.benefitRow}>
            <View style={styles.benefitCheckTile}>
              <Ionicons name="checkmark" size={14} color={C.green} />
            </View>
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      <Pressable
        onPress={onContinue}
        style={({ pressed }) => [
          styles.primaryBtnWrap,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <LinearGradient
          colors={[C.accent, C.accent2] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>Continue · $3.99/mo</Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

function FormStep(p: SheetProps) {
  const title = p.mode === 'edit' ? 'Edit doctor' : 'Add a doctor';
  const cta = p.mode === 'edit' ? 'Save changes' : 'Create doctor';

  return (
    <ScrollView
      contentContainerStyle={styles.sheetContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.formTitle}>{title}</Text>

      <FieldLabel text="Email" />
      <View style={styles.field}>
        <Ionicons name="mail-outline" size={18} color={C.muted} style={styles.fieldIcon} />
        <TextInput
          value={p.email}
          onChangeText={p.onChangeEmail}
          placeholder="doctor@clinic.com"
          placeholderTextColor={C.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          style={styles.fieldInput}
        />
      </View>

      <FieldLabel text="Password" />
      <View style={styles.field}>
        <Ionicons name="lock-closed-outline" size={18} color={C.muted} style={styles.fieldIcon} />
        <TextInput
          value={p.password}
          onChangeText={p.onChangePassword}
          placeholder="At least 8 characters"
          placeholderTextColor={C.muted}
          secureTextEntry={!p.showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.fieldInput}
        />
        <Pressable onPress={p.onToggleShowPassword} style={styles.eyeBtn} hitSlop={8}>
          <Ionicons
            name={p.showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={C.muted}
          />
        </Pressable>
      </View>

      <FieldLabel text="Confirm password" />
      <View style={styles.field}>
        <Ionicons name="lock-closed-outline" size={18} color={C.muted} style={styles.fieldIcon} />
        <TextInput
          value={p.confirmPassword}
          onChangeText={p.onChangeConfirm}
          placeholder="Re-enter password"
          placeholderTextColor={C.muted}
          secureTextEntry={!p.showConfirm}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.fieldInput}
        />
        <Pressable onPress={p.onToggleShowConfirm} style={styles.eyeBtn} hitSlop={8}>
          <Ionicons
            name={p.showConfirm ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={C.muted}
          />
        </Pressable>
      </View>

      <View style={styles.infoNote}>
        <Ionicons name="mail-outline" size={16} color={C.accent} />
        <Text style={styles.infoNoteText}>
          We'll email the login details to the doctor, and send you a
          confirmation for your records.
        </Text>
      </View>

      <Pressable
        onPress={p.onSubmit}
        style={({ pressed }) => [
          styles.primaryBtnWrap,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        <LinearGradient
          colors={[C.accent, C.accent2] as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>{cta}</Text>
        </LinearGradient>
      </Pressable>
    </ScrollView>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EEF3FE',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.92)',
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
    color: C.ink,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: C.ink2,
  },
  countPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(46,91,255,0.1)',
  },
  countPillText: {
    color: C.accent,
    fontSize: 13,
    fontWeight: '800',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },

  // Add CTA
  addCtaWrap: {
    borderRadius: 20,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
    marginBottom: 22,
  },
  addCta: {
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  addCtaIconTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCtaTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  addCtaSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12.5,
    fontWeight: '600',
  },

  // Eyebrow
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: C.ink2,
    marginBottom: 10,
  },

  // Loading
  loadingWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  // Owner card
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3E4C2',
    gap: 12,
    marginBottom: 12,
  },

  // Doctor card
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 20,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.line,
    gap: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  // Avatar
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '800',
  },

  // Card body
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    color: C.ink,
    flexShrink: 1,
  },
  cardEmail: {
    fontSize: 12.5,
    color: C.ink2,
  },

  // Owner badge
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(245,163,0,0.16)',
  },
  ownerBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: C.goldText,
    letterSpacing: 0.5,
  },
  youPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(245,163,0,0.16)',
  },
  youPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: C.goldText,
  },

  // Doctor badge
  doctorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(16,185,129,0.14)',
  },
  doctorBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0B815E',
    letterSpacing: 0.5,
  },

  // Active row
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: C.green,
  },
  activeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: C.green,
  },

  // Doctor actions
  doctorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionTile: {
    width: 34,
    height: 34,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty hint
  emptyHint: {
    textAlign: 'center',
    color: C.ink2,
    fontSize: 12.5,
    paddingVertical: 14,
  },

  // Sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,15,26,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
  },
  sheetGrabWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  sheetGrab: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: C.line,
  },
  sheetClose: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.fieldbg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetContent: {
    paddingTop: 10,
    paddingBottom: 8,
  },

  // Paywall
  paywallIconTile: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 14,
  },
  paywallTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.ink,
    textAlign: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 6,
  },
  priceBig: {
    fontSize: 34,
    fontWeight: '800',
    color: C.ink,
  },
  pricePeriod: {
    fontSize: 14,
    color: C.ink2,
    fontWeight: '600',
  },
  paywallSubtitle: {
    fontSize: 13,
    color: C.ink2,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginBottom: 18,
    lineHeight: 19,
  },
  benefitList: {
    backgroundColor: C.fieldbg,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    marginBottom: 20,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  benefitCheckTile: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: 'rgba(16,185,129,0.14)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 13.5,
    color: C.ink,
    fontWeight: '600',
    flex: 1,
  },

  // Primary button
  primaryBtnWrap: {
    borderRadius: 16,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 4,
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '800',
  },

  // Form
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.ink,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: C.ink2,
    marginBottom: 6,
    marginTop: 10,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.fieldbg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.fieldbd,
    paddingHorizontal: 12,
    height: 48,
  },
  fieldIcon: {
    marginRight: 8,
  },
  fieldInput: {
    flex: 1,
    fontSize: 14.5,
    color: C.ink,
    paddingVertical: 0,
  },
  eyeBtn: {
    paddingLeft: 8,
    paddingVertical: 6,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(46,91,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12.5,
    color: C.ink,
    lineHeight: 17,
  },
});
