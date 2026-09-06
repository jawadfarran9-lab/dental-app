import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { DENTAL_SESSIONS, type DentalSession } from '@/src/constants/sessions/dentalSessions';
import { createSessionRecord, updateSessionRecord } from '@/src/services/sessionRecordsService';
import { uploadSessionPhotos, listSessionPhotos, updateSessionPhoto, deleteSessionPhoto } from '@/src/services/sessionPhotosService';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#1668E3';
const SAVE_GREEN = '#10B981';
const RENAME_RED = '#C2463F';
const RENAME_BG = '#FDEFF0';

type SessionStatus = 'planned' | 'in_progress' | 'done';

type PhotoCategory = 'before' | 'after' | 'xray' | 'intraoral' | 'scan' | 'other';

type StagedPhoto = {
  key: string;
  uri: string;
  category: PhotoCategory;
  sharedWithPatient: boolean;
  saved?: boolean;
  id?: string;
  storagePath?: string;
};

const PHOTO_CATEGORIES: { key: PhotoCategory; label: string }[] = [
  { key: 'before', label: 'Before' },
  { key: 'after', label: 'After' },
  { key: 'xray', label: 'X-ray' },
  { key: 'intraoral', label: 'Intraoral' },
  { key: 'scan', label: 'Scan' },
  { key: 'other', label: 'Other' },
];

function labelForCategory(c: PhotoCategory): string {
  return PHOTO_CATEGORIES.find((x) => x.key === c)?.label ?? 'Other';
}

const SCREEN_W = Dimensions.get('window').width;
const PHOTO_GRID_GAP = 8;
const PHOTO_CELL = Math.floor((SCREEN_W - 32 - 32 - PHOTO_GRID_GAP * 2) / 3);

function formatDateTime(d: Date): string {
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === y.toDateString();
  const t = new Date(now);
  t.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === t.toDateString();

  let day: string;
  if (sameDay) day = 'Today';
  else if (isYesterday) day = 'Yesterday';
  else if (isTomorrow) day = 'Tomorrow';
  else day = d.toLocaleDateString([], { month: 'short', day: 'numeric' });

  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const time = `${h12}:${m.toString().padStart(2, '0')} ${ampm}`;

  return `${day} · ${time}`;
}

export default function SessionSetupScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { patientId, name: patientName, slug, sessionName, editSessionId } = useLocalSearchParams<{
    patientId?: string;
    name?: string;
    slug: string;
    sessionName?: string;
    editSessionId?: string;
  }>();
  const { clinicId, memberId } = useAuth();

  const initial =
    DENTAL_SESSIONS.find((s) => s.slug === slug) ?? DENTAL_SESSIONS[0];
  const [selected, setSelected] = useState<DentalSession>(initial);
  const [name, setName] = useState<string>(sessionName ?? initial.name);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Stage 1a — session details form (local state only)
  const [dateTime, setDateTime] = useState<Date>(() => new Date());
  const [status, setStatus] = useState<SessionStatus>('planned');
  const [toothAreas, setToothAreas] = useState<string[]>([]);
  const [toothInputOpen, setToothInputOpen] = useState(false);
  const [toothDraft, setToothDraft] = useState('');
  const [whatDone, setWhatDone] = useState('');
  const [materials, setMaterials] = useState('');
  const [aftercare, setAftercare] = useState('');
  const [nextAppt, setNextAppt] = useState<Date | null>(null);
  const [dtPicker, setDtPicker] = useState<null | 'date' | 'time'>(null);
  const [apptPicker, setApptPicker] = useState<null | 'date' | 'time'>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState<boolean>(!!editSessionId);
  const [initialStatus, setInitialStatus] = useState<SessionStatus | null>(null);

  // Photos-1a — staged (local-only) photos for this session
  const [photos, setPhotos] = useState<StagedPhoto[]>([]);
  const [photoSheet, setPhotoSheet] = useState<string | null>(null);
  const [addSheet, setAddSheet] = useState(false);

  useEffect(() => {
    if (editSessionId) return;
    const s = DENTAL_SESSIONS.find((x) => x.slug === slug);
    if (s) {
      setSelected(s);
      setName(sessionName ?? s.name);
    }
  }, [slug, sessionName, editSessionId]);

  useEffect(() => {
    if (!editSessionId || !clinicId || !patientId) return;
    let cancelled = false;
    (async () => {
      try {
        const mainRef = doc(
          db,
          `clinics/${clinicId}/patients/${patientId}/sessions/${editSessionId}`
        );
        const privateRef = doc(
          db,
          `clinics/${clinicId}/patients/${patientId}/sessions/${editSessionId}/private/main`
        );
        const [mainSnap, privSnap] = await Promise.all([
          getDoc(mainRef),
          getDoc(privateRef),
        ]);
        if (cancelled) return;
        if (!mainSnap.exists()) {
          Alert.alert('Not found', 'This session no longer exists.');
          router.back();
          return;
        }
        const m: any = mainSnap.data();
        const p: any = privSnap.exists() ? privSnap.data() : {};

        const cat =
          DENTAL_SESSIONS.find((x) => x.slug === m.templateSlug) ??
          DENTAL_SESSIONS[0];
        const localStatus: SessionStatus =
          m.status === 'COMPLETED'
            ? 'done'
            : m.status === 'IN_PROGRESS'
              ? 'in_progress'
              : 'planned';

        setSelected(cat);
        setName(typeof m.title === 'string' ? m.title : cat.name);
        setDateTime(new Date(typeof m.date === 'number' ? m.date : Date.now()));
        setStatus(localStatus);
        setInitialStatus(localStatus);
        setToothAreas(Array.isArray(m.toothAreas) ? m.toothAreas : []);
        setWhatDone(typeof m.patientSummary === 'string' ? m.patientSummary : '');
        setAftercare(typeof m.aftercare === 'string' ? m.aftercare : '');
        setNextAppt(
          typeof m.nextAppointmentAt === 'number'
            ? new Date(m.nextAppointmentAt)
            : null
        );
        setMaterials(typeof p.materialsUsed === 'string' ? p.materialsUsed : '');

        setLoadingEdit(false);
      } catch (e: any) {
        if (cancelled) return;
        Alert.alert('Load failed', e?.message ?? 'Please try again');
        router.back();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editSessionId, clinicId, patientId, router]);

  useEffect(() => {
    if (!editSessionId || !clinicId || !patientId) return;
    let cancelled = false;
    (async () => {
      try {
        const docs = await listSessionPhotos({
          clinicId,
          patientId,
          sessionId: editSessionId,
        });
        if (cancelled) return;
        setPhotos(
          docs.map((d) => ({
            key: d.id,
            id: d.id,
            saved: true,
            uri: d.url,
            storagePath: d.storagePath,
            category: d.category as PhotoCategory,
            sharedWithPatient: !!d.sharedWithPatient,
          })),
        );
      } catch (e) {
        if (cancelled) return;
        console.warn('[session-setup] listSessionPhotos failed', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editSessionId, clinicId, patientId]);

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const muted = colors.textTertiary;
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27, 37, 66, 0.08)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27, 37, 66, 0.08)';
  const dashedBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(27, 37, 66, 0.18)';
  const indicatorBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27, 37, 66, 0.06)';

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };

  const openSwitcher = () => setSwitcherOpen(true);
  const closeSwitcher = () => setSwitcherOpen(false);

  const pickSession = (item: DentalSession) => {
    setSelected(item);
    setName(item.name);
    setMode('view');
    setSwitcherOpen(false);
  };

  const startRename = () => {
    setMode('edit');
    setName('');
  };

  const saveRename = () => {
    setMode('view');
    if (!name.trim()) setName(selected.name);
  };

  const resetRename = () => {
    setMode('view');
    setName(selected.name);
  };

  const addToothArea = () => {
    const v = toothDraft.trim();
    if (!v) return;
    setToothAreas((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setToothDraft('');
    setToothInputOpen(false);
  };
  const removeToothArea = (v: string) => {
    setToothAreas((prev) => prev.filter((x) => x !== v));
  };

  const stageAssets = (uris: string[]) => {
    if (uris.length === 0) return;
    const base = Date.now();
    setPhotos((prev) => [
      ...prev,
      ...uris.map((uri, idx) => ({
        key: `${base}_${idx}_${Math.random().toString(36).slice(2, 8)}`,
        uri,
        category: 'other' as PhotoCategory,
        sharedWithPatient: false,
      })),
    ]);
  };

  const openAddSheet = () => setAddSheet(true);
  const closeAddSheet = () => setAddSheet(false);

  const handleTakePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1,
      });
      closeAddSheet();
      if (!result.canceled && result.assets && result.assets.length > 0) {
        stageAssets(result.assets.map((a) => a.uri));
      }
    } catch (e: any) {
      closeAddSheet();
      Alert.alert('Camera error', e?.message ?? 'Please try again');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Gallery access is required to pick photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 1,
      });
      closeAddSheet();
      if (!result.canceled && result.assets && result.assets.length > 0) {
        stageAssets(result.assets.map((a) => a.uri));
      }
    } catch (e: any) {
      closeAddSheet();
      Alert.alert('Gallery error', e?.message ?? 'Please try again');
    }
  };

  const setPhotoCategory = (key: string, category: PhotoCategory) => {
    const item = photos.find((p) => p.key === key);
    setPhotos((prev) => prev.map((p) => (p.key === key ? { ...p, category } : p)));
    if (
      item?.saved &&
      item.id &&
      editSessionId &&
      clinicId &&
      patientId
    ) {
      updateSessionPhoto({
        clinicId,
        patientId,
        sessionId: editSessionId,
        photoId: item.id,
        patch: { category },
      }).catch((e) => {
        console.warn('[session-setup] updateSessionPhoto category', e);
      });
    }
  };
  const setPhotoShared = (key: string, sharedWithPatient: boolean) => {
    const item = photos.find((p) => p.key === key);
    setPhotos((prev) =>
      prev.map((p) => (p.key === key ? { ...p, sharedWithPatient } : p)),
    );
    if (
      item?.saved &&
      item.id &&
      editSessionId &&
      clinicId &&
      patientId
    ) {
      updateSessionPhoto({
        clinicId,
        patientId,
        sessionId: editSessionId,
        photoId: item.id,
        patch: { sharedWithPatient },
      }).catch((e) => {
        console.warn('[session-setup] updateSessionPhoto shared', e);
      });
    }
  };
  const removePhoto = (key: string) => {
    const item = photos.find((p) => p.key === key);
    if (!item) return;
    if (item.saved && item.id && editSessionId && clinicId && patientId) {
      Alert.alert(
        'Delete photo?',
        'This permanently deletes the photo from this session.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteSessionPhoto({
                  clinicId,
                  patientId,
                  sessionId: editSessionId,
                  photoId: item.id!,
                  storagePath: item.storagePath,
                });
                setPhotos((prev) => prev.filter((p) => p.key !== key));
                setPhotoSheet(null);
              } catch (e: any) {
                Alert.alert(
                  'Delete failed',
                  e?.message ?? 'Please try again',
                );
              }
            },
          },
        ],
      );
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.key !== key));
    setPhotoSheet(null);
  };

  const activePhoto = photoSheet
    ? photos.find((p) => p.key === photoSheet) ?? null
    : null;

  const handleSave = async () => {
    if (saving) return;
    if (!clinicId || !patientId || !memberId) {
      Alert.alert('Cannot save', 'Missing clinic or patient.');
      return;
    }
    const title = name.trim() || selected.name;
    if (!title) return;
    Haptics.selectionAsync().catch(() => {});
    setSaving(true);
    try {
      const mappedStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' =
        status === 'done'
          ? 'COMPLETED'
          : status === 'in_progress'
            ? 'IN_PROGRESS'
            : 'PENDING';
      let savedSessionId: string;
      if (editSessionId) {
        const mappedInitial: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | null =
          initialStatus === 'done'
            ? 'COMPLETED'
            : initialStatus === 'in_progress'
              ? 'IN_PROGRESS'
              : initialStatus === 'planned'
                ? 'PENDING'
                : null;
        await updateSessionRecord(editSessionId, {
          clinicId,
          patientId,
          memberId,
          templateSlug: selected.slug,
          templateName: selected.name,
          title,
          date: dateTime.getTime(),
          status: mappedStatus,
          toothAreas,
          patientSummary: whatDone.trim(),
          aftercare: aftercare.trim(),
          nextAppointmentAt: nextAppt ? nextAppt.getTime() : null,
          materialsUsed: materials.trim(),
          statusChanged: mappedInitial !== null && mappedInitial !== mappedStatus,
        });
        savedSessionId = editSessionId;
      } else {
        const created = await createSessionRecord({
          clinicId,
          patientId,
          memberId,
          templateSlug: selected.slug,
          templateName: selected.name,
          title,
          date: dateTime.getTime(),
          status: mappedStatus,
          toothAreas,
          patientSummary: whatDone.trim(),
          aftercare: aftercare.trim(),
          nextAppointmentAt: nextAppt ? nextAppt.getTime() : null,
          materialsUsed: materials.trim(),
        });
        savedSessionId = created.sessionId;
      }

      const toUpload = photos.filter((p) => p.saved !== true);
      if (toUpload.length > 0) {
        setUploadingPhotos(true);
        try {
          const { failed } = await uploadSessionPhotos(
            {
              clinicId,
              patientId,
              sessionId: savedSessionId,
              memberId,
            },
            toUpload.map((p) => ({
              uri: p.uri,
              category: p.category,
              sharedWithPatient: p.sharedWithPatient,
            })),
          );
          if (failed > 0) {
            Alert.alert(
              'Session saved',
              `Session saved, ${failed} photo${failed === 1 ? '' : 's'} failed to upload.`,
            );
          }
        } catch (e: any) {
          Alert.alert(
            'Session saved',
            'Session saved, some photos failed to upload.',
          );
        } finally {
          setUploadingPhotos(false);
        }
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Save failed', e?.message ?? 'Please try again');
    } finally {
      setSaving(false);
    }
  };

  const onDtChange = (_: unknown, picked?: Date) => {
    if (Platform.OS === 'android') setDtPicker(null);
    if (!picked) return;
    if (dtPicker === 'date') {
      const next = new Date(picked);
      next.setHours(dateTime.getHours(), dateTime.getMinutes(), 0, 0);
      setDateTime(next);
      if (Platform.OS === 'android') setTimeout(() => setDtPicker('time'), 0);
      else setDtPicker('time');
    } else {
      const next = new Date(dateTime);
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      setDateTime(next);
      if (Platform.OS === 'ios') setDtPicker(null);
    }
  };

  const apptBase = () => nextAppt ?? new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const onApptChange = (_: unknown, picked?: Date) => {
    if (Platform.OS === 'android') setApptPicker(null);
    if (!picked) return;
    const base = apptBase();
    if (apptPicker === 'date') {
      const next = new Date(picked);
      next.setHours(base.getHours(), base.getMinutes(), 0, 0);
      setNextAppt(next);
      if (Platform.OS === 'android') setTimeout(() => setApptPicker('time'), 0);
      else setApptPicker('time');
    } else {
      const next = new Date(base);
      next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      setNextAppt(next);
      if (Platform.OS === 'ios') setApptPicker(null);
    }
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>
            {editSessionId ? 'Edit session' : 'New Session'}
          </Text>
          {patientName ? (
            <Text style={[styles.headerSubtitle, { color: muted }]}>
              for {patientName}
            </Text>
          ) : null}
        </View>
      </View>

      {loadingEdit ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={textSecondary} />
        </View>
      ) : (
        <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 6,
          paddingBottom: insets.bottom + 120,
          gap: 18,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Name card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: mode === 'edit' ? ACCENT : cardBorder,
              borderWidth: mode === 'edit' ? 1.5 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          {mode === 'view' ? (
            <Pressable
              onPress={openSwitcher}
              style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
            >
              <View style={styles.eyebrowRow}>
                <Text style={[styles.eyebrow, { color: muted }]}>SESSION NAME</Text>
                <View style={[styles.indicator, { backgroundColor: indicatorBg }]}>
                  <Ionicons name="chevron-down" size={14} color={muted} />
                </View>
              </View>
              <View style={styles.nameRow}>
                <Image
                  source={selected.image}
                  style={{ width: 44, height: 44, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ flex: 1, fontSize: 19, fontWeight: '800', color: textPrimary }}
                >
                  {name || selected.name}
                </Text>
              </View>
            </Pressable>
          ) : (
            <>
              <View style={styles.eyebrowRow}>
                <Text style={[styles.eyebrow, { color: muted }]}>SESSION NAME</Text>
                <View style={[styles.indicator, { backgroundColor: indicatorBg }]}>
                  <Ionicons name="chevron-down" size={14} color={muted} />
                </View>
              </View>
              <View style={styles.nameRow}>
                <Image
                  source={selected.image}
                  style={{ width: 44, height: 44, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <TextInput
                  autoFocus
                  value={name}
                  onChangeText={setName}
                  placeholder="Session name"
                  placeholderTextColor={muted}
                  style={{
                    flex: 1,
                    fontSize: 19,
                    fontWeight: '800',
                    color: textPrimary,
                    paddingVertical: 0,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={saveRename}
                />
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.actionRow}>
            {mode === 'view' ? (
              <Pressable
                onPress={startRename}
                style={({ pressed }) => [
                  styles.pill,
                  { backgroundColor: RENAME_BG, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="create-outline" size={13} color={RENAME_RED} />
                <Text style={[styles.pillText, { color: RENAME_RED }]}>Rename</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={saveRename}
                  style={({ pressed }) => [
                    styles.pill,
                    { backgroundColor: '#E8F8F1', opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="checkmark" size={14} color={SAVE_GREEN} />
                  <Text style={[styles.pillText, { color: SAVE_GREEN }]}>Save</Text>
                </Pressable>
                <Pressable
                  onPress={resetRename}
                  style={({ pressed }) => [
                    styles.pill,
                    { backgroundColor: indicatorBg, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="refresh" size={13} color={textSecondary} />
                  <Text style={[styles.pillText, { color: textSecondary }]}>Reset</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* SESSION DETAILS */}
        <View>
          <Text style={[styles.sectionEyebrow, { color: muted }]}>SESSION DETAILS</Text>

          {/* Date & time */}
          <Pressable
            onPress={() => setDtPicker('date')}
            style={({ pressed }) => [
              styles.fieldRow,
              { backgroundColor: cardBg, borderColor: cardBorder },
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={[styles.fieldIcon, { backgroundColor: indicatorBg }]}>
              <Ionicons name="calendar-outline" size={18} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: muted }]}>Date &amp; time</Text>
              <Text style={[styles.fieldValue, { color: textPrimary }]} numberOfLines={1}>
                {formatDateTime(dateTime)}
              </Text>
            </View>
            <Pressable
              onPress={() => setDateTime(new Date())}
              hitSlop={6}
              style={({ pressed }) => [
                styles.fieldMiniBtn,
                { backgroundColor: indicatorBg },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Ionicons name="refresh" size={14} color={textSecondary} />
            </Pressable>
            <Ionicons name="chevron-forward" size={18} color={muted} />
          </Pressable>
          {Platform.OS === 'ios' ? (
            <Modal
              transparent
              animationType="slide"
              visible={dtPicker !== null}
              onRequestClose={() => setDtPicker(null)}
            >
              <Pressable style={styles.dim} onPress={() => setDtPicker(null)}>
                <Pressable
                  style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Date &amp; time</Text>
                    <Pressable
                      onPress={() => setDtPicker(null)}
                      hitSlop={8}
                      style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.doneText}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={dateTime}
                    mode="datetime"
                    display="spinner"
                    onChange={(_, picked) => {
                      if (picked) setDateTime(picked);
                    }}
                  />
                </Pressable>
              </Pressable>
            </Modal>
          ) : (
            dtPicker && (
              <DateTimePicker
                value={dateTime}
                mode={dtPicker}
                display="default"
                onChange={onDtChange}
              />
            )
          )}

          {/* Status */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 10 }]}>
            <Text style={[styles.fieldLabel, { color: muted, marginBottom: 10 }]}>Status</Text>
            <View style={styles.segmentBar}>
              {([
                { key: 'planned', label: 'Planned' },
                { key: 'in_progress', label: 'In progress' },
                { key: 'done', label: 'Done' },
              ] as { key: SessionStatus; label: string }[]).map((seg) => {
                const isActive = status === seg.key;
                const activeBg =
                  seg.key === 'done' ? SAVE_GREEN : ACCENT;
                return (
                  <Pressable
                    key={seg.key}
                    onPress={() => setStatus(seg.key)}
                    style={({ pressed }) => [
                      styles.segment,
                      isActive
                        ? { backgroundColor: activeBg }
                        : { backgroundColor: indicatorBg },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isActive ? '#FFFFFF' : textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {seg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Tooth / area */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 10 }]}>
            <Text style={[styles.fieldLabel, { color: muted, marginBottom: 10 }]}>Tooth / area</Text>
            <View style={styles.chipsWrap}>
              {toothAreas.map((v) => (
                <View key={v} style={[styles.chip, { backgroundColor: 'rgba(22, 104, 227, 0.10)' }]}>
                  <Text style={[styles.chipText, { color: ACCENT }]}>{v}</Text>
                  <Pressable onPress={() => removeToothArea(v)} hitSlop={6}>
                    <Ionicons name="close" size={13} color={ACCENT} />
                  </Pressable>
                </View>
              ))}
              {toothInputOpen ? (
                <View style={[styles.chipInput, { borderColor: ACCENT }]}>
                  <TextInput
                    autoFocus
                    value={toothDraft}
                    onChangeText={setToothDraft}
                    onSubmitEditing={addToothArea}
                    onBlur={addToothArea}
                    placeholder="e.g. 36"
                    placeholderTextColor={muted}
                    style={[styles.chipInputText, { color: textPrimary }]}
                    returnKeyType="done"
                  />
                </View>
              ) : (
                <Pressable
                  onPress={() => setToothInputOpen(true)}
                  style={({ pressed }) => [
                    styles.chipAdd,
                    { borderColor: dashedBorder },
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Ionicons name="add" size={14} color={muted} />
                  <Text style={[styles.chipAddText, { color: muted }]}>Tooth / area</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* TREATMENT */}
        <View>
          <Text style={[styles.sectionEyebrow, { color: muted }]}>TREATMENT</Text>

          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.fieldLabel, { color: muted, marginBottom: 8 }]}>What was done</Text>
            <TextInput
              value={whatDone}
              onChangeText={setWhatDone}
              placeholder="What was done in this session…"
              placeholderTextColor={muted}
              multiline
              textAlignVertical="top"
              style={[styles.multiline, { color: textPrimary }]}
            />
          </View>

          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 10 }]}>
            <Text style={[styles.fieldLabel, { color: muted, marginBottom: 8 }]}>
              Materials / anaesthesia (optional)
            </Text>
            <TextInput
              value={materials}
              onChangeText={setMaterials}
              placeholder="Add if used (optional)"
              placeholderTextColor={muted}
              multiline
              textAlignVertical="top"
              style={[styles.multiline, { color: textPrimary }]}
            />
          </View>
        </View>

        {/* PHOTOS */}
        <View>
          <View style={styles.photosHead}>
            <Text style={[styles.sectionEyebrow, { color: muted, marginBottom: 0 }]}>
              PHOTOS · {photos.length}
            </Text>
            <Pressable
              onPress={openAddSheet}
              style={({ pressed }) => [
                styles.photosAddOuter,
                pressed && { opacity: 0.9 },
              ]}
            >
              <LinearGradient
                colors={['#3D9DFF', '#1668E3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.photosAddBtn}
              >
                <Ionicons name="add" size={14} color="#FFFFFF" />
                <Text style={styles.photosAddText}>Add</Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.photoGrid}>
              {photos.map((p) => {
                const shared = p.sharedWithPatient;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setPhotoSheet(p.key)}
                    style={({ pressed }) => [
                      styles.photoCell,
                      { width: PHOTO_CELL, height: PHOTO_CELL },
                      pressed && { opacity: 0.9 },
                    ]}
                  >
                    <Image
                      source={{ uri: p.uri }}
                      style={{ width: PHOTO_CELL, height: PHOTO_CELL, borderRadius: 12 }}
                      resizeMode="cover"
                    />
                    <View style={styles.photoCatChip}>
                      <Text style={styles.photoCatChipText} numberOfLines={1}>
                        {labelForCategory(p.category).toUpperCase()}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.photoVisBadge,
                        {
                          backgroundColor: shared
                            ? 'rgba(16,185,129,0.95)'
                            : 'rgba(27,37,66,0.85)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={shared ? 'eye' : 'lock-closed'}
                        size={11}
                        color="#FFFFFF"
                      />
                    </View>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={openAddSheet}
                style={({ pressed }) => [
                  styles.photoAddCell,
                  {
                    width: PHOTO_CELL,
                    height: PHOTO_CELL,
                    borderColor: dashedBorder,
                  },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Ionicons name="add" size={22} color={muted} />
                <Text style={[styles.photoAddCellText, { color: muted }]}>Add</Text>
              </Pressable>
            </View>
            <Text style={[styles.photosCaption, { color: muted }]}>
              Green eye = shared with patient · lock = clinic only
            </Text>
          </View>
        </View>

        {/* FOR THE PATIENT */}
        <View>
          <View style={styles.forPatientHead}>
            <Text style={[styles.sectionEyebrow, { color: muted, marginBottom: 0 }]}>
              FOR THE PATIENT
            </Text>
            <View style={[styles.badge, { backgroundColor: 'rgba(22, 104, 227, 0.10)' }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={11} color={ACCENT} />
              <Text style={[styles.badgeText, { color: ACCENT }]}>sent to chat</Text>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.fieldLabel, { color: muted, marginBottom: 8 }]}>Aftercare</Text>
            <TextInput
              value={aftercare}
              onChangeText={setAftercare}
              placeholder="Aftercare instructions for the patient…"
              placeholderTextColor={muted}
              multiline
              textAlignVertical="top"
              style={[styles.multiline, { color: textPrimary }]}
            />
          </View>

          <Pressable
            onPress={() => setApptPicker('date')}
            style={({ pressed }) => [
              styles.fieldRow,
              { backgroundColor: cardBg, borderColor: cardBorder, marginTop: 10 },
              pressed && { opacity: 0.9 },
            ]}
          >
            <View style={[styles.fieldIcon, { backgroundColor: indicatorBg }]}>
              <Ionicons name="calendar-outline" size={18} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: muted }]}>Next appointment</Text>
              <Text
                style={[
                  styles.fieldValue,
                  { color: nextAppt ? textPrimary : muted },
                ]}
                numberOfLines={1}
              >
                {nextAppt ? formatDateTime(nextAppt) : 'Set a date'}
              </Text>
            </View>
            {nextAppt ? (
              <Pressable
                onPress={() => setNextAppt(null)}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.fieldMiniBtn,
                  { backgroundColor: indicatorBg },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="close" size={14} color={textSecondary} />
              </Pressable>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={muted} />
          </Pressable>
          {Platform.OS === 'ios' ? (
            <Modal
              transparent
              animationType="slide"
              visible={apptPicker !== null}
              onRequestClose={() => setApptPicker(null)}
            >
              <Pressable style={styles.dim} onPress={() => setApptPicker(null)}>
                <Pressable
                  style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Next appointment</Text>
                    <Pressable
                      onPress={() => setApptPicker(null)}
                      hitSlop={8}
                      style={({ pressed }) => [pressed && { opacity: 0.6 }]}
                    >
                      <Text style={styles.doneText}>Done</Text>
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={nextAppt ?? apptBase()}
                    mode="datetime"
                    display="spinner"
                    onChange={(_, picked) => {
                      if (picked) setNextAppt(picked);
                    }}
                  />
                </Pressable>
              </Pressable>
            </Modal>
          ) : (
            apptPicker && (
              <DateTimePicker
                value={apptBase()}
                mode={apptPicker}
                display="default"
                onChange={onApptChange}
              />
            )
          )}
        </View>
      </ScrollView>

      {/* Fixed Save bar */}
      <View
        pointerEvents="box-none"
        style={[styles.saveBarWrap, { paddingBottom: insets.bottom + 12 }]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(15, 23, 42, 0)', 'rgba(15, 23, 42, 0.9)']
              : ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.95)']
          }
          style={styles.saveBarFade}
          pointerEvents="none"
        />
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [
            styles.saveBtnOuter,
            pressed && { opacity: 0.92 },
            saving && { opacity: 0.85 },
          ]}
        >
          <LinearGradient
            colors={['#3D9DFF', '#1668E3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.saveBtn}
          >
            {saving ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <Text style={styles.saveBtnText}>
                  {uploadingPhotos ? 'Uploading photos…' : 'Saving…'}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>
                  {editSessionId ? 'Save changes' : 'Save session'}
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>
        </>
      )}

      {/* Switcher modal */}
      <Modal
        transparent
        animationType="slide"
        visible={switcherOpen}
        onRequestClose={closeSwitcher}
      >
        <Pressable style={styles.dim} onPress={closeSwitcher}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.grabHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose a session</Text>
              <Pressable
                onPress={closeSwitcher}
                style={({ pressed }) => [
                  styles.sheetClose,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Ionicons name="close" size={20} color="#1B2542" />
              </Pressable>
            </View>
            <ScrollView
              style={{ maxHeight: '100%' }}
              contentContainerStyle={{ paddingVertical: 4 }}
              showsVerticalScrollIndicator={false}
            >
              {DENTAL_SESSIONS.map((item) => {
                const isSelected = item.slug === selected.slug;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => pickSession(item)}
                    style={({ pressed }) => [
                      styles.sheetRow,
                      isSelected && styles.sheetRowSelected,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Image
                      source={item.image}
                      style={{ width: 38, height: 38, borderRadius: 10 }}
                      resizeMode="cover"
                    />
                    <Text style={styles.sheetRowText} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {isSelected ? (
                      <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add photo sheet */}
      <Modal
        transparent
        animationType="slide"
        visible={addSheet}
        onRequestClose={closeAddSheet}
      >
        <Pressable style={styles.dim} onPress={closeAddSheet}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.grabHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Add photo</Text>
              <Pressable
                onPress={closeAddSheet}
                style={({ pressed }) => [
                  styles.sheetClose,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Ionicons name="close" size={20} color="#1B2542" />
              </Pressable>
            </View>
            <Pressable
              onPress={handleTakePhoto}
              style={({ pressed }) => [
                styles.addSheetRow,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.addSheetIcon}>
                <Ionicons name="camera" size={20} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addSheetTitle}>Take photo</Text>
                <Text style={styles.addSheetSub}>Use the camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(27,37,66,0.4)" />
            </Pressable>
            <Pressable
              onPress={handlePickFromGallery}
              style={({ pressed }) => [
                styles.addSheetRow,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.addSheetIcon}>
                <Ionicons name="images" size={20} color={ACCENT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addSheetTitle}>Choose from gallery</Text>
                <Text style={styles.addSheetSub}>Pick one or more photos</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(27,37,66,0.4)" />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Manage photo sheet */}
      <Modal
        transparent
        animationType="slide"
        visible={photoSheet !== null}
        onRequestClose={() => setPhotoSheet(null)}
      >
        <View style={styles.dim}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setPhotoSheet(null)}
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.grabHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Photo</Text>
              <Pressable
                onPress={() => setPhotoSheet(null)}
                style={({ pressed }) => [
                  styles.sheetClose,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Ionicons name="close" size={20} color="#1B2542" />
              </Pressable>
            </View>
            {activePhoto ? (
              <ScrollView
                contentContainerStyle={{ paddingBottom: 8 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
              >
                <Image
                  source={{ uri: activePhoto.uri }}
                  style={{
                    width: '100%',
                    aspectRatio: 3 / 4,
                    maxHeight: 600,
                    borderRadius: 16,
                    backgroundColor: 'rgba(27,37,66,0.06)',
                  }}
                  resizeMode="cover"
                />

                <Text style={[styles.manageEyebrow]}>CATEGORY</Text>
                <View style={styles.manageChipsWrap}>
                  {PHOTO_CATEGORIES.map((c) => {
                    const isActive = activePhoto.category === c.key;
                    return (
                      <Pressable
                        key={c.key}
                        onPress={() => setPhotoCategory(activePhoto.key, c.key)}
                        style={({ pressed }) => [
                          styles.manageChip,
                          isActive
                            ? { backgroundColor: ACCENT }
                            : { backgroundColor: 'rgba(27,37,66,0.06)' },
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <Text
                          style={[
                            styles.manageChipText,
                            { color: isActive ? '#FFFFFF' : '#1B2542' },
                          ]}
                        >
                          {c.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.manageShareRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.manageShareTitle}>Share with patient</Text>
                    <Text style={styles.manageShareSub}>
                      {activePhoto.sharedWithPatient
                        ? 'On = patient will see this photo'
                        : 'Off = clinic only'}
                    </Text>
                  </View>
                  <Switch
                    value={activePhoto.sharedWithPatient}
                    onValueChange={(v) => setPhotoShared(activePhoto.key, v)}
                    trackColor={{ false: 'rgba(27,37,66,0.15)', true: '#10B981' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <Pressable
                  onPress={() => removePhoto(activePhoto.key)}
                  style={({ pressed }) => [
                    styles.manageRemoveBtn,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.manageRemoveText}>Remove photo</Text>
                </Pressable>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
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
  headerText: { flex: 1, paddingTop: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2, fontWeight: '600' },

  card: {
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: { fontSize: 14, fontWeight: '800' },
  placeholderSub: { fontSize: 12.5, marginTop: 2 },

  dim: {
    flex: 1,
    backgroundColor: 'rgba(12,20,34,0.42)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '92%',
  },
  grabHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(27, 37, 66, 0.15)',
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#1B2542' },
  doneText: { fontSize: 15, fontWeight: '800', color: ACCENT },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 37, 66, 0.06)',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
  },
  sheetRowSelected: {
    backgroundColor: 'rgba(22, 104, 227, 0.08)',
  },
  sheetRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2542',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  fieldMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  fieldValue: {
    fontSize: 15.5,
    fontWeight: '700',
    marginTop: 2,
  },

  segmentBar: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '800',
  },

  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 8,
    height: 30,
    borderRadius: 15,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  chipAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  chipAddText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  chipInput: {
    height: 30,
    minWidth: 90,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  chipInputText: {
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 0,
  },

  multiline: {
    minHeight: 80,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  forPatientHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 11,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  saveBarWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  saveBarFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -24,
    bottom: 0,
  },
  saveBtnOuter: {
    borderRadius: 16,
    shadowColor: '#1668E3',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  photosHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  photosAddOuter: {
    borderRadius: 12,
    shadowColor: '#1668E3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  photosAddBtn: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photosAddText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: PHOTO_GRID_GAP,
  },
  photoCell: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(27,37,66,0.06)',
  },
  photoCatChip: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(11,15,26,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '85%',
  },
  photoCatChipText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  photoVisBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddCell: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  photoAddCellText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  photosCaption: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 10,
    letterSpacing: 0.1,
  },

  addSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  addSheetIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 104, 227, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSheetTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1B2542',
  },
  addSheetSub: {
    fontSize: 12.5,
    fontWeight: '600',
    color: 'rgba(27,37,66,0.55)',
    marginTop: 2,
  },

  manageEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: 'rgba(27,37,66,0.55)',
    marginTop: 16,
    marginBottom: 8,
  },
  manageChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  manageChip: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageChipText: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  manageShareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(27,37,66,0.04)',
  },
  manageShareTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1B2542',
  },
  manageShareSub: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(27,37,66,0.55)',
    marginTop: 2,
  },
  manageRemoveBtn: {
    marginTop: 18,
    height: 46,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#C2463F',
  },
  manageRemoveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
