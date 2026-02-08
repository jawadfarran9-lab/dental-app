import { CameraToolsSide, ContentType, useStorySettings } from '@/src/context/StorySettingsContext';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Linking,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function StorySettingsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { settings, updateSettings } = useStorySettings();

  // Local state initialized from context
  const [defaultFrontCamera, setDefaultFrontCamera] = useState(settings.defaultFrontCamera);
  const [cameraToolsSide, setCameraToolsSide] = useState<CameraToolsSide>(settings.cameraToolsSide);
  const [allowCameraRollAccess, setAllowCameraRollAccess] = useState(settings.allowCameraRollAccess);
  const [contentType, setContentType] = useState<ContentType>(settings.contentType);

  // Sync local state with context when settings change externally
  useEffect(() => {
    setDefaultFrontCamera(settings.defaultFrontCamera);
    setCameraToolsSide(settings.cameraToolsSide);
    setAllowCameraRollAccess(settings.allowCameraRollAccess);
    setContentType(settings.contentType);
  }, [settings]);

  const handleDone = () => {
    // Save all settings to context before navigating back
    updateSettings({
      defaultFrontCamera,
      cameraToolsSide,
      allowCameraRollAccess,
      contentType,
    });
    router.back();
  };

  const handleCameraRollToggle = (value: boolean) => {
    if (!value) {
      setAllowCameraRollAccess(false);
    } else {
      Linking.openSettings();
      setAllowCameraRollAccess(true);
    }
  };

  // Content Type Selector with icons (Instagram style)
  const renderContentTypeSelector = () => (
    <View style={[styles.contentTypeContainer, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' }]}>
      <TouchableOpacity
        style={[
          styles.contentTypeOption,
          contentType === 'story' && styles.contentTypeOptionSelected,
          { borderColor: contentType === 'story' ? (isDark ? '#0A84FF' : '#007AFF') : 'transparent' },
        ]}
        onPress={() => setContentType('story')}
        activeOpacity={0.7}
      >
        <View style={[
          styles.contentTypeIconWrapper,
          { backgroundColor: contentType === 'story' 
            ? (isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)') 
            : (isDark ? '#2C2C2E' : '#F2F2F7') 
          }
        ]}>
          <Ionicons 
            name="add-circle-outline" 
            size={28} 
            color={contentType === 'story' ? (isDark ? '#0A84FF' : '#007AFF') : (isDark ? '#8E8E93' : '#6B7280')} 
          />
        </View>
        <Text style={[
          styles.contentTypeLabel,
          { color: contentType === 'story' ? (isDark ? '#0A84FF' : '#007AFF') : colors.textPrimary }
        ]}>
          Story
        </Text>
        {contentType === 'story' && (
          <View style={[styles.checkmarkBadge, { backgroundColor: isDark ? '#0A84FF' : '#007AFF' }]}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.contentTypeOption,
          contentType === 'reels' && styles.contentTypeOptionSelected,
          { borderColor: contentType === 'reels' ? (isDark ? '#0A84FF' : '#007AFF') : 'transparent' },
        ]}
        onPress={() => setContentType('reels')}
        activeOpacity={0.7}
      >
        <View style={[
          styles.contentTypeIconWrapper,
          { backgroundColor: contentType === 'reels' 
            ? (isDark ? 'rgba(10, 132, 255, 0.15)' : 'rgba(0, 122, 255, 0.1)') 
            : (isDark ? '#2C2C2E' : '#F2F2F7') 
          }
        ]}>
          <Ionicons 
            name="film-outline" 
            size={28} 
            color={contentType === 'reels' ? (isDark ? '#0A84FF' : '#007AFF') : (isDark ? '#8E8E93' : '#6B7280')} 
          />
        </View>
        <Text style={[
          styles.contentTypeLabel,
          { color: contentType === 'reels' ? (isDark ? '#0A84FF' : '#007AFF') : colors.textPrimary }
        ]}>
          Reels
        </Text>
        {contentType === 'reels' && (
          <View style={[styles.checkmarkBadge, { backgroundColor: isDark ? '#0A84FF' : '#007AFF' }]}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  // Section Header
  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: isDark ? '#8E8E93' : '#6B7280' }]}>
      {title}
    </Text>
  );

  // Toggle Row
  const renderToggleRow = (
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
    subtitle?: string,
    isLast?: boolean
  ) => (
    <View style={[
      styles.settingRow,
      { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
      !isLast && styles.settingRowWithBorder,
      !isLast && { borderBottomColor: isDark ? '#38383A' : '#E5E5EA' },
    ]}>
      <View style={styles.settingLabelContainer}>
        <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: isDark ? '#8E8E93' : '#6B7280' }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: isDark ? '#39393D' : '#E5E5EA', true: '#34C759' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor={isDark ? '#39393D' : '#E5E5EA'}
      />
    </View>
  );

  // Segmented Control Row
  const renderSegmentedRow = (
    label: string,
    options: { value: string; label: string }[],
    selectedValue: string,
    onSelect: (value: string) => void,
    isLast?: boolean
  ) => (
    <View style={[
      styles.settingRow,
      styles.segmentedRow,
      { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
      !isLast && styles.settingRowWithBorder,
      !isLast && { borderBottomColor: isDark ? '#38383A' : '#E5E5EA' },
    ]}>
      <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>{label}</Text>
      <View style={[styles.segmentedControl, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.segmentedButton,
                isSelected && styles.segmentedButtonSelected,
                isSelected && { backgroundColor: isDark ? '#636366' : '#FFFFFF' },
              ]}
              onPress={() => onSelect(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.segmentedButtonText,
                  { color: isSelected ? colors.textPrimary : (isDark ? '#8E8E93' : '#6B7280') },
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? '#38383A' : '#E5E5EA' }]}>
        <View style={styles.headerLeft} />
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Camera settings
        </Text>
        <TouchableOpacity style={styles.headerRight} onPress={handleDone} activeOpacity={0.7}>
          <Text style={[styles.doneButton, { color: isDark ? '#0A84FF' : '#007AFF' }]}>
            Done
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Content Type Section - First */}
        {renderContentTypeSelector()}

        {/* Controls Section */}
        {renderSectionHeader('Controls')}
        <View style={styles.section}>
          {renderToggleRow('Default to front camera', defaultFrontCamera, setDefaultFrontCamera, undefined, false)}
          {renderSegmentedRow(
            'Camera tools',
            [
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ],
            cameraToolsSide,
            (value) => setCameraToolsSide(value as CameraToolsSide),
            true
          )}
        </View>

        {/* Camera Roll Section */}
        {renderSectionHeader('Camera roll')}
        <View style={styles.section}>
          {renderToggleRow(
            'Allow access',
            allowCameraRollAccess,
            handleCameraRollToggle,
            'Enable to add photos from your library',
            true
          )}
        </View>

        {/* Footer spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    width: 50,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    width: 50,
    alignItems: 'flex-end',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },

  // Content Type Selector
  contentTypeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  contentTypeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    position: 'relative',
  },
  contentTypeOptionSelected: {
    // Border color set dynamically
  },
  contentTypeIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  contentTypeLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  checkmarkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Section
  sectionHeader: {
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  section: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Setting Row
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
  segmentedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

  // Segmented Control
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  segmentedButton: {
    paddingHorizontal: 16,
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
