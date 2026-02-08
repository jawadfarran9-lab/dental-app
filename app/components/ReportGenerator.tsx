import { DateRangePicker } from '@/app/components/DateRangePicker';
import { useTheme } from '@/src/context/ThemeContext';
import {
    createReportFilename,
    generateSessionReportHTML,
    generateTimelineReportHTML,
    printHTMLReport,
    shareHTMLReportPDF,
} from '@/src/services/reportService';
import { ClinicSettings, PatientMedia, PatientSession } from '@/src/types/media';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface ReportGeneratorProps {
  visible: boolean;
  reportType: 'session' | 'timeline';
  session?: PatientSession;
  sessions?: PatientSession[];
  media: PatientMedia[];
  patientName: string;
  clinicName: string;
  clinicSettings?: ClinicSettings;
  onClose: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  visible,
  reportType,
  session,
  sessions = [],
  media,
  patientName,
  clinicName,
  clinicSettings,
  onClose,
}: ReportGeneratorProps) => {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'pdf' | 'txt' | 'csv'>('pdf');
  const [shouldShare, setShouldShare] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState<number | null>(null);
  const [dateRangeEnd, setDateRangeEnd] = useState<number | null>(null);

  const handleGenerateReport = async () => {
    try {
      setLoading(true);

      let html = '';
      let filename = '';

      if (reportType === 'session' && session) {
        html = await generateSessionReportHTML(session, media, patientName, clinicName, clinicSettings);
        filename = createReportFilename('session', session.title);
      } else if (reportType === 'timeline') {
        const dateRange =
          dateRangeStart && dateRangeEnd
            ? { start: dateRangeStart, end: dateRangeEnd }
            : undefined;

        html = await generateTimelineReportHTML(
          sessions,
          media,
          patientName,
          clinicName,
          dateRange,
          clinicSettings
        );
        filename = createReportFilename('timeline');
      }

      if (!html) {
        Alert.alert(t('error'), t('report.failedToGenerateReport'));
        return;
      }

      if (format === 'pdf') {
        // Share PDF via native dialog
        if (shouldShare) {
          await shareHTMLReportPDF(html, filename);
          Alert.alert(t('success'), t('report.reportGenerated'));
        } else {
          // Print to file (save to device)
          await printHTMLReport(html, filename);
          Alert.alert(t('success'), t('report.reportSaved'));
        }
      }

      onClose();
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert(t('error'), t('report.failedToGenerateReport'));
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
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
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    section: {
      marginVertical: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      marginBottom: 8,
    },
    optionLabel: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    smallButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
    },
    smallButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    formatButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginRight: 8,
      backgroundColor: colors.inputBackground,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    formatButtonActive: {
      borderColor: colors.buttonBackground,
      backgroundColor: colors.bannerOverlay,
    },
    formatButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    formatButtonTextActive: {
      color: colors.buttonBackground,
    },
    formatRow: {
      flexDirection: 'row',
      gap: 8,
    },
    previewBox: {
      backgroundColor: colors.inputBackground,
      padding: 12,
      borderRadius: 8,
      maxHeight: 150,
      marginVertical: 12,
    },
    previewText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'monospace',
      lineHeight: 16,
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
  });

  return (
    <>
      <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
              {reportType === 'session' ? t('report.generateSessionReport') : t('report.generateTimelineReport')}
            </Text>

            {/* Format Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('report.reportFormat')}</Text>
              <View style={styles.formatRow}>
                <TouchableOpacity
                  style={[styles.formatButton, format === 'pdf' && styles.formatButtonActive]}
                  onPress={() => setFormat('pdf')}
                >
                  <Text
                    style={[
                      styles.formatButtonText,
                      format === 'pdf' && styles.formatButtonTextActive,
                    ]}
                  >
                    📄 PDF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formatButton, format === 'txt' && styles.formatButtonActive]}
                  onPress={() => setFormat('txt')}
                >
                  <Text
                    style={[
                      styles.formatButtonText,
                      format === 'txt' && styles.formatButtonTextActive,
                    ]}
                  >
                    📋 Text
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formatButton, format === 'csv' && styles.formatButtonActive]}
                  onPress={() => setFormat('csv')}
                >
                  <Text
                    style={[
                      styles.formatButtonText,
                      format === 'csv' && styles.formatButtonTextActive,
                    ]}
                  >
                    📊 CSV
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Range for Timeline Reports */}
            {reportType === 'timeline' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Date Range (Optional)</Text>
                <TouchableOpacity
                  style={[styles.smallButton, { marginVertical: 8 }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <MaterialIcons name="calendar-today" size={16} color={colors.buttonBackground} />
                  <Text style={styles.smallButtonText}>
                    {dateRangeStart && dateRangeEnd
                      ? `${new Date(dateRangeStart).toLocaleDateString()} to ${new Date(dateRangeEnd).toLocaleDateString()}`
                      : 'Select date range...'}
                  </Text>
                </TouchableOpacity>
                {dateRangeStart && dateRangeEnd && (
                  <TouchableOpacity
                    style={[styles.smallButton, { marginVertical: 8 }]}
                    onPress={() => {
                      setDateRangeStart(null);
                      setDateRangeEnd(null);
                    }}
                  >
                    <MaterialIcons name="clear" size={16} color={colors.textSecondary} />
                    <Text style={[styles.smallButtonText, { color: colors.textSecondary }]}>Clear filter</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Share Option */}
            <View style={styles.section}>
              <View style={styles.optionRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialIcons
                    name="share"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.optionLabel}>{t('report.shareReport')}</Text>
                </View>
                <Switch
                  value={shouldShare}
                  onValueChange={setShouldShare}
                  trackColor={{ false: colors.inputBorder, true: colors.buttonBackground }}
                  thumbColor={shouldShare ? colors.buttonBackground : colors.inputBackground}
                />
              </View>
              <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
                {shouldShare ? t('report.willBeShared') : t('report.willBeSaved')}
              </Text>
            </View>

            {/* Report Preview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('report.preview')}</Text>
              <View style={styles.previewBox}>
                <Text style={styles.previewText}>
                  {reportType === 'session' && session
                    ? `Session: ${session.title}\nImages: ${session.mediaIds.length}\nFormat: ${format.toUpperCase()}`
                    : `Timeline Report\nSessions: ${sessions.length}\nFormat: ${format.toUpperCase()}`}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleGenerateReport}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.buttonText} />
              ) : (
                <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                  {t('report.generateReport')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>

    {/* Date Range Picker Modal */}
    <DateRangePicker
      visible={showDatePicker}
      onClose={() => setShowDatePicker(false)}
      onApply={(start, end) => {
        setDateRangeStart(start);
        setDateRangeEnd(end);
      }}
      startDate={dateRangeStart || undefined}
      endDate={dateRangeEnd || undefined}
    />
    </>
  );
};

export default ReportGenerator;
