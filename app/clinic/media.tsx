import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// Import media components and services
import { AnnotationCanvas } from '@/app/components/AnnotationCanvas';
import { FullScreenImageViewer } from '@/app/components/FullScreenImageViewer';
import { ImageGrid } from '@/app/components/ImageGrid';
import { ImageUploadButton } from '@/app/components/ImageUploadButton';
import { ReportGenerator } from '@/app/components/ReportGenerator';
import { Timeline } from '@/app/components/Timeline';
import { getClinicSettings } from '@/src/services/clinicSettingsService';
import {
  createSession,
  deletePatientMedia,
  getPatientMedia,
  getPatientTimeline,
  getSessionsForPatient,
  saveAnnotatedImage,
  uploadPatientImage,
} from '@/src/services/mediaService';
import {
  ClinicSettings,
  PatientMedia,
  PatientSession,
  StrokeData,
  TextOverlay,
  TimelineEntry,
} from '@/src/types/media';

interface PatientMediaScreenProps {
  patientId?: string;
  clinicId?: string;
  isClinic?: boolean; // True if clinic user, false if patient
}

export default function PatientMediaScreen() {
  useClinicGuard();
  const { patientId: routePatientId } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { clinicId: contextClinicId, clinicUser } = useClinic();
  const { colors, isDark } = useTheme();

  // State management
  const [patientId] = useState(routePatientId as string);
  const [clinicId] = useState(contextClinicId);
  const [isClinic] = useState(!!clinicUser); // Clinic user if clinicUser is set
  const [media, setMedia] = useState<PatientMedia[]>([]);
  const [sessions, setSessions] = useState<PatientSession[]>([]);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [clinicSettings, setClinicSettings] = useState<ClinicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'media' | 'timeline'>('media');
  const [selectedImage, setSelectedImage] = useState<PatientMedia | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [annotatingImage, setAnnotatingImage] = useState<PatientMedia | null>(null);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [creatingSession, setCreatingSession] = useState(false);
  const [showSessionPicker, setShowSessionPicker] = useState(false);
  const [selectedSessionForUpload, setSelectedSessionForUpload] = useState<string | null>(null);
  const [pendingImageUri, setPendingImageUri] = useState<string | null>(null);
  const [showReportGenerator, setShowReportGenerator] = useState(false);
  const [reportType, setReportType] = useState<'session' | 'timeline'>('timeline');
  const [selectedSessionForReport, setSelectedSessionForReport] = useState<PatientSession | null>(null);

  // Load data on mount
  useEffect(() => {
    if (!patientId || !clinicId) {
      Alert.alert(t('error'), t('patientNotFound'));
      router.back();
      return;
    }

    loadData();
  }, [patientId, clinicId]);

  const loadData = async () => {
    try {
      if (!patientId || !clinicId) return;
      setLoading(true);
      const [mediaData, sessionsData, timelineData, settingsData] = await Promise.all([
        getPatientMedia(patientId, clinicId),
        getSessionsForPatient(patientId, clinicId),
        getPatientTimeline(patientId, clinicId),
        getClinicSettings(clinicId),
      ]);

      setMedia(mediaData);
      setSessions(sessionsData);
      setTimeline(timelineData);
      setClinicSettings(settingsData);
    } catch (error) {
      console.error('Error loading media data:', error);
      Alert.alert(t('error'), t('failedToLoadMedia'));
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelected = async (imageUri: string) => {
    // Show session picker modal for user to choose
    setPendingImageUri(imageUri);
    setShowSessionPicker(true);
  };

  const handleUploadWithSession = async () => {
    if (!pendingImageUri) return;
    
    try {
      if (!patientId || !clinicId) return;
      setUploading(true);
      setShowSessionPicker(false);

      const newMedia = await uploadPatientImage(
        patientId,
        clinicId,
        pendingImageUri,
        'image/jpeg',
        selectedSessionForUpload || undefined
      );

      setMedia([newMedia, ...media]);
      
      // Reload data to update timeline and sessions
      await loadData();
      
      Alert.alert(t('success'), t('imageUploadedSuccessfully'));
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert(t('error'), t('failedToUploadImage'));
    } finally {
      setUploading(false);
      setPendingImageUri(null);
      setSelectedSessionForUpload(null);
    }
  };

  const handleDeleteImage = async (mediaId: string) => {
    try {
      if (!patientId || !clinicId) return;
      await deletePatientMedia(patientId, clinicId, mediaId);
      setMedia(media.filter((m) => m.id !== mediaId));
      Alert.alert(t('success'), t('imageDeleted'));
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert(t('error'), t('failedToDeleteImage'));
    }
  };

  const handleAnnotateSave = async (
    annotatedImageUri: string,
    strokes: StrokeData[],
    textOverlays: TextOverlay[]
  ) => {
    if (!annotatingImage) return;
    if (!patientId || !clinicId) return;

    try {
      setUploading(true);

      const updatedMedia = await saveAnnotatedImage(
        patientId,
        clinicId,
        annotatingImage.id,
        annotatedImageUri,
        strokes,
        textOverlays
      );

      // Update media list
      setMedia(
        media.map((m) => (m.id === annotatingImage.id ? updatedMedia : m))
      );

      setAnnotatingImage(null);
      Alert.alert(t('success'), t('annotationSaved'));

      // Reload timeline
      const newTimeline = await getPatientTimeline(patientId, clinicId);
      setTimeline(newTimeline);
    } catch (error) {
      console.error('Error saving annotation:', error);
      Alert.alert(t('error'), t('failedToSaveAnnotation'));
    } finally {
      setUploading(false);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionTitle.trim()) {
      Alert.alert(t('validation'), t('sessionTitleRequired'));
      return;
    }
    if (!patientId || !clinicId) return;

    try {
      setCreatingSession(true);

      await createSession(patientId, clinicId, sessionTitle, sessionDescription);

      // Reload sessions and timeline
      const [newSessions, newTimeline] = await Promise.all([
        getSessionsForPatient(patientId, clinicId),
        getPatientTimeline(patientId, clinicId),
      ]);

      setSessions(newSessions);
      setTimeline(newTimeline);
      setShowCreateSession(false);
      setSessionTitle('');
      setSessionDescription('');

      Alert.alert(t('success'), t('sessionCreated'));
    } catch (error) {
      console.error('Error creating session:', error);
      Alert.alert(t('error'), t('failedToCreateSession'));
    } finally {
      setCreatingSession(false);
    }
  };

  const handleExportSessionReport = (session: PatientSession) => {
    setSelectedSessionForReport(session);
    setReportType('session');
    setShowReportGenerator(true);
  };

  const handleExportTimelineReport = () => {
    setSelectedSessionForReport(null);
    setReportType('timeline');
    setShowReportGenerator(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.buttonSecondaryBackground,
    },
    header: {
      backgroundColor: colors.card,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: colors.buttonBackground,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.buttonBackground,
    },
    content: {
      flex: 1,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    smallButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
    },
    smallButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.scrim,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 40,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 12,
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: colors.buttonBackground,
    },
    buttonSecondary: {
      backgroundColor: colors.inputBackground,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    buttonTextPrimary: {
      color: colors.buttonText,
    },
    buttonTextSecondary: {
      color: colors.textPrimary,
    },
    modalSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: -8,
      marginBottom: 8,
    },
    sessionOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    sessionOptionActive: {
      borderColor: colors.buttonBackground,
      backgroundColor: colors.bannerOverlay,
    },
    sessionOptionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    sessionOptionTitleActive: {
      color: colors.buttonBackground,
    },
    sessionOptionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.buttonBackground} />
        </View>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('tabs.media') || 'Media'}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'media' && styles.activeTab]}
            onPress={() => setActiveTab('media')}
          >
            <Text style={[styles.tabText, activeTab === 'media' && styles.activeTabText]}>
              {t('tabs.media') || 'Media'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
            onPress={() => setActiveTab('timeline')}
          >
            <Text style={[styles.tabText, activeTab === 'timeline' && styles.activeTabText]}>
              {t('tabs.timeline') || 'Timeline'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {activeTab === 'media' ? (
            <>
              {/* Clinic-only action buttons */}
              {isClinic && (
                <>
                  <View style={styles.actionButtonsContainer}>
                    <ImageUploadButton
                      onImageSelected={handleImageSelected}
                      isLoading={uploading}
                    />
                    <TouchableOpacity
                      style={[styles.smallButton, { flex: 1 }]}
                      onPress={() => setShowCreateSession(true)}
                    >
                      <MaterialIcons name="add-circle-outline" size={16} color={colors.buttonBackground} />
                      <Text style={styles.smallButtonText}>{t('session.createSession') || 'New Session'}</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Export buttons for timeline or selected session */}
                  {sessions.length > 0 && (
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={[styles.smallButton, { flex: 1 }]}
                        onPress={handleExportTimelineReport}
                      >
                        <MaterialIcons name="file-download" size={16} color={colors.buttonBackground} />
                        <Text style={styles.smallButtonText}>{t('report.exportTimelineReport') || 'Export Timeline'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {/* Image Grid */}
              <ImageGrid
                media={media}
                onSelectImage={(img) => {
                  setSelectedImage(img);
                  setShowViewer(true);
                }}
                onDeleteImage={handleDeleteImage}
                isClinic={isClinic}
                isLoading={uploading}
              />
            </>
          ) : (
            <>
              {/* Timeline Tab */}
              <Timeline
                entries={timeline}
                medias={media}
                sessions={sessions}
                onSelectMedia={(img) => {
                  setSelectedImage(img);
                  setShowViewer(true);
                }}
                onExportSession={isClinic ? handleExportSessionReport : undefined}
                isLoading={uploading}
                isClinic={isClinic}
              />
            </>
          )}
        </View>
      </View>

      {/* Full Screen Image Viewer */}
      {selectedImage && (
        <FullScreenImageViewer
          visible={showViewer}
          image={selectedImage}
          onClose={() => {
            setShowViewer(false);
            setSelectedImage(null);
          }}
          onAnnotate={isClinic ? (img) => setAnnotatingImage(img) : undefined}
          isClinic={isClinic}
        />
      )}

      {/* Annotation Canvas */}
      {annotatingImage && (
        <AnnotationCanvas
          imageUrl={annotatingImage.originalUrl}
          imageWidth={1024}
          imageHeight={1024}
          onSave={handleAnnotateSave}
          onCancel={() => setAnnotatingImage(null)}
        />
      )}

      {/* Create Session Modal */}
      <Modal visible={showCreateSession} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('session.createNewSession') || 'Create New Session'}</Text>

            <Text style={styles.inputLabel}>{t('session.sessionTitle') || 'Session Title'}</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Initial Consultation"
              placeholderTextColor={colors.inputPlaceholder}
              value={sessionTitle}
              onChangeText={setSessionTitle}
              editable={!creatingSession}
            />

            <Text style={styles.inputLabel}>{t('session.sessionDescription') || 'Description'}</Text>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              placeholder={t('session.sessionDescription') || 'Optional notes...'}
              placeholderTextColor={colors.inputPlaceholder}
              value={sessionDescription}
              onChangeText={setSessionDescription}
              multiline={true}
              editable={!creatingSession}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setShowCreateSession(false);
                  setSessionTitle('');
                  setSessionDescription('');
                }}
                disabled={creatingSession}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  {t('cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleCreateSession}
                disabled={creatingSession}
              >
                {creatingSession ? (
                  <ActivityIndicator color={colors.buttonText} />
                ) : (
                  <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                    {t('save') || 'Create'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Session Picker Modal for Upload */}
      <Modal visible={showSessionPicker} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('session.assignToSession') || 'Assign to Session'}</Text>
            <Text style={styles.modalSubtitle}>
              {t('session.assignToSessionHint') || 'Choose a session or upload without session'}
            </Text>

            <ScrollView style={{ maxHeight: 300, marginVertical: 16 }}>
              {/* No Session Option */}
              <TouchableOpacity
                style={[
                  styles.sessionOption,
                  selectedSessionForUpload === null && styles.sessionOptionActive,
                ]}
                onPress={() => setSelectedSessionForUpload(null)}
              >
                <MaterialIcons
                  name="image"
                  size={24}
                  color={selectedSessionForUpload === null ? colors.buttonBackground : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sessionOptionTitle, selectedSessionForUpload === null && styles.sessionOptionTitleActive]}>
                    {t('session.noSession') || 'No Session'}
                  </Text>
                  <Text style={styles.sessionOptionSubtitle}>
                    {t('session.uploadWithoutSession') || 'Upload without assigning to a session'}
                  </Text>
                </View>
                {selectedSessionForUpload === null && (
                  <MaterialIcons name="check-circle" size={24} color={colors.buttonBackground} />
                )}
              </TouchableOpacity>

              {/* Existing Sessions */}
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.id}
                  style={[
                    styles.sessionOption,
                    selectedSessionForUpload === session.id && styles.sessionOptionActive,
                  ]}
                  onPress={() => setSelectedSessionForUpload(session.id)}
                >
                  <MaterialIcons
                    name="folder"
                    size={24}
                    color={selectedSessionForUpload === session.id ? colors.buttonBackground : colors.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sessionOptionTitle, selectedSessionForUpload === session.id && styles.sessionOptionTitleActive]}>
                      {session.title}
                    </Text>
                    <Text style={styles.sessionOptionSubtitle}>
                      {new Date(session.date).toLocaleDateString()} • {session.mediaIds.length} {t('images')}
                    </Text>
                  </View>
                  {selectedSessionForUpload === session.id && (
                    <MaterialIcons name="check-circle" size={24} color={colors.buttonBackground} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={() => {
                  setShowSessionPicker(false);
                  setPendingImageUri(null);
                  setSelectedSessionForUpload(null);
                }}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  {t('cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleUploadWithSession}
              >
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                  {t('upload') || 'Upload'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Report Generator Modal */}
      <ReportGenerator
        visible={showReportGenerator}
        reportType={reportType}
        session={selectedSessionForReport || undefined}
        sessions={sessions}
        media={media}
        patientName={`Patient #${patientId?.slice(0, 8)}`}
        clinicName={clinicSettings?.clinicName || "BeSmile AI Dental"}
        clinicSettings={clinicSettings || undefined}
        onClose={() => {
          setShowReportGenerator(false);
          setSelectedSessionForReport(null);
        }}
      />
    </>
  );
}
