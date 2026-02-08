import { db, storage } from '@/firebaseConfig';
import i18n from '@/i18n';
import ChatBubble from '@/src/components/ChatBubble';
import TabHeader from '@/src/components/TabHeader';
import { getHeroImage } from '@/src/constants/heroImages';
import { useAuth } from '@/src/context/AuthContext';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { createPatientUser } from '@/src/services/patientAccounts';
import { editSession, updateSessionStatus } from '@/src/services/sessionService'; // PHASE U: Import edit service
import { Session } from '@/src/types/session'; // PHASE U: Import Session type
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { markThreadReadForClinic, updateThreadOnMessage } from '@/src/utils/threadsHelper';
import { localizeDate, localizeNumber } from '@/utils/localization';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Dimensions, FlatList, Image, ImageBackground, KeyboardAvoidingView, Linking, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function PatientDetails() {
  useClinicGuard();
  const { patientId, tab: tabParam } = useLocalSearchParams();
  const { clinicId, clinicUser } = useClinic();
  const authContext = useAuth();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  const router = useRouter();
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [newType, setNewType] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDoctorName, setNewDoctorName] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [msgText, setMsgText] = useState('');
  const [tab, setTab] = useState<'timeline' | 'chat' | 'media'>((tabParam as any) === 'chat' ? 'chat' : (tabParam as any) === 'media' ? 'media' : 'timeline');
  const chatRef = useRef<FlatList>(null);
  
  // PHASE U: Edit session state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editType, setEditType] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDoctorName, setEditDoctorName] = useState('');
  const canEditSessions = ['owner', 'doctor'].includes(authContext.clinicRole || '');
  const [accountEmail, setAccountEmail] = useState('');
  const [accountTempPassword, setAccountTempPassword] = useState('');
  const [creatingAccount, setCreatingAccount] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!clinicUser) {
      router.replace('/clinic/login' as any);
      return;
    }

    if (!patientId) return;
    const pRef = doc(db, 'patients', patientId as string);
    getDoc(pRef).then((snap) => {
      if (snap.exists()) setPatient({ id: snap.id, ...(snap.data() as any) });
      else setPatient(null);
    });

    // Mark thread as read when opening chat
    if (tab === 'chat' && clinicId) {
      markThreadReadForClinic(clinicId, patientId as string);
    }

    const q = query(collection(db, `patients/${patientId}/sessions`), orderBy('date', 'desc'));
    const unsubSessions = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setSessions(docs as Session[]);
      setLoading(false);
    });

    const mq = query(collection(db, `patients/${patientId}/messages`), orderBy('createdAt', 'asc'));
    const unsubMessages = onSnapshot(mq, (snap) => {
      const mdocs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setMessages(mdocs);
      setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 150);
    });

    return () => { unsubSessions(); unsubMessages(); };
  }, [patientId, clinicUser, router, tab, clinicId]);

  const addSession = async () => {
    if (!newType) {
      Alert.alert(t('common.validation'), t('clinic.sessionTypeRequired'));
      return;
    }
    const docRef = await addDoc(collection(db, `patients/${patientId}/sessions`), {
      date: serverTimestamp(),
      type: newType,
      description: newDesc || null,
      doctorName: newDoctorName || null,
      dentistNotes: null,
      images: [],
      clinicId: clinicId,
      createdAt: serverTimestamp(),
    });
    setNewType('');
    setNewDesc('');
    setNewDoctorName('');
    Alert.alert(t('common.success'), t('clinic.sessionAdded'));
  };

  const sendClinicMessage = async () => {
    const text = msgText.trim();
    if (!text || !patientId) return;
    setMsgText('');
    
    // Add message to messages collection with sender info
    await addDoc(collection(db, `patients/${patientId}/messages`), {
      from: 'clinic',
      text,
      senderName: 'Clinic Staff',
      senderRole: authContext.clinicRole || undefined,
      createdAt: Date.now(),
    });

    // Update thread with message
    if (clinicId && patient) {
      await updateThreadOnMessage(clinicId, patientId as string, patient.name, text, 'clinic');
    }
  };

  // PHASE AA-4.1: Helper to get status color
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#10b981'; // Green
      case 'IN_PROGRESS':
        return '#D4AF37'; // Gold
      case 'PENDING':
      default:
        return '#9ca3af'; // Gray
    }
  };

  // PHASE AA-4.1: Helper to get status label
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return t('session.completed');
      case 'IN_PROGRESS':
        return t('session.inProgress');
      case 'PENDING':
      default:
        return t('session.pending');
    }
  };

  // PHASE AA-4.1: Handle status change
  const handleStatusChange = async (sessionId: string, newStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      await updateSessionStatus(
        patientId as string,
        sessionId,
        newStatus,
        clinicId || '',
        authContext.memberId || clinicId || 'unknown',
        clinicUser?.id || 'Clinic Staff'
      );
      Alert.alert(t('common.success'), t('clinic.sessionStatusUpdated'));
    } catch (error: any) {
      console.error('Status update error:', error);
      Alert.alert(t('common.error'), error.message || t('clinic.failedToUpdateStatus'));
    }
  };

  const pickAndUpload = async (sessionId: string) => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled) return;
    try {
      const uri = result.assets?.[0]?.uri ?? (result as any).uri;
      const resp = await fetch(uri);
      const blob = await resp.blob();

      const filename = `${Date.now()}.jpg`;
      const path = `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}/${filename}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, blob);
      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          () => {},
          (error) => {
            console.error('Storage upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(storageRef);
              const sessionRef = doc(db, `patients/${patientId}/sessions`, sessionId);
              const snap = await getDoc(sessionRef);
              const current = snap.exists() ? (snap.data() as any).images || [] : [];
              await updateDoc(sessionRef, { images: [...current, url] });
              Alert.alert(t('common.success'), t('clinic.imageUploaded'));
              resolve();
            } catch (e) {
              console.error('Post-upload processing error:', e);
              reject(e);
            }
          }
        );
      });
    } catch (err) {
      console.error('upload error', err);
      Alert.alert(t('common.error'), String(err) || t('imaging.uploadError'));
    }
  };

  // PHASE U: Start editing a session
  const startEditSession = (session: Session) => {
    if (!canEditSessions) {
      Alert.alert(t('common.error'), t('clinic.permissionDenied'));
      return;
    }
    setEditingSessionId(session.id || null);
    setEditType(session.type || '');
    setEditDesc(session.description || '');
    setEditDoctorName(session.doctorName || '');
  };

  // PHASE U: Cancel editing
  const cancelEditSession = () => {
    setEditingSessionId(null);
    setEditType('');
    setEditDesc('');
    setEditDoctorName('');
  };

  // PHASE U: Save edited session
  const saveEditSession = async () => {
    if (!editingSessionId || !editType) {
      Alert.alert(t('common.validation'), t('clinic.sessionTypeRequired'));
      return;
    }

    try {
      await editSession({
        patientId: patientId as string,
        sessionId: editingSessionId,
        updates: {
          type: editType,
          description: editDesc || undefined,
          doctorName: editDoctorName || undefined,
          clinicId: clinicId || undefined,
        },
        editedBy: authContext.memberId || clinicId || 'unknown',
        editedByName: clinicUser?.id || 'Clinic Staff',
      });

      cancelEditSession();
      Alert.alert(t('common.success'), t('clinic.sessionUpdated'));
    } catch (error: any) {
      console.error('Edit session error:', error);
      Alert.alert(t('common.error'), error.message || t('clinic.failedToUpdateSession'));
    }
  };

  if (!patientId) return <View style={styles.center}><Text>{t('patients.missingPatientId')}</Text></View>;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ImageBackground
        source={{ uri: getHeroImage('session', isDark) }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={[styles.heroOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.18)' }]}>
          <Text style={styles.heroTitle}>{patient?.name || ''}</Text>
          <Text style={styles.heroSubtitle}>{t('patients.code')}{localizeNumber(patient?.code)}</Text>
        </View>
      </ImageBackground>
      {!patient ? (
        <ActivityIndicator />
      ) : (
        <>
          <Text style={styles.name}>{patient.name}</Text>
          <Text style={styles.sub}>{t('patients.code')}{localizeNumber(patient.code)}</Text>
          {patient.phone ? (
            <TouchableOpacity onPress={() => Linking.openURL(`tel:${patient.phone}`)}>
              <Text style={[styles.sub, { fontWeight: '700', color: colors.accentBlue }]}>{patient.phone}</Text>
            </TouchableOpacity>
          ) : null}
          {patient.createdAt && (
            <Text style={styles.createdAt}>
              {t('patients.created')}{' '}
              {localizeDate(patient.createdAt)}
            </Text>
          )}

          {/* AB-3 + AB-7: Quick actions for owner/doctor */}
          {canEditSessions && (
            <View style={styles.quickActions}>
              <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card }]}
                onPress={() => setTab('chat')}
              >
                <Ionicons name="chatbubbles-outline" size={18} color={colors.textPrimary} />
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>{t('tabs.messages')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card }]} onPress={() => setTab('timeline')}>
                <Ionicons name="document-text-outline" size={18} color={colors.textPrimary} />
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>{t('tabs.timeline')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickAction, { backgroundColor: colors.card }]} onPress={() => setTab('timeline')}>
                <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>{t('clinic.description')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickAction, { backgroundColor: colors.card }]}
                onPress={() => {
                  if (patient.phone) {
                    Linking.openURL(`tel:${patient.phone}`);
                  } else {
                    Alert.alert(t('common.info', { defaultValue: t('common.validation') }), t('clinic.noPhoneOnFile'));
                  }
                }}
              >
                <Ionicons name="call-outline" size={18} color={colors.textPrimary} />
                <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>{t('common.call')}</Text>
              </TouchableOpacity>
            </View>
          )}

            {/* AB-8.1: Create Patient Account (Owner/Doctor) */}
            {canEditSessions && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: '700', marginBottom: 8 }}>{t('patient.accountTitle')}</Text>
                <TextInput
                  placeholder={t('patient.accountEmailPlaceholder')}
                  value={accountEmail}
                  onChangeText={setAccountEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
                />
                <TextInput
                  placeholder={t('patient.accountTempPasswordPlaceholder')}
                  value={accountTempPassword}
                  onChangeText={setAccountTempPassword}
                  secureTextEntry
                  style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]}
                />
                <TouchableOpacity
                  disabled={creatingAccount}
                  style={[styles.btn, creatingAccount && { opacity: 0.6 }]}
                  onPress={async () => {
                    const email = accountEmail.trim();
                    if (!email) {
                      Alert.alert(t('common.validation'), t('auth.emailRequired', { defaultValue: t('common.required') }));
                      return;
                    }
                    try {
                      setCreatingAccount(true);
                      const resp = await createPatientUser({
                        clinicId: clinicId || '',
                        patientId: patient.id,
                        email,
                        tempPassword: accountTempPassword || undefined,
                      });
                      Alert.alert(t('common.success'), t('clinic.patientAccountCreated', { defaultValue: t('patient.accountCreated') }));
                      setAccountEmail('');
                      setAccountTempPassword('');
                    } catch (err: any) {
                      Alert.alert(t('common.error'), err?.message || t('patient.accountCreateFailed'));
                    } finally {
                      setCreatingAccount(false);
                    }
                  }}
                >
                  <Text style={styles.btnText}>
                    {creatingAccount ? t('patient.accountCreating') : t('patient.accountCreate')}
                  </Text>
                </TouchableOpacity>
                <Text style={{ color: '#666', fontSize: 12, marginTop: 6 }}>
                  {t('patient.accountPasswordNote')}
                </Text>
              </View>
            )}

          {/* STEP G - Imaging Button */}
          <TouchableOpacity
            style={styles.imagingButton}
            onPress={() => router.push(`/clinic/${patientId}/imaging` as any)}
          >
            <Ionicons name="images-outline" size={20} color={colors.buttonBackground} />
            <Text style={[styles.imagingButtonText, { color: colors.buttonBackground }]}>
              {t('imaging.title')}
            </Text>
          </TouchableOpacity>

          <View style={styles.sessionForm}>
            <TextInput 
              placeholder={t('clinic.sessionType')} 
              value={newType} 
              onChangeText={setNewType} 
              style={[styles.input, styles.inputLarge, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
            />
            <TextInput 
              placeholder={t('clinic.description')} 
              value={newDesc} 
              onChangeText={setNewDesc} 
              style={[styles.input, styles.textArea, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
              multiline
            />
            <TextInput 
              placeholder={t('clinic.doctorName')} 
              value={newDoctorName} 
              onChangeText={setNewDoctorName} 
              style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
            />
            <TouchableOpacity style={styles.btn} onPress={addSession}>
              <Text style={styles.btnText}>{t('clinic.addSession')}</Text>
            </TouchableOpacity>
          </View>

          <TabHeader
            tabs={[
              { key: 'timeline', label: t('tabs.timeline') },
              { key: 'media', label: t('tabs.media') },
              { key: 'chat', label: t('tabs.chatPatient') },
            ]}
            activeTab={tab}
            onTabChange={(k: string) => setTab(k as 'timeline' | 'chat' | 'media')}
          />

          {tab === 'timeline' ? (
            loading ? <ActivityIndicator /> : (
              <FlatList
                data={sessions}
                keyExtractor={(i) => i.id as string}
                renderItem={({ item }) => (
                  <View style={styles.sessionItem}>
                    {editingSessionId === item.id ? (
                      // Edit mode
                      <View style={{ flex: 1 }}>
                        <TextInput 
                          placeholder={t('clinic.sessionType')} 
                          value={editType} 
                          onChangeText={setEditType} 
                          style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
                        />
                        <TextInput 
                          placeholder={t('clinic.description')} 
                          value={editDesc} 
                          onChangeText={setEditDesc} 
                          style={[styles.input, styles.textArea, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
                          multiline
                        />
                        <TextInput 
                          placeholder={t('clinic.doctorName')} 
                          value={editDoctorName} 
                          onChangeText={setEditDoctorName} 
                          style={[styles.input, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
                        />
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 8 }}>
                          <TouchableOpacity style={[styles.btn, { flex: 1 }]} onPress={saveEditSession}>
                            <Text style={styles.btnText}>{t('common.save')}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.btn, { flex: 1, backgroundColor: '#ccc' }]} onPress={cancelEditSession}>
                            <Text style={styles.btnText}>{t('common.cancel')}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      // View mode - AA-4.1 تعديل 1 & 2: Improved clarity and workflow
                      <>
                        <View style={{ flex: 1 }}>
                          {/* AA-4.1 تعديل 1: Clear header with status + session type + patient name */}
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <Text style={{ fontWeight: '700', fontSize: 15, marginBottom: 2 }}>{item.type}</Text>
                              <Text style={{ color: '#888', fontSize: 12 }}>{patient?.name || ''}</Text>
                            </View>
                            {/* Status badge - tap to cycle */}
                            <TouchableOpacity
                              onPress={() => {
                                const statuses: Array<'PENDING' | 'IN_PROGRESS' | 'COMPLETED'> = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
                                const currentIndex = statuses.indexOf(item.status || 'PENDING');
                                const nextIndex = (currentIndex + 1) % statuses.length;
                                handleStatusChange(item.id as string, statuses[nextIndex]);
                              }}
                              style={{
                                backgroundColor: getStatusColor(item.status),
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 14,
                              }}
                            >
                              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                                {getStatusLabel(item.status)}
                              </Text>
                            </TouchableOpacity>
                          </View>
                          
                          {/* AA-4.1 تعديل 1: Last editor info - always visible for clarity */}
                          {item.lastEditedAt && item.lastEditedByName && (
                            <View style={{ backgroundColor: '#f5f5f5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 8 }}>
                              <Text style={{ color: '#666', fontSize: 11, fontWeight: '500' }}>
                                {isRTL ? 'آخر تعديل: ' : 'Last edited: '}
                                <Text style={{ fontWeight: '700' }}>{item.lastEditedByName}</Text>
                              </Text>
                            </View>
                          )}
                          {item.doctorName && (
                            <Text style={{ color: '#555', fontSize: 13, marginBottom: 6, fontWeight: '500' }}>
                              Dr. {item.doctorName}
                            </Text>
                          )}
                          
                          {/* AA-4.1 تعديل 2: Description always visible for quick workflow */}
                          {item.description && (
                            <Text style={{ color: '#333', fontSize: 14, marginBottom: 8, lineHeight: 20 }}>
                              {item.description}
                            </Text>
                          )}
                          
                          {item.images && item.images.length > 0 && (
                            <FlatList
                              horizontal
                              data={item.images}
                              keyExtractor={(u) => u}
                              renderItem={({ item: u }) => (
                                <Image source={{ uri: u }} style={styles.thumb} />
                              )}
                              scrollEnabled={false}
                            />
                          )}
                        </View>
                        
                        {/* AA-4.1 تعديل 2: Prominent action buttons for quick workflow */}
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                          {canEditSessions && (
                            <TouchableOpacity 
                              style={[styles.imageBtn, { flex: 1, backgroundColor: '#2196F3' }]} 
                              onPress={() => startEditSession(item)}
                            >
                              <Text style={[styles.imageBtnText, { fontWeight: '600' }]}>
                                {t('common.edit')}
                              </Text>
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity 
                            style={[styles.imageBtn, { flex: 1 }]} 
                            onPress={() => pickAndUpload(item.id as string)}
                          >
                            <Text style={styles.imageBtnText}>{t('clinic.addPhoto')}</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                )}
                scrollEnabled={false}
                ListEmptyComponent={<Text style={styles.muted}>{t('patients.noSessionsYet')}</Text>}
              />
            )
          ) : tab === 'media' ? (
            <TouchableOpacity 
              onPress={() => router.push(`/clinic/media?patientId=${patientId}` as any)}
              style={styles.mediaTabButton}
            >
              <Ionicons name="images" size={32} color={colors.buttonBackground} />
              <Text style={[styles.mediaTabButtonText, { color: colors.buttonBackground }]}>
                {t('tabs.media')}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <FlatList
                ref={chatRef}
                data={messages}
                keyExtractor={(i) => i.id}
                renderItem={({ item }) => (
                  <ChatBubble
                    text={item.text}
                    isSender={item.from === 'clinic'}
                    senderType={item.from}
                    senderName={item.senderName}
                    senderRole={item.senderRole}
                    createdAt={item.createdAt}
                  />
                )}
                style={{ flex: 1, marginVertical: 8 }}
              />
              <View style={styles.chatRow}>
                <TextInput value={msgText} onChangeText={setMsgText} placeholder={t('chat.placeholder')} style={[styles.chatInput, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} />
                <TouchableOpacity style={styles.sendBtn} onPress={sendClinicMessage}><Text style={{ color: '#fff', fontWeight: '600' }}>{t('chat.send')}</Text></TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}
    </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700' },
  sub: { color: '#666', marginBottom: 4 },
  createdAt: { color: '#999', fontSize: 13, marginBottom: 8 },
  hero: { width: '100%', height: Dimensions.get('window').height * 0.45, marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  heroImage: { resizeMode: 'cover' },
  heroOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  heroSubtitle: { color: '#f3f4f6', fontSize: 14, fontWeight: '600', marginTop: 2 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  quickAction: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', minWidth: '46%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  quickActionText: { fontWeight: '600', fontSize: 13 },
  imagingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  imagingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  sessionForm: { marginTop: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 8, marginBottom: 6, backgroundColor: '#fff' },
  inputLarge: { fontSize: 16, padding: 12 },
  textArea: { minHeight: 200, textAlignVertical: 'top', paddingTop: 10 },
  btn: { backgroundColor: '#D4AF37', padding: 10, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '700' },
  sessionItem: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  imageBtn: { padding: 8, backgroundColor: '#eee', borderRadius: 6, marginLeft: 8 },
  imageBtnText: { color: '#333' },
  thumb: { width: 100, height: 80, marginRight: 8, borderRadius: 6 },
  muted: { color: '#999' },
  mediaTabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    gap: 12,
    margin: 16,
  },
  mediaTabButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D4AF37',
  },
  chatRow: { flexDirection: 'row', alignItems: 'center' },
  chatInput: { flex: 1, borderWidth: 1, borderColor: '#eee', padding: 8, borderRadius: 8 },
  sendBtn: { backgroundColor: '#D4AF37', padding: 10, marginLeft: 8, borderRadius: 8 },
});
