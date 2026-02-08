import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const games = ['Bubble Pop', 'Color Match', 'Shape Rush'];
const stories = ['The Brave Tooth', 'Sparkle and the Brush', 'Captain Smile'];
const videos = ['Animal Lullabies', 'Space Journey', 'Ocean Friends'];

export default function KidsCorner() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {t('kids.title') || 'Kids Corner'}
        </Text>
        <TouchableOpacity onPress={() => router.replace('/')}
          style={[styles.exitBtn, { borderColor: colors.cardBorder }]}
        >
          <Ionicons name="exit-outline" size={18} color={colors.textPrimary} />
          <Text style={[styles.exitText, { color: colors.textPrimary }]}>
            {t('common.exit') || 'Exit'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        {t('kids.subtitle') || 'Safe fun while you wait. No login. No data.'}
      </Text>

      <Section title={t('kids.games') || 'Mini Games'} items={games} colors={colors} isDark={isDark} icon="game-controller-outline" />
      <Section title={t('kids.stories') || 'Short Stories'} items={stories} colors={colors} isDark={isDark} icon="book-outline" />
      <Section title={t('kids.videos') || 'Kid-Safe Videos'} items={videos} colors={colors} isDark={isDark} icon="play-circle-outline" />
    </ScrollView>
  );
}

function Section({ title, items, colors, isDark, icon }: { title: string; items: string[]; colors: any; isDark: boolean; icon: any; }) {
  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={colors.textPrimary} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {items.map((item) => (
        <View key={item} style={[styles.itemRow, { borderColor: colors.cardBorder }]}>          
          <Text style={[styles.itemText, { color: colors.textPrimary }]}>{item}</Text>
          <Ionicons name="sparkles" size={18} color={isDark ? '#FBBF24' : '#D97706'} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 14, marginBottom: 16 },
  exitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1 },
  exitText: { fontWeight: '700', fontSize: 13 },
  section: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  itemText: { fontSize: 14, fontWeight: '600' },
});
