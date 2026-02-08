import { useTheme } from '@/src/context/ThemeContext';
import { usePatientGuard } from '@/src/utils/navigationGuards';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

/**
 * PATIENT PROFILE SCREEN
 * 
 * Displays connected clinic profile information
 * Shows clinic contact details, address, working hours, etc.
 * Private screen - only accessible to patients
 */

export default function PatientProfileScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [clinic, setClinic] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Guard - prevent non-patients from accessing
  usePatientGuard();

  useEffect(() => {
    // TODO: Replace with real Firestore data
    // - Fetch clinic profile using patientAuth.clinicId
    // - Use src/services/clinicService.ts getClinicPublicProfile(clinicId)
    // - Remove mockClinic object below
    // - Add real-time listener for updates
    
    const mockClinic = {
      id: 'clinic1',
      name: 'Smile Dental Clinic',
      image: 'https://via.placeholder.com/150',
      description: 'Leading dental clinic providing comprehensive oral healthcare services',
      phone: '+1 (555) 123-4567',
      email: 'info@smiledental.com',
      address: '123 Main Street, Suite 100',
      city: 'Los Angeles, CA 90001',
      website: 'www.smiledental.com',
      hours: {
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 5:00 PM',
        saturday: '10:00 AM - 3:00 PM',
        sunday: 'Closed',
      },
      rating: 4.8,
      reviews: 245,
      services: [
        'General Checkup',
        'Teeth Cleaning',
        'Root Canal Treatment',
        'Orthodontics',
        'Teeth Whitening',
      ],
    };

    setClinic(mockClinic);
    setLoading(false);
  }, []);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingBottom: 20,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    clinicImage: {
      width: 120,
      height: 120,
      borderRadius: 12,
      marginBottom: 12,
      backgroundColor: colors.background,
    },
    clinicName: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    clinicDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },
    ratingText: {
      marginLeft: 8,
      color: colors.textSecondary,
      fontSize: 13,
    },
    section: {
      marginTop: 20,
      paddingHorizontal: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    contactCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    contactIcon: {
      width: 40,
      height: 40,
      borderRadius: 8,
      backgroundColor: '#F0F0F0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    contactInfo: {
      flex: 1,
    },
    contactLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    contactValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    callButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
    },
    callButtonText: {
      color: '#FFF',
      fontSize: 12,
      fontWeight: '600',
    },
    hoursContainer: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    hourRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.cardBorder,
    },
    hourRowLast: {
      borderBottomWidth: 0,
    },
    dayLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textPrimary,
      textTransform: 'capitalize',
    },
    hourValue: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    servicesList: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    serviceTag: {
      backgroundColor: '#E8F4FF',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      marginBottom: 8,
    },
    serviceTagText: {
      fontSize: 12,
      color: '#0066CC',
      fontWeight: '500',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accentBlue} />
        </View>
      </View>
    );
  }

  if (!clinic) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>
            {t('patient.noClinicProfile', 'Clinic profile not available')}
          </Text>
        </View>
      </View>
    );
  }

  const handleCall = () => {
    Linking.openURL(`tel:${clinic.phone}`);
  };

  const handleEmail = () => {
    Linking.openURL(`mailto:${clinic.email}`);
  };

  const handleVisitWebsite = () => {
    Linking.openURL(`https://${clinic.website}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header with Clinic Image & Name */}
        <View style={styles.header}>
          <Image source={{ uri: clinic.image }} style={styles.clinicImage} />
          <Text style={styles.clinicName}>{clinic.name}</Text>
          <Text style={styles.clinicDescription}>{clinic.description}</Text>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={16} color="#FFB800" />
            <Text style={styles.ratingText}>
              {clinic.rating} ({clinic.reviews} reviews)
            </Text>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('patient.contactInfo', 'Contact Information')}</Text>

          <TouchableOpacity style={styles.contactCard} onPress={handleCall}>
            <View style={styles.contactIcon}>
              <MaterialCommunityIcons name="phone" size={20} color="#007AFF" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{t('patient.phone', 'Phone')}</Text>
              <Text style={styles.contactValue}>{clinic.phone}</Text>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Text style={styles.callButtonText}>{t('patient.call', 'Call')}</Text>
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmail}>
            <View style={styles.contactIcon}>
              <MaterialCommunityIcons name="email" size={20} color="#34C759" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{t('patient.email', 'Email')}</Text>
              <Text style={styles.contactValue}>{clinic.email}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.contactCard}>
            <View style={styles.contactIcon}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#FF6B6B" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactLabel}>{t('patient.address', 'Address')}</Text>
              <Text style={styles.contactValue}>{clinic.address}</Text>
              <Text style={styles.contactValue}>{clinic.city}</Text>
            </View>
          </View>
        </View>

        {/* Working Hours Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('patient.workingHours', 'Working Hours')}</Text>
          <View style={styles.hoursContainer}>
            {Object.entries(clinic.hours).map(([day, hours], index, arr) => (
              <View key={day} style={[styles.hourRow, index === arr.length - 1 && styles.hourRowLast]}>
                <Text style={styles.dayLabel}>{day}</Text>
                <Text style={styles.hourValue}>{hours as string}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('patient.services', 'Services Offered')}</Text>
          <View style={styles.servicesList}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {clinic.services.map((service: string, index: number) => (
                <View key={index} style={styles.serviceTag}>
                  <Text style={styles.serviceTagText}>{service}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Website Button */}
        <View style={styles.section}>
          <TouchableOpacity
            style={{
              backgroundColor: colors.accentBlue,
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={handleVisitWebsite}
          >
            <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>
              {t('patient.visitWebsite', 'Visit Website')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
