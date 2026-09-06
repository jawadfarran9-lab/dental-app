import React, { useEffect, useState } from 'react';
import { View, Image, Pressable, Text, Switch, ActivityIndicator, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { updateSessionPhoto } from '@/src/services/sessionPhotosService';

type PhotoCategory = 'before' | 'after' | 'xray' | 'intraoral' | 'scan' | 'other';

const CATEGORIES: { key: PhotoCategory; label: string }[] = [
  { key: 'before', label: 'Before' },
  { key: 'after', label: 'After' },
  { key: 'xray', label: 'X-ray' },
  { key: 'intraoral', label: 'Intraoral' },
  { key: 'scan', label: 'Scan' },
  { key: 'other', label: 'Other' },
];

export default function PhotoEditorScreen() {
  const insets = useSafeAreaInsets();
  const { clinicId, patientId, sessionId, photoId } = useLocalSearchParams<{
    clinicId?: string; patientId?: string; sessionId?: string; photoId?: string;
  }>();

  const [url, setUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<PhotoCategory>('other');
  const [shared, setShared] = useState(false);
  const [loading, setLoading] = useState(true);

  const [catOpen, setCatOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!clinicId || !patientId || !sessionId || !photoId) { setLoading(false); return; }
    const ref = doc(
      db,
      `clinics/${clinicId}/patients/${patientId}/sessions/${sessionId}/photos/${photoId}`
    );
    const unsub = onSnapshot(ref, (snap) => {
      setLoading(false);
      if (!snap.exists()) { setUrl(null); return; }
      const d = snap.data() as any;
      setUrl(d.url ?? null);
      setCategory((d.category as PhotoCategory) ?? 'other');
      setShared(!!d.sharedWithPatient);
    }, () => setLoading(false));
    return () => unsub();
  }, [clinicId, patientId, sessionId, photoId]);

  const ids = {
    clinicId: String(clinicId),
    patientId: String(patientId),
    sessionId: String(sessionId),
    photoId: String(photoId),
  };

  const pickCategory = async (c: PhotoCategory) => {
    setCategory(c);
    setCatOpen(false);
    try {
      await updateSessionPhoto({ ...ids, patch: { category: c } });
    } catch (e) {
      console.warn('category update failed', e);
    }
  };

  const toggleShared = async (v: boolean) => {
    setShared(v);
    try {
      await updateSessionPhoto({ ...ids, patch: { sharedWithPatient: v } });
    } catch (e) {
      console.warn('share update failed', e);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : url ? (
        <Image source={{ uri: url }} style={styles.image} resizeMode="contain" />
      ) : null}

      <View style={[styles.topbar, { top: insets.top + 12 }]} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Ionicons name="close" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.topRight} pointerEvents="box-none">
          <Pressable
            onPress={() => { setShareOpen(false); setCatOpen(true); }}
            style={styles.iconBtn}
            hitSlop={10}
          >
            <Ionicons name="pricetag" size={19} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={() => { setCatOpen(false); setShareOpen(true); }}
            style={[styles.iconBtn, { marginLeft: 10 }]}
            hitSlop={10}
          >
            <Ionicons name={shared ? 'eye' : 'lock-closed'} size={19} color={shared ? '#34D399' : '#FFFFFF'} />
          </Pressable>
        </View>
      </View>

      {catOpen && (
        <View style={styles.sheetWrap}>
          <Pressable style={styles.backdrop} onPress={() => setCatOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.sheetTitle}>Category</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => {
                const on = c.key === category;
                return (
                  <Pressable key={c.key} onPress={() => pickCategory(c.key)} style={[styles.chip, on && styles.chipOn]}>
                    <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {shareOpen && (
        <View style={styles.sheetWrap}>
          <Pressable style={styles.backdrop} onPress={() => setShareOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.shareRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.sheetTitle}>Share to patient</Text>
                <Text style={styles.shareSub}>
                  {shared ? 'The patient can see this photo.' : 'Clinic only — hidden from the patient.'}
                </Text>
              </View>
              <Switch
                value={shared}
                onValueChange={toggleShared}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  topbar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  topRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center' },
  sheetWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#161B22', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 18, paddingHorizontal: 18 },
  sheetTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)' },
  chipOn: { backgroundColor: '#1668E3' },
  chipTxt: { color: '#DFE7F3', fontSize: 13, fontWeight: '700' },
  chipTxtOn: { color: '#FFFFFF' },
  shareRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  shareSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12.5, marginTop: 4, lineHeight: 17 },
});
