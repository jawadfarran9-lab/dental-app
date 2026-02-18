import { db } from '@/firebaseConfig';
import i18n from '@/i18n';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Platform,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 6;
const NUM_COLUMNS = 3;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - (CARD_MARGIN * 2 * NUM_COLUMNS)) / NUM_COLUMNS;

type Patient = {
  id: string;
  name: string;
  imageUrl?: string;
};

export default function ClinicDashboard() {
  useClinicGuard();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const { clinicAuth } = useAuth();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const [clinicName, setClinicName] = useState('');
  const [clinicImageUrl, setClinicImageUrl] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load clinic and patients data
  const loadClinicData = useCallback(async () => {
    try {
      const clinicId = clinicAuth?.clinicId || await AsyncStorage.getItem('clinicId');
      
      if (!clinicId) {
        console.error('[Dashboard] No clinicId found');
        setLoading(false);
        return;
      }

      // Load clinic info
      const clinicRef = doc(db, 'clinics', clinicId);
      const clinicSnap = await getDoc(clinicRef);
      
      if (clinicSnap.exists()) {
        const data = clinicSnap.data();
        setClinicName(data.clinicName || data.name || '');
        
        // Prefer profileImageUrl (single source of truth), then legacy fields
        const imageUrl = data.profileImageUrl || data.clinicImageUrl || data.imageUrl || null;
        
        setClinicImageUrl(imageUrl);
      }

      // Load patients
      const patientsRef = collection(db, 'clinics', clinicId, 'patients');
      const patientsQuery = query(patientsRef, orderBy('createdAt', 'desc'));
      const patientsSnap = await getDocs(patientsQuery);
      
      const patientsList: Patient[] = [];
      patientsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        patientsList.push({
          id: docSnap.id,
          name: data.name || data.patientName || t('patients.unnamed', 'مريض'),
          imageUrl: data.imageUrl || data.profileImage,
        });
      });

      setPatients(patientsList);
    } catch (error) {
      console.error('[Dashboard] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clinicAuth, t]);

  useFocusEffect(
    useCallback(() => {
      loadClinicData();
    }, [loadClinicData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadClinicData();
  };

  // Filter patients based on search query
  const filteredPatients = searchQuery.trim()
    ? patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : patients;

  const navigateToPatient = (patientId: string) => {
    router.push(`/clinic/${patientId}`);
  };

  const toggleSearch = () => {
    if (showSearch) {
      setSearchQuery('');
    }
    setShowSearch(!showSearch);
  };

  // Render patient card - iOS style square with soft corners
  const renderPatientCard = ({ item }: { item: Patient }) => (
    <TouchableOpacity
      style={[styles.patientCard, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}
      onPress={() => navigateToPatient(item.id)}
      activeOpacity={0.8}
    >
      <View style={[styles.patientImageContainer, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.patientImage} resizeMode="cover" />
        ) : (
          <View style={styles.patientImagePlaceholder}>
            <Ionicons name="person" size={32} color={isDark ? '#636366' : '#8e8e93'} />
          </View>
        )}
      </View>
      <View style={styles.patientNameContainer}>
        <Text style={[styles.patientName, { color: isDark ? '#ffffff' : '#1c1c1e' }]} numberOfLines={2}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Bottom tab button component - iOS Control Center style
  const TabButton = ({ 
    icon, 
    label, 
    isActive, 
    onPress 
  }: { 
    icon: keyof typeof Ionicons.glyphMap; 
    label: string; 
    isActive?: boolean; 
    onPress: () => void;
  }) => (
    <TouchableOpacity 
      style={styles.tabButton} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.tabIconCircle, 
        { 
          backgroundColor: isActive 
            ? (isDark ? 'rgba(10, 132, 255, 0.2)' : 'rgba(0, 122, 255, 0.12)') 
            : (isDark ? '#2c2c2e' : '#f2f2f7') 
        }
      ]}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={isActive ? '#007AFF' : (isDark ? '#8e8e93' : '#636366')} 
        />
      </View>
      <Text style={[
        styles.tabLabel, 
        { color: isActive ? '#007AFF' : (isDark ? '#8e8e93' : '#636366') }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Scrollable Content */}
      <FlatList
        data={filteredPatients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.patientRow}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentBlue}
          />
        }
        ListHeaderComponent={
          <>
            {/* Clinic Name */}
            <Text style={[styles.clinicName, { color: isDark ? '#ffffff' : '#1c1c1e' }]}>
              {clinicName || t('dashboard.clinicName', 'العيادة')}
            </Text>

            {/* Clinic Image - Large prominent display */}
            <View style={styles.clinicImageContainer}>
              {clinicImageUrl ? (
                <Image 
                  source={{ uri: clinicImageUrl }} 
                  style={styles.clinicImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.clinicImagePlaceholder, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
                  <Ionicons name="medical" size={56} color={isDark ? '#636366' : '#8e8e93'} />
                  <Text style={[styles.placeholderText, { color: isDark ? '#636366' : '#8e8e93' }]}>
                    {t('dashboard.noClinicImage', 'صورة العيادة')}
                  </Text>
                </View>
              )}
            </View>

            {/* Search Field (conditionally shown) */}
            {showSearch && (
              <View style={[styles.searchContainer, { backgroundColor: isDark ? '#1c1c1e' : '#ffffff' }]}>
                <View style={[styles.searchInputWrapper, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
                  <Ionicons name="search" size={18} color={isDark ? '#8e8e93' : '#636366'} />
                  <TextInput
                    style={[styles.searchInput, { color: isDark ? '#ffffff' : '#1c1c1e' }]}
                    placeholder={t('dashboard.searchPlaceholder', 'ابحث عن اسم المريض...')}
                    placeholderTextColor={isDark ? '#636366' : '#8e8e93'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoFocus
                    textAlign={isRTL ? 'right' : 'left'}
                  />
                </View>
                <TouchableOpacity onPress={toggleSearch} style={styles.cancelButtonContainer}>
                  <Text style={styles.cancelButton}>
                    {t('common.cancel', 'إلغاء')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.accentBlue} />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#2c2c2e' : '#f2f2f7' }]}>
                <Ionicons name="people-outline" size={48} color={isDark ? '#636366' : '#8e8e93'} />
              </View>
              <Text style={[styles.emptyText, { color: isDark ? '#8e8e93' : '#636366' }]}>
                {searchQuery 
                  ? t('dashboard.noResults', 'لا توجد نتائج')
                  : t('dashboard.noPatients', 'لا يوجد مرضى بعد')
                }
              </Text>
            </View>
          )
        }
      />

      {/* Bottom Navigation Bar - iOS Control Center Style */}
      <View style={[styles.bottomNav, { 
        backgroundColor: isDark ? 'rgba(28, 28, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderTopColor: isDark ? '#38383a' : '#e5e5e5'
      }]}>
        <TabButton
          icon="search"
          label={t('nav.search', 'بحث')}
          isActive={showSearch}
          onPress={toggleSearch}
        />
        <TabButton
          icon="people"
          label={t('nav.team', 'طاقم')}
          onPress={() => router.push('/clinic/team')}
        />
        <TabButton
          icon="settings-outline"
          label={t('nav.settings', 'إعدادات')}
          onPress={() => router.push('/clinic/settings')}
        />
        <TabButton
          icon="time-outline"
          label={t('nav.session', 'جلسة')}
          onPress={() => router.push('/clinic/create')}
        />
        <TabButton
          icon="person"
          label={t('nav.patients', 'المرضى')}
          isActive={true}
          onPress={() => {}}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 120,
    paddingTop: 8,
  },
  
  // Clinic Header
  clinicName: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  clinicImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  clinicImage: {
    width: SCREEN_WIDTH - 48,
    height: 220,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  clinicImagePlaceholder: {
    width: SCREEN_WIDTH - 48,
    height: 220,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '500',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 20,
    gap: 12,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
  },
  cancelButtonContainer: {
    paddingHorizontal: 4,
  },
  cancelButton: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },

  // Patient Cards - iOS Style Grid
  patientRow: {
    justifyContent: 'flex-start',
    gap: CARD_MARGIN * 2,
  },
  patientCard: {
    width: CARD_WIDTH,
    borderRadius: 18,
    marginBottom: CARD_MARGIN * 2,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  patientImageContainer: {
    width: '100%',
    aspectRatio: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  patientImage: {
    width: '100%',
    height: '100%',
  },
  patientImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientNameContainer: {
    paddingHorizontal: 8,
    paddingVertical: 10,
    minHeight: 48,
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '500',
  },

  // Bottom Navigation - iOS Control Center Style
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 0.5,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  tabButton: {
    alignItems: 'center',
    gap: 6,
    minWidth: 56,
  },
  tabIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
