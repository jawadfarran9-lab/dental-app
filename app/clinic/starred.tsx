import { db } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, deleteField, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StarredMsg = {
  id: string;
  from: 'patient' | 'clinic';
  text: string;
  type?: 'image';
  imageUrl?: string;
  createdAt?: any;
  starredClinic?: boolean;
};

function formatStarredTime(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${h}:${m} ${ampm}`;
}

export default function StarredScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { patientId, name } = useLocalSearchParams<{ patientId: string; name?: string }>();
  const patientName = (name as string) || 'Patient';
  const [items, setItems] = useState<StarredMsg[]>([]);

  const textPrimary = isDark ? '#F2F5FB' : '#1B2542';
  const textSecondary = isDark ? '#9AA6BE' : '#5A6785';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    if (!patientId) return;
    const qy = query(collection(db, `patients/${patientId}/messages`), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const starred = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((m) => m.starredClinic === true)
          .reverse();
        setItems(starred as StarredMsg[]);
      },
      (e) => console.error('[starred] sub error', e),
    );
    return () => unsub();
  }, [patientId]);

  const unstar = async (id: string) => {
    if (!patientId) return;
    try {
      await updateDoc(doc(db, `patients/${patientId}/messages/${id}`), { starredClinic: deleteField() });
    } catch (e) {
      console.error('[starred] unstar error', e);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <PremiumGradientBackground isDark={isDark} showSparkles={!isDark} />
      <View style={{ flex: 1, paddingTop: insets.top + 6 }}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: isDark ? '#1D2233' : '#FFFFFF' }]} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={textPrimary} />
          </Pressable>
          <View>
            <Text style={[styles.title, { color: textPrimary }]}>Starred</Text>
            <Text style={[styles.subtitle, { color: textSecondary }]}>{patientName}</Text>
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="star-outline" size={46} color={textSecondary} />
            <Text style={[styles.emptyText, { color: textSecondary }]}>No starred messages yet</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.cardHead}>
                  <Text style={[styles.sender, { color: textPrimary }]}>{item.from === 'clinic' ? 'You' : patientName}</Text>
                  <Pressable onPress={() => unstar(item.id)} hitSlop={8}>
                    <Ionicons name="star" size={18} color="#F5A623" />
                  </Pressable>
                </View>
                {item.type === 'image' && item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <Text style={[styles.body, { color: textPrimary }]}>{item.text}</Text>
                )}
                <Text style={[styles.time, { color: textSecondary }]}>{formatStarredTime(item.createdAt)}</Text>
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  title: { fontSize: 21, fontWeight: '800' },
  subtitle: { fontSize: 13, fontWeight: '600', marginTop: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingBottom: 80 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  card: { borderRadius: 22, padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sender: { fontSize: 15, fontWeight: '800' },
  body: { fontSize: 15, lineHeight: 21 },
  thumb: { width: '100%', height: 180, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.05)' },
  time: { fontSize: 12, marginTop: 8 },
});
