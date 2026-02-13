import { db } from '@/firebaseConfig';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ClinicProfile {
  name?: string;
  address?: string;
  phone?: string;
  heroImage?: string;
  whatsapp?: string;
  isPublished?: boolean;
}

export default function ClinicProfileViewer() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { clinicId } = useLocalSearchParams<{ clinicId: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ClinicProfile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (!clinicId) return;
      setLoading(true);
      try {
        const publicDoc = await getDoc(doc(db, 'clinics_public', clinicId));
        if (publicDoc.exists()) {
          setProfile(publicDoc.data() as ClinicProfile);
        } else {
          // Fallback to main clinic doc for the name
          const clinicDoc = await getDoc(doc(db, 'clinics', clinicId));
          if (clinicDoc.exists()) {
            const d = clinicDoc.data();
            setProfile({ name: d.clinicName || d.name, phone: d.clinicPhone || d.phone });
          }
        }
      } catch (err) {
        console.warn('Failed to load clinic profile:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [clinicId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Clinic Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !profile ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Clinic profile not available
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero Image */}
          {profile.heroImage ? (
            <Image source={{ uri: profile.heroImage }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Ionicons name="business" size={80} color={isDark ? '#475569' : '#94A3B8'} />
            </View>
          )}

          {/* Clinic Info */}
          <View style={styles.infoSection}>
            <Text style={[styles.clinicName, { color: colors.text }]}>
              {profile.name || 'Unnamed Clinic'}
            </Text>

            {profile.address ? (
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{profile.address}</Text>
              </View>
            ) : null}

            {profile.phone ? (
              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{profile.phone}</Text>
              </View>
            ) : null}

            {profile.whatsapp ? (
              <View style={styles.infoRow}>
                <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>{profile.whatsapp}</Text>
              </View>
            ) : null}
          </View>

          {/* Placeholder for future content */}
          <View style={[styles.placeholder, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: colors.border }]}>
            <Ionicons name="construct-outline" size={32} color={colors.textSecondary} />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              Full clinic profile coming soon
            </Text>
            <Text style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
              Services, reviews, gallery and more
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    paddingBottom: 40,
  },
  heroImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  heroPlaceholder: {
    width: '100%',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    padding: 20,
    gap: 12,
  },
  clinicName: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    flex: 1,
  },
  placeholder: {
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  placeholderSubtext: {
    fontSize: 13,
    opacity: 0.7,
  },
});
