import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { DENTAL_SESSIONS, type DentalSession } from '@/src/constants/sessions/dentalSessions';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function SessionTile({
  item,
  tileW,
  tileH,
  onPress,
}: {
  item: DentalSession;
  tileW: number;
  tileH: number;
  onPress: (item: DentalSession) => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress(item);
      }}
      style={({ pressed }) => [
        {
          width: tileW,
          height: tileH,
          borderRadius: 20,
          overflow: 'hidden',
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <Image
        source={item.image}
        style={{ width: tileW, height: tileH }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.scrim}
      />
      <Text style={styles.tileName} numberOfLines={2} ellipsizeMode="tail">
        {item.name}
      </Text>
    </Pressable>
  );
}

export default function SessionsDentalScreen() {
  useClinicGuard();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { patientId, name: patientName } = useLocalSearchParams<{
    patientId?: string;
    name?: string;
  }>();
  const { width: WIN_W } = useWindowDimensions();

  const GRID_PADDING = 16;
  const GRID_GAP = 12;
  const TILE_ASPECT = 0.8;
  const TILE_W = Math.floor((WIN_W - GRID_PADDING * 2 - GRID_GAP) / 2);
  const TILE_H = Math.round(TILE_W / TILE_ASPECT);

  const textPrimary = colors.textPrimary;
  const textMuted = colors.textTertiary;
  const backBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.92)';
  const backBgPressed = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(27, 37, 66, 0.1)';
  const backIconColor = isDark ? '#FFFFFF' : '#1B2542';

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/clinic/dashboard' as any);
  };

  const openSession = useCallback((s: DentalSession) => {
    const qs = new URLSearchParams();
    if (patientId) qs.set('patientId', patientId);
    if (patientName) qs.set('name', patientName);
    qs.set('slug', s.slug);
    qs.set('sessionName', s.name);
    router.push(`/clinic/session-setup?${qs.toString()}` as any);
  }, [router, patientId, patientName]);

  const renderTile = ({ item }: { item: DentalSession; index: number }) => {
    return <SessionTile item={item} tileW={TILE_W} tileH={TILE_H} onPress={openSession} />;
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
          <Text style={[styles.headerTitle, { color: textPrimary }]}>Sessions</Text>
          <Text style={[styles.headerSubtitle, { color: textMuted }]}>
            {DENTAL_SESSIONS.length} sessions
          </Text>
        </View>
      </View>

      <FlatList
        data={DENTAL_SESSIONS}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: GRID_GAP, paddingHorizontal: GRID_PADDING }}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        contentContainerStyle={{ paddingTop: 6, paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        initialNumToRender={8}
        windowSize={7}
        renderItem={renderTile}
      />
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
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  tileName: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 19,
    textAlign: 'left',
    writingDirection: 'ltr',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
});
