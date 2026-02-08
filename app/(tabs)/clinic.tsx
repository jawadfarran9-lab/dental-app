import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

/**
 * CLINIC ENTRY PAGE
 * 
 * Main entry point with navigation buttons:
 * - "عيادة" → /clinic/login
 * - "مريض" → /patient
 * - "اشتراك" → /clinic/signup
 * - "ألعاب" → /kids
 * - "رجوع" → /(tabs)/home
 */
export default function ClinicTab() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : '#F5F7FA' }]}>
      {/* Back Button - Top Left */}
      <TouchableOpacity
        style={[styles.backButton, { backgroundColor: isDark ? '#333' : '#E8ECF0' }]}
        onPress={() => router.push('/(tabs)/home' as any)}
      >
        <Ionicons name="arrow-back" size={18} color={isDark ? '#FFF' : '#1E3A5F'} />
        <Text style={[styles.backText, { color: isDark ? '#FFF' : '#1E3A5F' }]}>
          Back
        </Text>
      </TouchableOpacity>

      {/* App Title */}
      <View style={styles.titleContainer}>
        <Text style={[styles.appTitle, { color: colors.textPrimary }]}>
          BeSmile AI
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Select your role to continue
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {/* Button 1: "عيادة" → /clinic/login */}
        <TouchableOpacity
          style={[styles.cta, styles.ctaClinic]}
          activeOpacity={0.85}
          onPress={() => router.push('/clinic/login' as any)}
        >
          <Ionicons name="medical" size={22} color="#FFFFFF" />
          <Text style={styles.ctaText}>عيادة</Text>
        </TouchableOpacity>

        {/* Button 2: "مريض" → /patient */}
        <TouchableOpacity
          style={[styles.cta, styles.ctaPatient]}
          activeOpacity={0.85}
          onPress={() => router.push('/patient' as any)}
        >
          <Ionicons name="person" size={22} color="#FFFFFF" />
          <Text style={styles.ctaText}>مريض</Text>
        </TouchableOpacity>

        {/* Button 3: "اشتراك" → /clinic/signup */}
        <TouchableOpacity
          style={[styles.cta, styles.ctaSubscribe]}
          activeOpacity={0.85}
          onPress={() => router.push('/clinic/signup' as any)}
        >
          <Ionicons name="card" size={22} color="#FFFFFF" />
          <Text style={styles.ctaText}>اشتراك</Text>
        </TouchableOpacity>

        {/* Button 4: "ألعاب" → /kids */}
        <TouchableOpacity
          style={[styles.cta, styles.ctaGames]}
          activeOpacity={0.85}
          onPress={() => router.push('/kids' as any)}
        >
          <Ionicons name="game-controller" size={22} color="#FFFFFF" />
          <Text style={styles.ctaText}>ألعاب</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 50,
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: { 
    gap: 14,
    paddingHorizontal: 8,
  },
  cta: { 
    flexDirection: 'row',
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18, 
    paddingHorizontal: 24, 
    borderRadius: 16,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 4,
  },
  ctaClinic: {
    backgroundColor: '#4A90D9',
  },
  ctaPatient: {
    backgroundColor: '#5BA3E0',
  },
  ctaSubscribe: {
    backgroundColor: '#7C6AE8',
  },
  ctaGames: {
    backgroundColor: '#34A853',
  },
  ctaText: { 
    fontSize: 20, 
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

