import ChatBubble from '@/components/ChatBubble';
import TabHeader from '@/components/TabHeader';
import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { getHeroImage } from '@/src/constants/heroImages';
import { useTheme } from '@/src/context/ThemeContext';
import { usePatientGuard } from '@/src/utils/navigationGuards';
import { markThreadReadForPatient, updateThreadOnMessage } from '@/src/utils/threadsHelper';
import { localizeDate, localizeNumber } from '@/utils/localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, ImageBackground, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Message = {
  id?: string;
  from: 'patient' | 'clinic';
  text: string;
  createdAt?: any;
};

export default function PatientView() {
  usePatientGuard();
  const { patientId: routePatientId } = useLocalSearchParams();
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgText, setMsgText] = useState('');
  const [authenticatedPatientId, setAuthenticatedPatientId] = useState<string | null>(null);
  const [tab, setTab] = useState<'timeline' | 'chat'>('timeline');
    const [clinicName, setClinicName] = useState<string>(''); // PHASE G: Clinic branding
  const flatRef = useRef<FlatList>(null);
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  const router = useRouter();

  useEffect(() => {
    const loadPatientSession = async () => {
      try {
        // Get stored patient ID from AsyncStorage
        const storedPatientId = await AsyncStorage.getItem('patientId');
        
        if (!storedPatientId) {
          // No session - redirect to login
          router.replace('/patient' as any);
          return;
        }

        setAuthenticatedPatientId(storedPatientId);

        // SECURITY: Ensure the authenticated patient can only access their own data
        if (routePatientId && routePatientId !== storedPatientId) {
          Alert.alert(t('common.error'), t('patient.accessDenied'));
          await AsyncStorage.removeItem('patientId');
          router.replace('/patient' as any);
          return;
        }

        const patientId = storedPatientId;
        console.log('Authenticated patient:', patientId);

        // Load patient info
        const pRef = doc(db, 'patients', patientId);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const patientData = { id: pSnap.id, ...(pSnap.data() as any) };
          setPatient(patientData);
          
          // PHASE G: Fetch clinic name for branding
          if (patientData.clinicId) {
            try {
              const clinicRef = doc(db, 'clinics', patientData.clinicId);
              const clinicSnap = await getDoc(clinicRef);
              if (clinicSnap.exists()) {
                const clinicData = clinicSnap.data();
                setClinicName(clinicData.clinicName || '');
              }
            } catch (err) {
              console.error('Error fetching clinic name:', err);
            }
          }
        }

        // Subscribe to sessions
        const sessionsQ = query(collection(db, `patients/${patientId}/sessions`), orderBy('date', 'desc'));
        const unsubSessions = onSnapshot(sessionsQ, (snap) => {
          setSessions(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
        });

        // Subscribe to messages
        const messagesQ = query(collection(db, `patients/${patientId}/messages`), orderBy('createdAt', 'asc'));
        const unsubMessages = onSnapshot(messagesQ, (snap) => {
          setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
        });

        setLoading(false);

        return () => {
          unsubSessions();
          unsubMessages();
        };
      } catch (err) {
        console.error('patient view error', err);
        setLoading(false);
      }
    };

    loadPatientSession();
  }, [router, routePatientId]);

  // Mark thread as read when chat tab is opened
  useEffect(() => {
    if (tab === 'chat' && authenticatedPatientId && patient) {
      markThreadReadForPatient(patient.clinicId, authenticatedPatientId);
    }
  }, [tab, authenticatedPatientId, patient]);

  const sendMessage = async () => {
    const text = msgText.trim();
    if (!text || !authenticatedPatientId || !patient) return;
    setMsgText('');
    
    await addDoc(collection(db, `patients/${authenticatedPatientId}/messages`), {
      from: 'patient',
      text,
      senderName: patient.name || t('chat.you'),
      createdAt: Date.now(),
    });

    // Update thread with message (need clinicId from patient doc)
    if (patient.clinicId) {
      await updateThreadOnMessage(patient.clinicId, authenticatedPatientId, patient.name, text, 'patient');
    }
  };

  const onLogout = async () => {
    try {
      await AsyncStorage.removeItem('patientId');
      router.replace('/patient' as any);
    } catch (err) {
      console.error('logout error', err);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accentBlue} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ImageBackground
          source={{ uri: getHeroImage('patient', isDark) }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={[styles.heroOverlay, { backgroundColor: colors.bannerOverlay }]}> 
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>{patient?.name || ''}</Text>
            <Text style={[styles.heroSubtitle, { color: colors.textPrimary }]}>
              {t('patients.code')}{localizeNumber(patient?.code)}
            </Text>
            {clinicName ? <Text style={[styles.heroSubtitle, { color: colors.textPrimary }]}>{clinicName}</Text> : null}
          </View>
        </ImageBackground>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
                        {/* PHASE G: Display clinic name if available */}
                        {clinicName && (
                          <Text style={[styles.clinicName, { color: colors.accentBlue }]}>{clinicName}</Text>
                        )}
            <Text style={[styles.name, { color: colors.textPrimary }]}>{patient?.name}</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>{t('patients.code')}{localizeNumber(patient?.code)}</Text>
            {patient?.createdAt && (
              <Text style={[styles.createdAt, { color: colors.textSecondary }]}>
                {t('patients.created')}{' '}
                {localizeDate(patient.createdAt)}
              </Text>
            )}
          </View>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.messagesBtn, { backgroundColor: colors.buttonBackground }]}
              onPress={() => router.push('/patient/messages' as any)}
            >
              <Text style={[styles.messagesText, { color: colors.buttonText }]}>{t('tabs.messages')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.messagesBtn, { backgroundColor: colors.buttonBackground }]}
              onPress={() => router.push(`/patient/files?patientId=${authenticatedPatientId}` as any)}
            >
              <Text style={[styles.messagesText, { color: colors.buttonText }]}>{t('patient.files', 'الملفات')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.logoutBtn, { backgroundColor: colors.buttonSecondaryBackground, borderColor: colors.cardBorder }]}
              onPress={onLogout}
            >
              <Text style={[styles.logoutText, { color: colors.buttonSecondaryText }]}>{t('patient.logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', marginVertical: 8 }}>
          <TabHeader
            tabs={[
              { key: 'timeline', label: t('tabs.timeline') },
              { key: 'chat', label: t('tabs.chatClinic') },
            ]}
            activeTab={tab}
            onTabChange={(key: string) => setTab(key as 'timeline' | 'chat')}
          />
        </View>
        {tab === 'timeline' ? (
          <FlatList
            data={sessions}
            keyExtractor={(i) => i.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.sessionGridCard,
                  { backgroundColor: colors.card, borderColor: colors.cardBorder },
                ]}
                onPress={() => {
                  // Navigate to session details/image viewer
                  if (item.images && item.images.length > 0) {
                    router.push(`/patient/${authenticatedPatientId}?tab=image&sessionId=${item.id}` as any);
                  }
                }}
              >
                {/* Session Image */}
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.sessionGridImage}
                  />
                ) : (
                  <View style={[styles.sessionGridImage, { backgroundColor: colors.cardBorder }]}>
                    <Text style={{ color: colors.textSecondary }}>📷</Text>
                  </View>
                )}

                {/* Session Info */}
                <View style={styles.sessionGridInfo}>
                  <Text style={[styles.sessionGridType, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.type}
                  </Text>
                  {item.date && (
                    <Text style={[styles.sessionGridDate, { color: colors.textSecondary }]} numberOfLines={1}>
                      {localizeDate(item.date)}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            numColumns={2}
            ListEmptyComponent={<Text style={[styles.muted, { color: colors.textSecondary }]}>{t('patient.noSessions')}</Text>}
            scrollEnabled={false}
            style={{ maxHeight: '100%' }}
            columnWrapperStyle={styles.gridRow}
          />
        ) : (
          <>
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(i) => i.id!}
              renderItem={({ item }) => (
                <ChatBubble
                  text={item.text}
                  isSender={item.from === 'patient'}
                  senderType={item.from}
                  senderName={item.senderName}
                  senderRole={item.senderRole}
                  createdAt={item.createdAt}
                />
              )}
              style={{ flex: 1, marginVertical: 8 }}
            />
            <View style={styles.chatRow}>
              <TextInput
                value={msgText}
                onChangeText={setMsgText}
                placeholder={t('chat.placeholder')}
                style={[
                  styles.chatInput,
                  { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.textPrimary },
                  isRTL && { textAlign: 'right', writingDirection: 'rtl' },
                ]}
                editable={!!authenticatedPatientId}
              />
              <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.buttonBackground }]} onPress={sendMessage}>
                <Text style={{ color: colors.buttonText, fontWeight: '600' }}>{t('chat.send')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hero: { width: '100%', height: Dimensions.get('window').height * 0.45, marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  heroImage: { resizeMode: 'cover' },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  heroTitle: { fontSize: 24, fontWeight: '800' },
  heroSubtitle: { fontSize: 14, fontWeight: '600', marginTop: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 22, fontWeight: '700' },
  sub: { },
  createdAt: { fontSize: 13, marginTop: 2 },
  clinicName: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  messagesBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  messagesText: { fontWeight: '600' },
  logoutBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, borderWidth: 1 },
  logoutText: { fontWeight: '600' },
  sessionCard: { padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 12, shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sessionType: { fontSize: 15, fontWeight: '700' },
  sessionDate: { fontSize: 12, fontWeight: '600' },
  sessionBody: { marginBottom: 8 },
  sessionLabel: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  sessionText: { fontSize: 13, lineHeight: 19 },
  thumb: { width: 120, height: 80, marginRight: 8, borderRadius: 6 },
  // Grid card styles (Instagram-like)
  gridRow: { justifyContent: 'space-between', gap: 8, marginBottom: 8 },
  sessionGridCard: { flex: 1, borderRadius: 12, overflow: 'hidden', borderWidth: 1, minHeight: 180 },
  sessionGridImage: { width: '100%', height: 120, resizeMode: 'cover', justifyContent: 'center', alignItems: 'center' },
  sessionGridInfo: { padding: 10 },
  sessionGridType: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  sessionGridDate: { fontSize: 12, fontWeight: '600' },
  muted: {},
  light: {},
  chatRow: { flexDirection: 'row', alignItems: 'center' },
  chatInput: { flex: 1, borderWidth: 1, padding: 8, borderRadius: 8 },
  sendBtn: { padding: 10, marginLeft: 8, borderRadius: 8 },
});
