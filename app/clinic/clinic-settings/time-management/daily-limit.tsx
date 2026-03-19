import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicPreferences } from '@/src/hooks/useClinicPreferences';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Option = { label: string; minutes: number | null };

const OPTIONS: Option[] = [
  { label: '15 minutes', minutes: 15 },
  { label: '30 minutes', minutes: 30 },
  { label: '45 minutes', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: 'Off', minutes: null },
];

const STAGGER_DELAY = 30;

function AnimatedOptionRow({ opt, idx, total, isActive, colors, onPress }: { opt: Option; idx: number; total: number; isActive: boolean; colors: any; onPress: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, delay: idx * STAGGER_DELAY, useNativeDriver: true }).start();
    Animated.timing(translateY, { toValue: 0, duration: 250, delay: idx * STAGGER_DELAY, useNativeDriver: true }).start();
  }, []);

  const onPressIn = () => { Animated.timing(scaleAnim, { toValue: 0.97, duration: 120, useNativeDriver: true }).start(); };
  const onPressOut = () => { Animated.timing(scaleAnim, { toValue: 1, duration: 120, useNativeDriver: true }).start(); };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }, { scale: scaleAnim }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.row,
          isActive && { backgroundColor: colors.rowHighlightActive },
          pressed && !isActive && { opacity: 0.7, backgroundColor: colors.rowHighlight },
          {
            borderBottomColor: colors.borderTint,
            borderBottomWidth: idx < total - 1 ? StyleSheet.hairlineWidth : 0,
          },
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
      >
        <Text style={[styles.optionText, { color: colors.textPrimary }]}>
          {opt.label}
        </Text>
        {isActive && (
          <Ionicons name="checkmark" size={20} color={colors.brandBlue} />
        )}
      </Pressable>
    </Animated.View>
  );
}

export default function DailyLimitScreen() {
  const { colors, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const { settings, loading, updateSettings } = useClinicPreferences();

  const currentMinutes = settings.dailyLimitEnabled ? settings.dailyLimitMinutes : null;

  const handleSelect = (opt: Option) => {
    if (opt.minutes === null) {
      updateSettings({ dailyLimitEnabled: false, dailyLimitMinutes: null });
    } else {
      updateSettings({ dailyLimitEnabled: true, dailyLimitMinutes: opt.minutes });
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: 'transparent' }]}>
        <PremiumGradientBackground isDark={isDark} showSparkles={true} />
        <ActivityIndicator size="large" color={'#5A6B7C'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: 'transparent' }]}>
      <PremiumGradientBackground isDark={isDark} showSparkles={true} />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: headerHeight }]}>
        <Text style={[styles.description, { color: '#5A6B7C' }]}>
          Set a daily time limit reminder for app usage.
        </Text>

        {OPTIONS.map((opt, idx) => {
          const isActive = opt.minutes === currentMinutes;
          return (
            <AnimatedOptionRow
              key={opt.label}
              opt={opt}
              idx={idx}
              total={OPTIONS.length}
              isActive={isActive}
              colors={colors}
              onPress={() => handleSelect(opt)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingVertical: 8 },
  description: { fontSize: 14, paddingHorizontal: 20, paddingBottom: 16, lineHeight: 21 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    minHeight: 54,
  },
  optionText: { fontSize: 16, fontWeight: '500' },
});
