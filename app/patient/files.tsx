import { useTheme } from '@/src/context/ThemeContext';
import { usePatientGuard } from '@/src/utils/navigationGuards';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

/**
 * PATIENT FILES SCREEN
 * 
 * Displays patient's files/documents organized by connected clinic
 * Shows clinic info with image, name, and associated files
 * Private screen - only accessible to patients
 */

export default function PatientFilesScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Guard - prevent non-patients from accessing
  usePatientGuard();

  useEffect(() => {
    // TODO: Replace with real Firestore data
    // - Fetch patient files using patientAuth.patientId and clinicId
    // - Use src/services/filesService.ts listPatientFiles(patientId, clinicId)
    // - Remove mockFiles array below
    // - Add real-time listener for new files
    
    const mockFiles = [
      {
        id: '1',
        clinicId: 'clinic1',
        clinicName: 'Smile Dental Clinic',
        clinicImage: 'https://via.placeholder.com/100',
        fileName: 'X-Ray Report',
        date: '2025-12-15',
        type: 'pdf',
      },
      {
        id: '2',
        clinicId: 'clinic1',
        clinicName: 'Smile Dental Clinic',
        clinicImage: 'https://via.placeholder.com/100',
        fileName: 'Treatment Plan',
        date: '2025-12-10',
        type: 'pdf',
      },
      {
        id: '3',
        clinicId: 'clinic2',
        clinicName: 'Bright Teeth Center',
        clinicImage: 'https://via.placeholder.com/100',
        fileName: 'Invoice',
        date: '2025-12-01',
        type: 'pdf',
      },
    ];
    
    setFiles(mockFiles);
    setLoading(false);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingBottom: 20,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    clinicCard: {
      marginHorizontal: 16,
      marginVertical: 8,
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    clinicHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    clinicImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: colors.background,
    },
    clinicInfo: {
      flex: 1,
    },
    clinicName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    fileCount: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    fileList: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    fileItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginVertical: 4,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: '#007AFF',
    },
    fileIcon: {
      width: 24,
      height: 24,
      marginRight: 12,
      backgroundColor: '#FFE6E6',
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fileIconText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FF6B6B',
    },
    fileInfo: {
      flex: 1,
    },
    fileName: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    fileDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('patient.files', 'My Files')}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
        </View>
      </View>
    );
  }

  if (!files || files.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('patient.files', 'My Files')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{t('patient.noFiles', 'No files available yet')}</Text>
        </View>
      </View>
    );
  }

  // Group files by clinic
  const groupedFiles: { [key: string]: any } = {};
  files.forEach((file) => {
    if (!groupedFiles[file.clinicId]) {
      groupedFiles[file.clinicId] = {
        clinic: {
          id: file.clinicId,
          name: file.clinicName,
          image: file.clinicImage,
        },
        files: [],
      };
    }
    groupedFiles[file.clinicId].files.push(file);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('patient.files', 'My Files')}</Text>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {Object.values(groupedFiles).map((group: any, index: number) => (
          <View key={`clinic-${index}`} style={styles.clinicCard}>
            {/* Clinic Header */}
            <View style={styles.clinicHeader}>
              <Image
                source={{ uri: group.clinic.image }}
                style={styles.clinicImage}
              />
              <View style={styles.clinicInfo}>
                <Text style={styles.clinicName}>{group.clinic.name}</Text>
                <Text style={styles.fileCount}>
                  {group.files.length} {group.files.length === 1 ? 'file' : 'files'}
                </Text>
              </View>
            </View>

            {/* Files List */}
            <View style={styles.fileList}>
              {group.files.map((file: any) => (
                <TouchableOpacity key={file.id} style={styles.fileItem}>
                  <View style={styles.fileIcon}>
                    <Text style={styles.fileIconText}>{file.type.toUpperCase()}</Text>
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName}>{file.fileName}</Text>
                    <Text style={styles.fileDate}>{new Date(file.date).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
