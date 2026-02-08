import { ColorPicker } from '@/app/components/ColorPicker';
import { useAuth } from '@/src/context/AuthContext';
import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import {
    getClinicSettings,
    saveClinicSettings,
    uploadClinicLogo,
} from '@/src/services/clinicSettingsService';
import { ClinicSettings } from '@/src/types/media';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme as useNavigationTheme } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

type TabType = 'profile' | 'branding' | 'preview';

export default function ClinicSettingsScreen() {
  useClinicRoleGuard(['owner']);
  const { t } = useTranslation();
  const navigationTheme = useNavigationTheme();
  const { colors, isDark } = useTheme();
  const { clinicId, clinicUser } = useClinic();
  const { userId } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  // Form state
  const [clinicName, setClinicName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [workingHours, setWorkingHours] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#D4AF37');
  const [secondaryColor, setSecondaryColor] = useState('#0B0F1A');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [clinicId, userId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      if (!clinicId || !userId) return;

      const existingSettings = await getClinicSettings(clinicId);
      
      if (existingSettings) {
        setSettings(existingSettings);
        setClinicName(existingSettings.clinicName);
        setCountry(existingSettings.country || '');
        setCity(existingSettings.city || '');
        setPhoneNumber(existingSettings.phoneNumber || '');
        setEmail(existingSettings.email || '');
        setWorkingHours(existingSettings.workingHours || '');
        setPrimaryColor(existingSettings.primaryColor || '#D4AF37');
        setSecondaryColor(existingSettings.secondaryColor || '#0B0F1A');
        setLogoUrl(existingSettings.logoUrl || '');

        // Check if current user is the owner
        setIsOwner(existingSettings.ownerUid === userId);
      } else {
        // New clinic - current user is owner
        setIsOwner(true);
      }
    } catch (error) {
      console.error('Error loading clinic settings:', error);
      Alert.alert(t('error'), t('failedToLoadSettings'));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (!clinicId || !userId) return;
      setSaving(true);

      const updatedSettings: Partial<ClinicSettings> = {
        clinicName,
        country,
        city,
        phoneNumber,
        email,
        workingHours,
        primaryColor,
        secondaryColor,
      };

      await saveClinicSettings(clinicId, userId, updatedSettings);
      Alert.alert(t('success'), t('settingsSaved'));
      await loadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert(
        t('error'),
        error instanceof Error ? error.message : t('failedToSaveSettings')
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLogo = async () => {
    try {
      if (!clinicId || !userId) return;
      setUploadingLogo(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const newLogoUrl = await uploadClinicLogo(clinicId, userId, imageUri);
        setLogoUrl(newLogoUrl);
        Alert.alert(t('success'), t('logoUploaded'));
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      Alert.alert(
        t('error'),
        error instanceof Error ? error.message : t('failedToUploadLogo')
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    closeButton: {
      padding: 8,
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
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.buttonBackground,
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    inputGroup: {
      marginBottom: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: colors.textPrimary,
      fontSize: 14,
    },
    logoSection: {
      alignItems: 'center',
      paddingVertical: 16,
    },
    logoPreview: {
      width: 200,
      height: 80,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.inputBorder,
      marginBottom: 12,
      backgroundColor: colors.inputBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoImage: {
      width: '100%',
      height: '100%',
      borderRadius: 6,
    },
    logoPlaceholder: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    uploadButton: {
      backgroundColor: colors.buttonBackground,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    uploadButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.buttonText,
    },
    previewContent: {
      padding: 16,
    },
    pdfPreview: {
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    },
    pdfHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    pdfLogo: {
      width: 60,
      height: 30,
      borderRadius: 4,
      backgroundColor: colors.background,
    },
    pdfLogoImage: {
      width: '100%',
      height: '100%',
      borderRadius: 4,
    },
    pdfClinicName: {
      fontSize: 16,
      fontWeight: '700',
      color: primaryColor,
      flex: 1,
    },
    pdfContent: {
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
      paddingTop: 12,
    },
    pdfText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
      lineHeight: 18,
    },
    pdfFooter: {
      backgroundColor: secondaryColor,
      height: 20,
      borderRadius: 4,
      marginTop: 12,
    },
    buttonContainer: {
      padding: 16,
      flexDirection: 'row',
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.cardBorder,
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
      fontSize: 12,
      fontWeight: '600',
    },
    buttonTextPrimary: {
      color: colors.buttonText,
    },
    buttonTextSecondary: {
      color: colors.textPrimary,
    },
    disabledOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    },
    disabledText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  }), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  const renderProfileTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.clinicInformation')}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('settings.clinicName')}</Text>
          <TextInput
            style={styles.input}
            value={clinicName}
            onChangeText={setClinicName}
            placeholder={t('settings.clinicNamePlaceholder')}
            placeholderTextColor={isDark ? '#666' : '#CCC'}
            editable={isOwner}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('settings.country')}</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder={t('settings.countryPlaceholder')}
            placeholderTextColor={isDark ? '#666' : '#CCC'}
            editable={isOwner}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('settings.city')}</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder={t('settings.cityPlaceholder')}
            placeholderTextColor={isDark ? '#666' : '#CCC'}
            editable={isOwner}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('settings.phoneNumber')}</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder={t('settings.phoneNumberPlaceholder')}
            placeholderTextColor={isDark ? '#666' : '#CCC'}
            editable={isOwner}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('settings.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('settings.emailPlaceholder')}
            placeholderTextColor={isDark ? '#666' : '#CCC'}
            editable={isOwner}
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('settings.workingHours')}</Text>
          <TextInput
            style={styles.input}
            value={workingHours}
            onChangeText={setWorkingHours}
            placeholder={t('settings.workingHoursPlaceholder')}
            placeholderTextColor={isDark ? '#666' : '#CCC'}
            editable={isOwner}
          />
        </View>
      </View>
    </ScrollView>
  );

  const renderBrandingTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.logo')}</Text>
        <View style={styles.logoSection}>
          <View style={styles.logoPreview}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl }}
                style={styles.logoImage}
              />
            ) : (
              <Text style={styles.logoPlaceholder}>{t('settings.noLogoUploaded')}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadLogo}
            disabled={!isOwner || uploadingLogo}
          >
            {uploadingLogo ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <MaterialIcons name="upload" size={16} color="#000" />
                <Text style={styles.uploadButtonText}>{t('settings.uploadLogo')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.brandColors')}</Text>
        <ColorPicker
          value={primaryColor}
          onChange={setPrimaryColor}
          label={t('settings.primaryColor')}
          disabled={!isOwner}
        />
        <ColorPicker
          value={secondaryColor}
          onChange={setSecondaryColor}
          label={t('settings.secondaryColor')}
          disabled={!isOwner}
        />
      </View>

      {!isOwner && (
        <View style={styles.section}>
          <View style={{ position: 'relative' }}>
            <View style={styles.disabledOverlay}>
              <Text style={styles.disabledText}>{t('settings.disabledText')}</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );

  const renderPreviewTab = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.previewContent}>
        <Text style={styles.sectionTitle}>{t('settings.pdfReportPreview')}</Text>

        <View style={styles.pdfPreview}>
          {/* PDF Header */}
          <View style={styles.pdfHeader}>
            {logoUrl && (
              <View style={styles.pdfLogo}>
                <Image
                  source={{ uri: logoUrl }}
                  style={styles.pdfLogoImage}
                />
              </View>
            )}
            <Text style={[styles.pdfClinicName, { color: primaryColor }]}>
              {clinicName || t('settings.pdfClinicNameFallback')}
            </Text>
          </View>

          {/* PDF Content */}
          <View style={styles.pdfContent}>
            <Text style={styles.pdfText}>
              <Text style={{ fontWeight: '600' }}>{t('settings.patientName')}</Text> {t('settings.patientNameValue')}
            </Text>
            <Text style={styles.pdfText}>
              <Text style={{ fontWeight: '600' }}>{t('settings.session')}</Text> {t('settings.sessionValue')}
            </Text>
            <Text style={styles.pdfText}>
              <Text style={{ fontWeight: '600' }}>{t('settings.date')}</Text> {new Date().toLocaleDateString()}
            </Text>
            <Text
              style={[
                styles.pdfText,
                { marginTop: 8, fontStyle: 'italic', color: isDark ? '#999' : '#BBB' },
              ]}
            >
              {t('settings.treatmentImages')}
            </Text>
          </View>

          {/* PDF Footer */}
          <View style={[styles.pdfFooter, { backgroundColor: secondaryColor }]} />
          <Text
            style={[
              styles.pdfText,
              { marginTop: 8, fontSize: 10, textAlign: 'center' },
            ]}
          >
            {t('settings.generatedBySmileCare')}
          </Text>
        </View>

        <Text style={[styles.label, { marginTop: 16 }]}>
          {t('settings.pdfPreviewDescription')}
        </Text>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('settings.headerTitle')}</Text>
        {!isOwner && (
          <MaterialIcons name="lock" size={20} color={colors.buttonBackground} />
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'branding' && styles.activeTab]}
          onPress={() => setActiveTab('branding')}
        >
          <Text style={[styles.tabText, activeTab === 'branding' && styles.activeTabText]}>
            Branding
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'preview' && styles.activeTab]}
          onPress={() => setActiveTab('preview')}
        >
          <Text style={[styles.tabText, activeTab === 'preview' && styles.activeTabText]}>
            Preview
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'profile' && renderProfileTab()}
      {activeTab === 'branding' && renderBrandingTab()}
      {activeTab === 'preview' && renderPreviewTab()}

      {/* Save Button */}
      {activeTab !== 'preview' && isOwner && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={loadSettings}
            disabled={saving}
          >
            <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleSaveSettings}
            disabled={saving || !clinicName.trim()}
          >
            {saving ? (
              <ActivityIndicator color={colors.buttonText} />
            ) : (
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
