import { useTheme } from '@/src/context/ThemeContext';
import { useClinicPreferences } from '@/src/hooks/useClinicPreferences';
import { ClinicPreferences } from '@/src/services/clinicPreferencesService';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

type ToggleItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  key: keyof Omit<ClinicPreferences, 'updatedAt'>;
};

const ITEMS: ToggleItem[] = [
  { label: 'Allow Sharing to Stories', icon: 'share-outline', description: 'Let others share your posts to their stories', key: 'allowStorySharing' },
  { label: 'Allow Reposting', icon: 'repeat-outline', description: 'Let others repost your content', key: 'allowReposting' },
  { label: 'Share to Other Apps', icon: 'apps-outline', description: 'Automatically share new posts to connected apps', key: 'shareToOtherApps' },
  { label: 'Shareable Link', icon: 'link-outline', description: 'Allow others to share a link to your profile', key: 'shareableLink' },
];

export default function SharingScreen() {
  const { colors, isDark } = useTheme();
  const { settings, loading, updateSetting } = useClinicPreferences();

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={isDark ? '#64748B' : '#94A3B8'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.sectionHeader, { color: isDark ? '#8A96A6' : '#64748B' }]}>
          Control how your content can be shared
        </Text>
        {ITEMS.map((item, idx) => (
          <View
            key={item.key}
            style={[
              styles.row,
              {
                borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                borderBottomWidth: idx < ITEMS.length - 1 ? StyleSheet.hairlineWidth : 0,
              },
            ]}
          >
            <Ionicons name={item.icon} size={22} color={isDark ? '#B0BEC5' : '#546E7A'} style={styles.icon} />
            <View style={styles.textWrap}>
              <Text style={[styles.label, { color: colors.textPrimary }]}>{item.label}</Text>
              <Text style={[styles.description, { color: isDark ? '#8A96A6' : '#94A3B8' }]}>{item.description}</Text>
            </View>
            <Switch
              value={!!settings[item.key]}
              onValueChange={(v) => updateSetting(item.key, v)}
              trackColor={{ false: isDark ? '#3A3F47' : '#D1D5DB', true: '#3D9EFF' }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  content: { paddingVertical: 12 },
  sectionHeader: { fontSize: 13, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, minHeight: 52 },
  icon: { marginRight: 14, width: 24, textAlign: 'center' },
  textWrap: { flex: 1, marginRight: 12 },
  label: { fontSize: 16, fontWeight: '400', marginBottom: 3 },
  description: { fontSize: 13, lineHeight: 18 },
});
