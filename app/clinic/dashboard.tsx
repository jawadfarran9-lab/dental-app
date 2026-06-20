import { db } from '@/firebaseConfig';
import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useAuth } from '@/src/context/AuthContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useAIProStatus } from '@/src/hooks/useAIProStatus';
import { CLINIC_HOME_CONFIG, ClinicTypeKey } from '@/src/utils/clinicTypeConfig';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    Easing,
    FlatList,
    I18nManager,
    Image,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 12;
const NUM_COLUMNS = 3;
const CARD_WIDTH =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type Patient = {
  id: string;
  name: string;
  imageUrl?: string;
};

const AVATAR_PALETTE: readonly (readonly [string, string])[] = [
  ['#4D9DFF', '#1E6BE6'],
  ['#A989FF', '#7C3AED'],
  ['#34DDB0', '#0EA37A'],
  ['#FF92B3', '#E0517E'],
  ['#FFC36B', '#F59E0B'],
  ['#7B8CFF', '#4F46E5'],
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function PatientCard({
  item,
  isLastInRow,
  onPress,
}: {
  item: Patient;
  isLastInRow: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const palette = AVATAR_PALETTE[hashName(item.name) % AVATAR_PALETTE.length];

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 6,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.patientCard,
        { marginRight: isLastInRow ? 0 : GRID_GAP, transform: [{ scale }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={null}
      >
        <View style={styles.avatarWrap}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.avatarImage} />
          ) : (
            <LinearGradient
              colors={palette}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <Text style={styles.avatarInitials}>{initialsOf(item.name)}</Text>
            </LinearGradient>
          )}
        </View>
        <Text style={styles.patientName} numberOfLines={2}>
          {item.name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function ClinicDashboard() {
  useClinicGuard();
  const router = useRouter();
  const { isDark } = useTheme();
  const { clinicId, clinicRole } = useAuth();
  const { hasAIPro } = useAIProStatus();
  const insets = useSafeAreaInsets();

  const [clinicName, setClinicName] = useState('');
  const [clinicImageUrl, setClinicImageUrl] = useState<string | null>(null);
  const [clinicType, setClinicType] = useState<ClinicTypeKey | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const heroAnim = useRef(new Animated.Value(0)).current;
  const gridAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(gridAnim, {
        toValue: 1,
        duration: 460,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroAnim, gridAnim]);

  useEffect(() => {
    if (!hasAIPro) {
      waveAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => {
      loop.stop();
      waveAnim.setValue(0);
    };
  }, [waveAnim, hasAIPro]);

  const loadClinicData = useCallback(async () => {
    try {
      const resolvedClinicId = clinicId || (await AsyncStorage.getItem('clinicId'));
      if (!resolvedClinicId) {
        console.error('[Dashboard] No clinicId found');
        setLoading(false);
        return;
      }

      const clinicRef = doc(db, 'clinics', resolvedClinicId);
      const clinicSnap = await getDoc(clinicRef);

      if (clinicSnap.exists()) {
        const data = clinicSnap.data();
        setClinicName(data.clinicName || data.name || '');
        const imageUrl =
          data.profileImageUrl || data.clinicImageUrl || data.imageUrl || null;
        setClinicImageUrl(imageUrl);
        const t = (data.clinicType || data.type) as string | undefined;
        if (t === 'dental' || t === 'beauty' || t === 'laser') {
          setClinicType(t);
        }
      }

      const patientsRef = collection(db, 'clinics', resolvedClinicId, 'patients');
      const patientsQuery = query(patientsRef, orderBy('createdAt', 'desc'));
      const patientsSnap = await getDocs(patientsQuery);

      const patientsList: Patient[] = [];
      patientsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        patientsList.push({
          id: docSnap.id,
          name: data.name || data.patientName || 'Unnamed',
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
  }, [clinicId]);

  useFocusEffect(
    useCallback(() => {
      loadClinicData();
    }, [loadClinicData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadClinicData();
  };

  const filteredPatients = useMemo(
    () =>
      searchQuery.trim()
        ? patients.filter((p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
        : patients,
    [patients, searchQuery]
  );

  const navigateToPatient = (patientId: string) => {
    router.push(`/clinic/${patientId}`);
  };

  const toggleSearch = () => {
    if (showSearch) {
      setSearchQuery('');
    }
    setShowSearch(!showSearch);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home' as any);
  };

  const ltrRow: 'row' | 'row-reverse' = I18nManager.isRTL ? 'row-reverse' : 'row';

  const typeInfo = clinicType ? CLINIC_HOME_CONFIG[clinicType] : null;
  const typeEmoji = typeInfo?.emoji ?? '🏥';
  const typeLabel = typeInfo?.name ?? 'Clinic';
  const patientsWord = typeInfo?.patientsLabel ?? 'Patients';

  const nameLetters = useMemo(() => {
    const source = clinicName || 'Clinic';
    const chars = Array.from(source);
    return chars.map((ch, i) => {
      if (ch === ' ') {
        return { ch, transform: null as null | { translateY: Animated.AnimatedInterpolation<number>; rotate: Animated.AnimatedInterpolation<string> } };
      }
      const phase = i * 0.027;
      const value = Animated.modulo(Animated.add(waveAnim, phase), 1);
      const translateY = value.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, -2.5, -3.5, -2.5, 0],
      });
      const rotate = value.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: ['0deg', '-3.2deg', '-4.5deg', '-3.2deg', '0deg'],
      });
      return { ch, transform: { translateY, rotate } };
    });
  }, [clinicName, waveAnim]);

  const renderPatientCard = ({ item, index }: { item: Patient; index: number }) => {
    const isLastInRow = (index + 1) % NUM_COLUMNS === 0;
    return (
      <PatientCard
        item={item}
        isLastInRow={isLastInRow}
        onPress={() => navigateToPatient(item.id)}
      />
    );
  };

  const TabButton = ({
    icon,
    label,
    isActive,
    locked,
    onPress,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    isActive?: boolean;
    locked?: boolean;
    onPress: () => void;
  }) => {
    const inner = (
      <Ionicons
        name={icon}
        size={22}
        color={isActive ? '#FFFFFF' : 'rgba(255,255,255,0.78)'}
      />
    );
    return (
      <TouchableOpacity
        style={[styles.tabButton, locked && { opacity: 0.5 }]}
        onPress={locked ? () => {} : onPress}
        activeOpacity={locked ? 1 : 0.75}
      >
        {isActive ? (
          <LinearGradient
            colors={['#4D9DFF', '#1668E3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.tabIconCircle, styles.tabIconCircleActive]}
          >
            {inner}
          </LinearGradient>
        ) : (
          <View style={styles.tabIconCircle}>
            {inner}
            {locked && (
              <View style={styles.tabLockBadge}>
                <Ionicons name="lock-closed" size={9} color="#FFFFFF" />
              </View>
            )}
          </View>
        )}
        <Text
          style={[
            styles.tabLabel,
            { color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.72)' },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.root, { direction: 'ltr' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={false} />

      {/* Soft colour orbs behind everything */}
      <View pointerEvents="none" style={styles.bgOrbBlue} />
      <View pointerEvents="none" style={styles.bgOrbViolet} />
      <View pointerEvents="none" style={styles.bgOrbTeal} />

      <FlatList
        data={filteredPatients}
        renderItem={renderPatientCard}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 12 },
        ]}
        columnWrapperStyle={styles.patientRow}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFFFFF"
          />
        }
        ListHeaderComponent={
          <Animated.View
            style={{
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [22, 0],
                  }),
                },
              ],
            }}
          >
            {/* HERO */}
            <LinearGradient
              colors={['#2E5BFF', '#5546FF', '#8B5CF6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View pointerEvents="none" style={styles.heroOrbOne} />
              <View pointerEvents="none" style={styles.heroOrbTwo} />
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(255,255,255,0.20)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.9 }}
                style={styles.heroHighlight}
              />

              {/* Top: BACK only */}
              <View style={[styles.heroTopRow, { flexDirection: ltrRow }]}>
                <TouchableOpacity
                  onPress={goBack}
                  style={styles.frostedIconBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Identity row */}
              <View style={[styles.identityRow, { flexDirection: ltrRow }]}>
                <View style={styles.identityTile}>
                  {clinicImageUrl ? (
                    <Image
                      source={{ uri: clinicImageUrl }}
                      style={styles.identityImage}
                    />
                  ) : (
                    <Text style={styles.identityEmoji}>{typeEmoji}</Text>
                  )}
                </View>
                <View style={styles.identityText}>
                  {hasAIPro ? (
                    <View style={styles.clinicTitleRow}>
                      {nameLetters.map((item, i) =>
                        item.transform ? (
                          <Animated.Text
                            key={`l-${i}`}
                            style={[
                              styles.clinicTitle,
                              {
                                transform: [
                                  { translateY: item.transform.translateY },
                                  { rotate: item.transform.rotate },
                                ],
                              },
                            ]}
                          >
                            {item.ch}
                          </Animated.Text>
                        ) : (
                          <Text key={`s-${i}`} style={styles.clinicTitle}>
                            {item.ch}
                          </Text>
                        )
                      )}
                    </View>
                  ) : (
                    <Text style={styles.clinicTitle} numberOfLines={1}>
                      {clinicName || 'Clinic'}
                    </Text>
                  )}
                  <Text style={styles.clinicMeta} numberOfLines={1}>
                    {patients.length} {patientsWord.toLowerCase()} · {typeLabel}
                  </Text>
                </View>
              </View>
            </LinearGradient>

            {/* Persistent search */}
            {showSearch && (
              <View style={[styles.searchBar, { flexDirection: ltrRow }]}>
                <Ionicons name="search" size={18} color="#8A93AC" />
                <TextInput
                  style={styles.searchInput}
                  placeholder={`Search ${patientsWord.toLowerCase()}...`}
                  placeholderTextColor="#8A93AC"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  textAlign="left"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={18} color="#8A93AC" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Section header */}
            <View style={[styles.sectionRow, { flexDirection: ltrRow }]}>
              <Text style={styles.sectionTitle}>{patientsWord}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{filteredPatients.length}</Text>
              </View>
            </View>
          </Animated.View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyBadgeWrap}>
                <View pointerEvents="none" style={styles.emptyGlow} />
                <LinearGradient
                  colors={['#FFFFFF', '#F4F7FF']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyBadge}
                >
                  <LinearGradient
                    colors={['#5BA4FF', '#6E5BFF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyBadgeInner}
                  >
                    <Ionicons name="people" size={28} color="#FFFFFF" />
                  </LinearGradient>
                </LinearGradient>
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No results' : `No ${patientsWord.toLowerCase()} yet`}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? 'Try a different search.'
                  : `Your ${patientsWord.toLowerCase()} will appear here as you add them.`}
              </Text>
            </View>
          )
        }
        CellRendererComponent={({ children, style, ...props }) => (
          <Animated.View
            {...props}
            style={[
              style,
              {
                opacity: gridAnim,
                transform: [
                  {
                    translateY: gridAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [14, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {children}
          </Animated.View>
        )}
      />

      {/* Floating + FAB (unwired) */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {}}
        style={[styles.fabWrap, { bottom: insets.bottom + 96 }]}
      >
        <LinearGradient
          colors={['#3D9DFF', '#1668E3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Bottom bar */}
      <View
        style={[
          styles.bottomNav,
          { paddingBottom: Math.max(insets.bottom, 12) + 6 },
        ]}
      >
        <LinearGradient
          colors={['rgba(18,24,46,0.92)', 'rgba(12,16,32,0.96)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.bottomNavBorder} />
        <View style={styles.bottomNavRow}>
          <TabButton
            icon="search"
            label="Search"
            isActive={showSearch}
            onPress={toggleSearch}
          />
          <TabButton
            icon="chatbubble-ellipses-outline"
            label="Chat"
            locked
            onPress={() => {}}
          />
          <TabButton
            icon="settings-outline"
            label="Settings"
            locked={clinicRole !== 'owner'}
            onPress={() => router.push('/clinic/settings')}
          />
          <TabButton
            icon="time-outline"
            label="Session"
            onPress={() => router.push('/clinic/create')}
          />
          <TabButton
            icon="person"
            label={patientsWord}
            isActive
            onPress={() => {}}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Background orbs
  bgOrbBlue: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(61,158,255,0.18)',
    top: -80,
    left: -100,
  },
  bgOrbViolet: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(139,92,246,0.18)',
    top: 220,
    right: -90,
  },
  bgOrbTeal: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(52,221,176,0.14)',
    bottom: 160,
    left: -80,
  },

  listContent: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 200,
  },

  // Hero
  hero: {
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    shadowColor: '#5546FF',
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 12,
  },
  heroOrbOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -70,
    right: -50,
  },
  heroOrbTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(139,92,246,0.22)',
    bottom: -50,
    left: -40,
  },
  heroHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  heroTopRow: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  frostedIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  identityTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.17)',
    borderColor: 'rgba(255,255,255,0.34)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  identityImage: {
    width: '100%',
    height: '100%',
  },
  identityEmoji: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'center',
  },
  identityText: {
    flex: 1,
  },
  clinicTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  clinicTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
  },
  clinicMeta: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'left',
    writingDirection: 'ltr',
  },

  // Search
  searchBar: {
    marginTop: 16,
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    color: '#0F1730',
    fontSize: 15,
    fontWeight: '500',
    padding: 0,
  },

  // Section
  sectionRow: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    color: '#1B2542',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(46,107,224,0.12)',
  },
  countText: {
    color: '#2E6BE0',
    fontSize: 11.5,
    fontWeight: '700',
  },

  // Patient cards
  patientRow: {
    justifyContent: 'flex-start',
  },
  patientCard: {
    width: CARD_WIDTH,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: GRID_GAP,
    backgroundColor: 'rgba(16,18,38,0.34)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
  },
  avatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    marginBottom: 8,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  patientName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 15,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 70,
    paddingHorizontal: 24,
    gap: 14,
  },
  emptyBadgeWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 999,
    backgroundColor: 'rgba(110,91,255,0.18)',
  },
  emptyBadge: {
    width: 104,
    height: 104,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.06)',
    shadowColor: '#1B2542',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.12,
    shadowRadius: 22,
    elevation: 8,
  },
  emptyBadgeInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#5546FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 12,
    elevation: 6,
  },
  emptyTitle: {
    color: '#1B2542',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  emptySubtitle: {
    color: '#7A879E',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    maxWidth: 280,
  },

  // FAB
  fabWrap: {
    position: 'absolute',
    right: 20,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1668E3',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },

  // Bottom nav
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    overflow: 'hidden',
  },
  bottomNavBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  bottomNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    gap: 5,
    minWidth: 56,
  },
  tabIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconCircleActive: {
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#1668E3',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabLockBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(91,107,130,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(18,24,46,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
