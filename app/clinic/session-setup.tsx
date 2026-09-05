import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { DENTAL_SESSIONS, type DentalSession } from '@/src/constants/sessions/dentalSessions';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#1668E3';
const SAVE_GREEN = '#10B981';
const RENAME_RED = '#C2463F';
const RENAME_BG = '#FDEFF0';

export default function SessionSetupScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { name: patientName, slug, sessionName } = useLocalSearchParams<{
    patientId?: string;
    name?: string;
    slug: string;
    sessionName?: string;
  }>();

  const initial =
    DENTAL_SESSIONS.find((s) => s.slug === slug) ?? DENTAL_SESSIONS[0];
  const [selected, setSelected] = useState<DentalSession>(initial);
  const [name, setName] = useState<string>(sessionName ?? initial.name);
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    const s = DENTAL_SESSIONS.find((x) => x.slug === slug);
    if (s) {
      setSelected(s);
      setName(sessionName ?? s.name);
    }
  }, [slug, sessionName]);

  const textPrimary = colors.textPrimary;
  const textSecondary = colors.textSecondary;
  const muted = colors.textTertiary;
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF';
  const cardBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27, 37, 66, 0.08)';
  const dividerColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(27, 37, 66, 0.08)';
  const dashedBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(27, 37, 66, 0.18)';
  const indicatorBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(27, 37, 66, 0.06)';

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };

  const openSwitcher = () => setSwitcherOpen(true);
  const closeSwitcher = () => setSwitcherOpen(false);

  const pickSession = (item: DentalSession) => {
    setSelected(item);
    setName(item.name);
    setMode('view');
    setSwitcherOpen(false);
  };

  const startRename = () => {
    setMode('edit');
    setName('');
  };

  const saveRename = () => {
    setMode('view');
    if (!name.trim()) setName(selected.name);
  };

  const resetRename = () => {
    setMode('view');
    setName(selected.name);
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />

      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.headerBtn,
            { backgroundColor: pressed ? backBgPressed : backBg },
          ]}
        >
          <Ionicons name="chevron-back" size={22} color={backIconColor} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: textPrimary }]}>New Session</Text>
          {patientName ? (
            <Text style={[styles.headerSubtitle, { color: muted }]}>
              for {patientName}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 6,
          paddingBottom: insets.bottom + 24,
          gap: 18,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: mode === 'edit' ? ACCENT : cardBorder,
              borderWidth: mode === 'edit' ? 1.5 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          {mode === 'view' ? (
            <Pressable
              onPress={openSwitcher}
              style={({ pressed }) => (pressed ? { opacity: 0.85 } : null)}
            >
              <View style={styles.eyebrowRow}>
                <Text style={[styles.eyebrow, { color: muted }]}>SESSION NAME</Text>
                <View style={[styles.indicator, { backgroundColor: indicatorBg }]}>
                  <Ionicons name="chevron-down" size={14} color={muted} />
                </View>
              </View>
              <View style={styles.nameRow}>
                <Image
                  source={selected.image}
                  style={{ width: 44, height: 44, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <Text
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  style={{ flex: 1, fontSize: 19, fontWeight: '800', color: textPrimary }}
                >
                  {name || selected.name}
                </Text>
              </View>
            </Pressable>
          ) : (
            <>
              <View style={styles.eyebrowRow}>
                <Text style={[styles.eyebrow, { color: muted }]}>SESSION NAME</Text>
                <View style={[styles.indicator, { backgroundColor: indicatorBg }]}>
                  <Ionicons name="chevron-down" size={14} color={muted} />
                </View>
              </View>
              <View style={styles.nameRow}>
                <Image
                  source={selected.image}
                  style={{ width: 44, height: 44, borderRadius: 12 }}
                  resizeMode="cover"
                />
                <TextInput
                  autoFocus
                  value={name}
                  onChangeText={setName}
                  placeholder="Session name"
                  placeholderTextColor={muted}
                  style={{
                    flex: 1,
                    fontSize: 19,
                    fontWeight: '800',
                    color: textPrimary,
                    paddingVertical: 0,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={saveRename}
                />
              </View>
            </>
          )}

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          <View style={styles.actionRow}>
            {mode === 'view' ? (
              <Pressable
                onPress={startRename}
                style={({ pressed }) => [
                  styles.pill,
                  { backgroundColor: RENAME_BG, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name="create-outline" size={13} color={RENAME_RED} />
                <Text style={[styles.pillText, { color: RENAME_RED }]}>Rename</Text>
              </Pressable>
            ) : (
              <>
                <Pressable
                  onPress={saveRename}
                  style={({ pressed }) => [
                    styles.pill,
                    { backgroundColor: '#E8F8F1', opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="checkmark" size={14} color={SAVE_GREEN} />
                  <Text style={[styles.pillText, { color: SAVE_GREEN }]}>Save</Text>
                </Pressable>
                <Pressable
                  onPress={resetRename}
                  style={({ pressed }) => [
                    styles.pill,
                    { backgroundColor: indicatorBg, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="refresh" size={13} color={textSecondary} />
                  <Text style={[styles.pillText, { color: textSecondary }]}>Reset</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {/* Placeholder section */}
        <View>
          <Text style={[styles.sectionEyebrow, { color: muted }]}>HOW IT'S PERFORMED</Text>
          <View
            style={[
              styles.placeholder,
              { borderColor: dashedBorder, backgroundColor: 'transparent' },
            ]}
          >
            <View style={[styles.placeholderIcon, { backgroundColor: indicatorBg }]}>
              <Ionicons name="construct-outline" size={18} color={muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.placeholderTitle, { color: textPrimary }]}>
                Coming next
              </Text>
              <Text style={[styles.placeholderSub, { color: muted }]}>
                We'll design this section together in Stage 2.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Switcher modal */}
      <Modal
        transparent
        animationType="slide"
        visible={switcherOpen}
        onRequestClose={closeSwitcher}
      >
        <Pressable style={styles.dim} onPress={closeSwitcher}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom + 12 }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.grabHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose a session</Text>
              <Pressable
                onPress={closeSwitcher}
                style={({ pressed }) => [
                  styles.sheetClose,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Ionicons name="close" size={20} color="#1B2542" />
              </Pressable>
            </View>
            <ScrollView
              style={{ maxHeight: '100%' }}
              contentContainerStyle={{ paddingVertical: 4 }}
              showsVerticalScrollIndicator={false}
            >
              {DENTAL_SESSIONS.map((item) => {
                const isSelected = item.slug === selected.slug;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => pickSession(item)}
                    style={({ pressed }) => [
                      styles.sheetRow,
                      isSelected && styles.sheetRowSelected,
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Image
                      source={item.image}
                      style={{ width: 38, height: 38, borderRadius: 10 }}
                      resizeMode="cover"
                    />
                    <Text style={styles.sheetRowText} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {isSelected ? (
                      <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerBtn: {
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
  headerText: { flex: 1, paddingTop: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 13, marginTop: 2, fontWeight: '600' },

  card: {
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  indicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
  },
  pillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  placeholderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTitle: { fontSize: 14, fontWeight: '800' },
  placeholderSub: { fontSize: 12.5, marginTop: 2 },

  dim: {
    flex: 1,
    backgroundColor: 'rgba(12,20,34,0.42)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    maxHeight: '76%',
  },
  grabHandle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(27, 37, 66, 0.15)',
    marginBottom: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 4,
  },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: '#1B2542' },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(27, 37, 66, 0.06)',
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 14,
  },
  sheetRowSelected: {
    backgroundColor: 'rgba(22, 104, 227, 0.08)',
  },
  sheetRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1B2542',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
  },
});
