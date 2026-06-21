import { useTheme } from '@/src/context/ThemeContext';
import { useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SettingsRow {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconColor: string;
  hasSoon?: boolean;
}

interface SettingsSection {
  title: string;
  rows: SettingsRow[];
}

export default function ClinicSettingsScreen() {
  useClinicRoleGuard(['owner']);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/clinic/dashboard' as any);
    }
  };

  const sections: SettingsSection[] = [
    {
      title: 'SUBSCRIPTION',
      rows: [
        {
          id: 'upgrade-subscription',
          title: 'Upgrade subscription',
          subtitle: 'Change plan or add AI Pro',
          icon: 'star',
          iconColor: '#F5A300',
        },
        {
          id: 'cancel-subscription',
          title: 'Cancel subscription',
          subtitle: 'End or pause your plan',
          icon: 'close-circle-outline',
          iconColor: '#F43F5E',
        },
      ],
    },
    {
      title: 'CLINIC PROFILE',
      rows: [
        {
          id: 'clinic-details',
          title: 'Clinic details',
          subtitle: 'Name, phone, email & more',
          icon: 'business-outline',
          iconColor: '#2E5BFF',
        },
        {
          id: 'clinic-profile-photo',
          title: 'Clinic profile photo',
          subtitle: "Your clinic's profile picture",
          icon: 'image-outline',
          iconColor: '#8B5CF6',
        },
        {
          id: 'clinic-location',
          title: 'Clinic location',
          subtitle: 'Update your address on the map',
          icon: 'location-outline',
          iconColor: '#0EA37A',
        },
        {
          id: 'working-hours',
          title: 'Working hours',
          subtitle: 'Set days and opening times',
          icon: 'time-outline',
          iconColor: '#4F46E5',
        },
        {
          id: 'clinic-status',
          title: 'Clinic status',
          subtitle: 'Open or close your clinic',
          icon: 'power-outline',
          iconColor: '#10B981',
        },
      ],
    },
    {
      title: 'MANAGEMENT',
      rows: [
        {
          id: 'patient-form-fields',
          title: 'Patient form fields',
          subtitle: 'Choose what you collect for new patients',
          icon: 'list-outline',
          iconColor: '#06B6D4',
        },
        {
          id: 'doctor-email',
          title: 'Doctors',
          subtitle: 'Add and manage your doctors',
          icon: 'people-outline',
          iconColor: '#EC4899',
        },
      ],
    },
  ];

  const bgColor = isDark ? '#0B0F1A' : '#F4F8FF';
  const bgGradient: [string, ...string[]] = isDark
    ? ['#0B0F1A', '#0F1428']
    : ['#F4F8FF', '#EEF3FE', '#F6F9FF'];

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={bgGradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12, paddingBottom: 16 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backButton,
            {
              backgroundColor: pressed
                ? isDark
                  ? 'rgba(255, 255, 255, 0.15)'
                  : 'rgba(27, 37, 66, 0.1)'
                : isDark
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'rgba(255, 255, 255, 0.92)',
            },
          ]}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={isDark ? '#FFFFFF' : '#1B2542'}
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#1B2542' }]}>
            Settings
          </Text>
          <Text style={[styles.headerSubtitle, { color: isDark ? '#9AA8BE' : '#5B6B82' }]}>
            Manage your clinic
          </Text>
        </View>

        <LinearGradient
          colors={['#2E5BFF', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarGradient}
        >
          <Ionicons name="business" size={22} color="#FFFFFF" />
        </LinearGradient>
      </View>

      {/* Sections */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section) => (
          <View key={section.title} style={styles.sectionWrapper}>
            <Text
              style={[
                styles.sectionEyebrow,
                { color: isDark ? '#5B6B82' : '#5B6B82' },
              ]}
            >
              {section.title}
            </Text>

            <View
              style={[
                styles.sectionCard,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#EEF2F8',
                },
              ]}
            >
              {section.rows.map((row, idx) => (
                <View key={row.id}>
                  {idx > 0 && (
                    <View
                      style={[
                        styles.rowDivider,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : '#EEF2F8',
                        },
                      ]}
                    />
                  )}

                  <Pressable
                    onPress={() => {
                      if (row.id === 'upgrade-subscription') router.push('/clinic/upgrade');
                      else if (row.id === 'cancel-subscription') router.push('/clinic/cancel-subscription');
                      else if (row.id === 'clinic-details') router.push('/clinic/clinic-details');
                      else if (row.id === 'clinic-location') router.push('/clinic/clinic-location');
                      else if (row.id === 'working-hours') router.push('/clinic/working-hours');
                      else if (row.id === 'doctor-email') router.push('/clinic/team');
                    }}
                    style={({ pressed }) => [
                      styles.row,
                      {
                        backgroundColor: pressed
                          ? isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(100, 116, 139, 0.04)'
                          : 'transparent',
                      },
                    ]}
                  >
                    {/* Icon Tile */}
                    <View
                      style={[
                        styles.iconTile,
                        {
                          backgroundColor: row.iconColor + '21',
                        },
                      ]}
                    >
                      <Ionicons
                        name={row.icon as any}
                        size={20}
                        color={row.iconColor}
                      />
                    </View>

                    {/* Text */}
                    <View style={styles.rowText}>
                      <Text
                        style={[
                          styles.rowTitle,
                          { color: isDark ? '#FFFFFF' : '#1B2542' },
                        ]}
                      >
                        {row.title}
                      </Text>
                      <Text
                        style={[
                          styles.rowSubtitle,
                          { color: isDark ? '#9AA8BE' : '#5B6B82' },
                        ]}
                      >
                        {row.subtitle}
                      </Text>
                    </View>

                    {/* Right Element */}
                    {row.hasSoon ? (
                      <View
                        style={[
                          styles.soonPill,
                          {
                            backgroundColor: isDark
                              ? 'rgba(91, 107, 130, 0.2)'
                              : '#EEF2F8',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.soonText,
                            { color: isDark ? '#9AA8BE' : '#5B6B82' },
                          ]}
                        >
                          SOON
                        </Text>
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={isDark ? '#4B5563' : '#C3CDDC'}
                      />
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12.5,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 20,
  },
  sectionWrapper: {
    gap: 8,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  rowDivider: {
    height: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  iconTile: {
    width: 40,
    height: 40,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  soonPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  soonText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
});
