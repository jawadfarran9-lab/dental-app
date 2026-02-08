import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, BackHandler, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DentalCover from '../components/DentalCover';
/**
 * CLINIC DETAILS FORM
 * 
 * Required after subscription is confirmed.
 * User must complete clinic details before accessing app.
 */

export default function ClinicDetails() {
  useClinicRoleGuard(['owner']);
  const { clinicId: routeClinicId } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  useFocusEffect(
    React.useCallback(() => {
      const loadClinicInfo = async () => {
        try {
          // Get clinic ID from route params or session
          let id = routeClinicId as string | null;
          if (!id) {
            id = await AsyncStorage.getItem('clinicId');
          }

          if (!id) {
            Alert.alert(t('common.error'), t('clinicDetailsForm.clinicIdNotFound'));
            router.replace('/clinic/subscribe' as any);
            return;
          }

          setClinicId(id);

          // Load existing clinic data
          const clinicRef = doc(db, 'clinics', id);
          const clinicSnap = await getDoc(clinicRef);

          if (clinicSnap.exists()) {
            const data = clinicSnap.data();
            setClinicName(data.clinicName || '');
            setClinicPhone(data.clinicPhone || '');
          }
        } catch (err) {
          console.error('Error loading clinic details:', err);
        }
      };

      loadClinicInfo();

      return () => {
        // Cleanup on unmount
      };
    }, [routeClinicId])
  );

  const onSubmit = async () => {
    if (!clinicName.trim()) {
      return Alert.alert(t('common.validation'), t('clinicDetailsForm.nameRequired'));
    }

    if (!clinicPhone.trim()) {
      return Alert.alert(t('common.validation'), t('clinicDetailsForm.phoneRequired'));
    }

    setLoading(true);
    try {
      // Save clinic details to AsyncStorage for payment step
      await AsyncStorage.multiSet([
        ['pendingClinicName', clinicName.trim()],
        ['pendingClinicPhone', clinicPhone.trim()],
      ]);

      // Load pending subscription plan
      const plan = await AsyncStorage.getItem('pendingSubscriptionPlan');
      const planName = await AsyncStorage.getItem('pendingSubscriptionPlanName');
      
      setLoading(false);

      // Navigate to payment screen with plan params
      router.push({
        pathname: '/clinic/payment',
        params: { 
          plan: plan || 'MONTHLY',
          planName: planName || 'Monthly'
        }
      } as any);
    } catch (err: any) {
      console.error('Error saving clinic details:', err);
      Alert.alert(t('common.error'), err.message || t('clinicDetailsForm.saveFailed'));
      setLoading(false);
    }
  };

  const goBack = () => {
    router.replace('/clinic/subscribe' as any);
  };

  // Handle hardware back button
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (!loading) {
          goBack();
        }
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [loading])
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} keyboardShouldPersistTaps="handled">
        <DentalCover clinicName={clinicName} />

        {/* Back Button */}
        <TouchableOpacity style={styles.backButton} onPress={goBack} disabled={loading}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t('clinicDetailsForm.title', 'Clinic details')}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('clinicDetailsForm.subtitle', 'Tell us about your clinic to finish setup.')}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('clinicDetailsForm.sectionTitle', 'Clinic info')}
          </Text>
          <TextInput 
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }, isRTL && { textAlign: 'right', writingDirection: 'rtl' }]} 
            placeholder={t('clinicDetailsForm.namePlaceholder', 'Clinic name')} 
            placeholderTextColor={colors.inputPlaceholder} 
            value={clinicName} 
            onChangeText={setClinicName} 
            editable={!loading} 
          />

          <TextInput 
            style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.textPrimary }, { textAlign: 'left', writingDirection: 'ltr' }]} 
            placeholder={t('clinicDetailsForm.phonePlaceholder', 'Clinic phone number')} 
            placeholderTextColor={colors.inputPlaceholder} 
            keyboardType="phone-pad" 
            value={clinicPhone} 
            onChangeText={setClinicPhone} 
            editable={!loading} 
          />
        </View>

        <TouchableOpacity 
          style={[styles.btn, { backgroundColor: colors.buttonBackground }, loading && styles.btnDisabled]} 
          onPress={onSubmit} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={[styles.btnText, { color: colors.buttonText }]}>
              {t('clinicDetailsForm.continue', 'Continue')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 0, paddingVertical: 0, flexGrow: 1 },
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    paddingBottom: 8 
  },
  backButtonText: { 
    marginLeft: 8, 
    fontWeight: '600' 
  },
  header: { marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, paddingHorizontal: 16, marginTop: 8 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 16, marginBottom: 4 },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  input: { borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12 },
  btn: { padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 16, marginBottom: 12, marginHorizontal: 16 },
  btnDisabled: { opacity: 0.7 },
  btnText: { fontWeight: '700', fontSize: 16 },
});
