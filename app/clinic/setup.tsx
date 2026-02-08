import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { markSetupComplete } from '@/src/utils/roleUtils';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function ClinicSetupScreen() {
  useClinicRoleGuard(['owner']);
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [country, setCountry] = useState('');

  const accent = isDark ? '#D4AF37' : '#0a7ea4';

  const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.textSecondary }, isRTL && { textAlign: 'right' }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || label}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { borderColor: colors.cardBorder, color: colors.textPrimary, backgroundColor: colors.inputBackground }, isRTL && { textAlign: 'right' }]}
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, isRTL && { alignItems: 'flex-end' }]}> 
        <Text style={[styles.title, { color: colors.textPrimary }, isRTL && { textAlign: 'right' }]}>{t('clinicSetup.title', 'Clinic Setup')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }, isRTL && { textAlign: 'right' }]}>
          {t('clinicSetup.subtitle', 'Set up your basic clinic information')}
        </Text>
      </View>

      <Field
        label={t('clinicSetup.name', 'Clinic / Doctor name')}
        value={name}
        onChange={setName}
      />
      <Field
        label={t('clinicSetup.specialty', 'Specialty')}
        value={specialty}
        onChange={setSpecialty}
      />
      <Field
        label={t('clinicSetup.country', 'Country')}
        value={country}
        onChange={setCountry}
      />

      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: colors.textSecondary }, isRTL && { textAlign: 'right' }]}>
          {t('clinicSetup.language', 'Language preference')}
        </Text>
        <View style={[styles.languagePill, { borderColor: colors.cardBorder, backgroundColor: colors.inputBackground }, isRTL && { alignSelf: 'flex-end' }]}>
          <Text style={[styles.languageText, { color: colors.textPrimary }]}>{i18n.language}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.primaryCta, { backgroundColor: accent }]}
        activeOpacity={0.9}
        onPress={async () => {
          // Mark setup as complete
          await markSetupComplete();
          // Navigate to home after setup
          router.replace('/(tabs)/home' as any);
        }}
      >
        <Text style={[styles.primaryText, { color: isDark ? '#0b0b0b' : '#fff' }]}>
          {t('clinicSetup.next', 'Next')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, gap: 16 },
  header: { gap: 6 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15, fontWeight: '600' },
  languagePill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderRadius: 10 },
  languageText: { fontSize: 14, fontWeight: '700' },
  primaryCta: { marginTop: 12, paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  primaryText: { fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
});
