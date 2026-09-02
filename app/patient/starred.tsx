import { patientDb } from '@/firebaseConfig';
import { PremiumGradientBackground } from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { usePatientAuthReady } from '@/src/hooks/usePatientAuthReady';
import { requestFocusMessage } from '@/src/state/chatFocusSignal';
import { usePatientGuard } from '@/src/utils/navigationGuards';
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
  type?: 'image' | 'video' | 'audio' | 'album';
  imageUrl?: string;
  videoUrl?: string;
  posterUrl?: string | null;
  audioUrl?: string;
  durationMs?: number | null;
  waveform?: number[];
  media?: Array<{ kind?: 'image' | 'video'; url?: string; videoUrl?: string; posterUrl?: string | null; width?: number; height?: number; durationMs?: number }>;
  createdAt?: any;
  starredPatient?: boolean;
};

function formatAudioDuration(ms?: number | null): string {
  const s = Math.max(0, Math.round((ms ?? 0) / 1000));
  const mm = Math.floor(s / 60);
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

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

export default function PatientStarredScreen() {
  usePatientGuard();
  const patientAuthReady = usePatientAuthReady();
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { patientId } = useLocalSearchParams<{ patientId: string; clinicId?: string }>();
  const [items, setItems] = useState<StarredMsg[]>([]);

  const textPrimary = isDark ? '#F2F5FB' : '#1B2542';
  const textSecondary = isDark ? '#9AA6BE' : '#5A6785';
  const cardBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)';
  const cardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  useEffect(() => {
    if (!patientAuthReady) return;
    if (!patientId) return;
    const qy = query(collection(patientDb, `patients/${patientId}/messages`), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const starred = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((m) => m.starredPatient === true)
          .reverse();
        setItems(starred as StarredMsg[]);
      },
      (e) => console.error('[starred] sub error', e),
    );
    return () => unsub();
  }, [patientId, patientAuthReady]);

  const unstar = async (id: string) => {
    if (!patientId) return;
    try {
      await updateDoc(doc(patientDb, `patients/${patientId}/messages/${id}`), { starredPatient: deleteField() });
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
            <Text style={[styles.subtitle, { color: textSecondary }]}>Clinic</Text>
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
              <Pressable
                style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={() => {
                  requestFocusMessage(item.id);
                  const r = router as any;
                  if (typeof r.dismiss === 'function') {
                    try { r.dismiss(2); return; } catch {}
                  }
                  router.back();
                  requestAnimationFrame(() => router.back());
                }}
              >
                <View style={styles.cardHead}>
                  <Text style={[styles.sender, { color: textPrimary }]}>{item.from === 'patient' ? 'You' : 'Clinic'}</Text>
                  <Pressable onPress={(e) => { (e as any)?.stopPropagation?.(); unstar(item.id); }} hitSlop={8}>
                    <Ionicons name="star" size={18} color="#F5A623" />
                  </Pressable>
                </View>
                {item.type === 'album' && item.media && item.media.length > 0 ? (
                  (() => {
                    const preview = item.media!.slice(0, 3);
                    const extra = item.media!.length - 3;
                    return (
                      <View>
                        <View style={styles.albumRow}>
                          {preview.map((m, idx) => {
                            const isVideo = m.kind === 'video';
                            const uri = isVideo ? (m.posterUrl ?? m.url) : m.url;
                            const hasUri = typeof uri === 'string' && uri.length > 0;
                            const isLastSlot = idx === 2;
                            return (
                              <View key={idx} style={styles.albumSlot}>
                                {hasUri ? (
                                  <Image source={{ uri: uri as string }} style={styles.albumImg} resizeMode="cover" />
                                ) : (
                                  <View style={styles.albumPlaceholder}>
                                    <Ionicons name="videocam" size={22} color="#fff" />
                                  </View>
                                )}
                                {isVideo ? (
                                  <View style={styles.albumPlayBadge} pointerEvents="none">
                                    <Ionicons name="play" size={14} color="#fff" />
                                  </View>
                                ) : null}
                                {isLastSlot && extra > 0 ? (
                                  <View style={styles.albumMoreScrim} pointerEvents="none">
                                    <Text style={styles.albumMoreText}>{`+${extra}`}</Text>
                                  </View>
                                ) : null}
                              </View>
                            );
                          })}
                        </View>
                        {item.text ? (
                          <Text style={[styles.body, { color: textPrimary, marginTop: 8 }]}>{item.text}</Text>
                        ) : null}
                      </View>
                    );
                  })()
                ) : item.type === 'video' ? (
                  <View style={styles.videoWrap}>
                    {item.posterUrl ? (
                      <Image source={{ uri: item.posterUrl }} style={styles.thumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.thumb, styles.videoPlaceholder]}>
                        <Ionicons name="videocam" size={32} color="#fff" />
                      </View>
                    )}
                    <View style={styles.videoPlayBadge} pointerEvents="none">
                      <Ionicons name="play" size={22} color="#fff" />
                    </View>
                  </View>
                ) : item.type === 'audio' ? (
                  <View style={styles.audioRow}>
                    <View style={[styles.audioPlay, { borderColor: textPrimary }]}>
                      <Ionicons name="play" size={18} color={textPrimary} />
                    </View>
                    <View style={styles.audioWave}>
                      {(item.waveform && item.waveform.length > 0
                        ? (() => {
                            const src = item.waveform!;
                            const N = 28;
                            const step = Math.max(1, Math.floor(src.length / N));
                            const bars: number[] = [];
                            for (let i = 0; i < src.length && bars.length < N; i += step) bars.push(src[i]);
                            const max = Math.max(1, ...bars);
                            return bars.map((v, i) => (
                              <View
                                key={i}
                                style={[
                                  styles.audioBar,
                                  { height: Math.max(3, Math.round((v / max) * 22)), backgroundColor: textSecondary },
                                ]}
                              />
                            ));
                          })()
                        : Array.from({ length: 28 }).map((_, i) => (
                            <View key={i} style={[styles.audioBar, { height: 6, backgroundColor: textSecondary }]} />
                          )))}
                    </View>
                    <Text style={[styles.audioTime, { color: textPrimary }]}>{formatAudioDuration(item.durationMs)}</Text>
                  </View>
                ) : item.type === 'image' && item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <Text style={[styles.body, { color: textPrimary }]}>{item.text}</Text>
                )}
                <Text style={[styles.time, { color: textSecondary }]}>{formatStarredTime(item.createdAt)}</Text>
              </Pressable>
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
  albumRow: { flexDirection: 'row', gap: 6 },
  albumSlot: { flex: 1, aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#111', position: 'relative' },
  albumImg: { width: '100%', height: '100%' },
  albumPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  albumPlayBadge: { position: 'absolute', top: '50%', left: '50%', marginLeft: -12, marginTop: -12, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  albumMoreScrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  albumMoreText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  videoWrap: { position: 'relative' },
  videoPlaceholder: { backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  videoPlayBadge: { position: 'absolute', top: '50%', left: '50%', marginLeft: -22, marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  audioRow: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 44 },
  audioPlay: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  audioWave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3, height: 24 },
  audioBar: { width: 2, borderRadius: 1 },
  audioTime: { fontSize: 13, fontWeight: '600' },
});
