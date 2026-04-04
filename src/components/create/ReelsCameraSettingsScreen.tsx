import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { type CameraToolsSide, useStorySettings } from '@/src/context/StorySettingsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { useCameraRollPermission } from '@/src/hooks/useCameraRollPermission';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

/**
 * Reels Camera Settings — shares camera controls with Story Settings
 * via StorySettingsContext. Premium gradient background with floating cards.
 */
export default function ReelsCameraSettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { settings, updateSettings } = useStorySettings();
  const { granted: cameraRollGranted, toggle: toggleCameraRoll } = useCameraRollPermission();

  const { defaultFrontCamera, cameraToolsSide } = settings;

  const handleDone = () => {
    router.back();
  };

  // ── Section Header ────────────────────────────────────────────
  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: colors.textTertiary }]}>
      {title}
    </Text>
  );

  // ── Mode Row (Story / Reels) ─────────────────────────────────
  const renderModeRow = (
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    onPress?: () => void,
    isLast?: boolean,
  ) => (
    <TouchableOpacity
      activeOpacity={onPress ? 0.6 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.settingRow,
        !isLast && styles.settingRowWithBorder,
        !isLast && { borderBottomColor: colors.borderSoft },
      ]}
    >
      <View style={styles.modeRowLeft}>
        <View style={[styles.modeIconWrap, { backgroundColor: isDark ? colors.chipInactive : colors.rowHighlightActive }]}>
          <Ionicons name={icon} size={20} color={colors.brandBlue} />
        </View>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      {onPress && <Ionicons name="chevron-forward" size={18} color={colors.sheetChevron} />}
    </TouchableOpacity>
  );

  // ── Toggle Row ────────────────────────────────────────────────
  const renderToggleRow = (
    label: string,
    value: boolean,
    onValueChange: (v: boolean) => void,
    subtitle?: string,
    isLast?: boolean,
  ) => (
    <View
      style={[
        styles.settingRow,
        !isLast && styles.settingRowWithBorder,
        !isLast && { borderBottomColor: colors.borderSoft },
      ]}
    >
      <View style={styles.settingLabelContainer}>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: colors.textTertiary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.toggleTrackOff, true: '#34C759' }}
        thumbColor={colors.toggleThumb}
        ios_backgroundColor={colors.toggleTrackOff}
      />
    </View>
  );

  // ── Segmented Control Row ─────────────────────────────────────
  const renderSegmentedRow = (
    label: string,
    options: { value: string; label: string }[],
    selectedValue: string,
    onSelect: (v: string) => void,
    isLast?: boolean,
  ) => (
    <View
      style={[
        styles.settingRow,
        styles.segmentedRow,
        !isLast && styles.settingRowWithBorder,
        !isLast && { borderBottomColor: colors.borderSoft },
      ]}
    >
      <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={[styles.segmentedControl, { backgroundColor: colors.sheetCancelBg }]}>
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.segmentedButton,
                isSelected && styles.segmentedButtonSelected,
                isSelected && { backgroundColor: colors.sheetSurface },
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentedButtonText,
                  { color: isSelected ? colors.textPrimary : colors.textTertiary },
                  isSelected && styles.segmentedButtonTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const cardBg = isDark ? '#1C1C1E' : 'rgba(255,255,255,0.78)';

  return (
    <View style={styles.root}>
      <PremiumGradientBackground isDark={isDark} showSparkles={false} />

      {/* Soft top glow overlay */}
      {!isDark && (
        <LinearGradient
          colors={['rgba(186,230,253,0.35)', 'rgba(186,230,253,0.12)', 'transparent'] as const}
          locations={[0, 0.4, 1] as const}
          style={styles.topGlow}
          pointerEvents="none"
        />
      )}

      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* ── Header ──────────────────────────────────────────── */}
        <View style={[styles.header, { borderBottomColor: colors.borderSoft }]}>
          <View style={styles.headerLeft} />
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Camera settings</Text>
          <TouchableOpacity style={styles.headerRight} onPress={handleDone} activeOpacity={0.7}>
            <Text style={[styles.doneButton, { color: colors.brandBlue }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* ── Modes Section ───────────────────────────────── */}
          {renderSectionHeader('Modes')}
          <View style={[styles.section, styles.card, { backgroundColor: cardBg }]}>
            {renderModeRow('add-circle-outline', 'Story', () => router.push('/settings/story-settings' as any))}
            {renderModeRow('film-outline', 'Reels', undefined, true)}
          </View>

          {/* ── Controls Section ────────────────────────────── */}
          {renderSectionHeader('Controls')}
          <View style={[styles.section, styles.card, { backgroundColor: cardBg }]}>
            {renderToggleRow('Default to front camera', defaultFrontCamera, (v) => updateSettings({ defaultFrontCamera: v }))}
            {renderSegmentedRow(
              'Camera tools',
              [
                { value: 'left', label: 'Left side' },
                { value: 'right', label: 'Right side' },
              ],
              cameraToolsSide,
              (v) => updateSettings({ cameraToolsSide: v as CameraToolsSide }),
              true,
            )}
          </View>

          {/* ── Camera Access Section ─────────────────────────── */}
          {renderSectionHeader('Camera Access')}
          <View style={[styles.section, styles.card, { backgroundColor: cardBg }]}>
            {renderToggleRow(
              'Allow access',
              cameraRollGranted,
              toggleCameraRoll,
              'Enable to add photos and videos from your library',
              true,
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 220,
    zIndex: 0,
  },
  container: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    width: 50,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
  },
  doneButton: {
    fontSize: 17,
    fontWeight: '600',
  },

  // ── Content ─────────────────────────────────────────────────
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },

  // ── Section + Card ──────────────────────────────────────────
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
    letterSpacing: 0.3,
  },
  section: {
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  card: {
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },

  // ── Setting Row ─────────────────────────────────────────────
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  settingRowWithBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  // ── Mode Row ────────────────────────────────────────────────
  modeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Segmented Control ───────────────────────────────────────
  segmentedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segmentedButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  segmentedButtonSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  segmentedButtonTextSelected: {
    fontWeight: '600',
  },
});
