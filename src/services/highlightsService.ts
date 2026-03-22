import { db } from '@/firebaseConfig';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

export interface Highlight {
  id: string;
  name: string;
  coverUrl: string;
  storyIds: string[];
  createdAt: number;
}

function highlightsCol(clinicId: string) {
  return collection(db, 'clinics', clinicId, 'highlights');
}

export async function fetchHighlights(clinicId: string): Promise<Highlight[]> {
  try {
    const q = query(highlightsCol(clinicId), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      let ts = 0;
      if (typeof data.createdAt === 'number') ts = data.createdAt;
      else if (data.createdAt?.toMillis) ts = data.createdAt.toMillis();
      return {
        id: d.id,
        name: data.name ?? '',
        coverUrl: data.coverUrl ?? '',
        storyIds: data.storyIds ?? [],
        createdAt: ts,
      };
    });
  } catch (err) {
    console.error('Error fetching highlights:', err);
    return [];
  }
}

export async function createHighlight(
  clinicId: string,
  name: string,
  coverUrl: string,
  storyIds: string[],
): Promise<string> {
  const ref = await addDoc(highlightsCol(clinicId), {
    name,
    coverUrl,
    storyIds,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteHighlight(clinicId: string, highlightId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'clinics', clinicId, 'highlights', highlightId));
  } catch (err) {
    console.error('Error deleting highlight:', err);
  }
}

export async function updateHighlight(
  clinicId: string,
  highlightId: string,
  data: { name?: string; coverUrl?: string; storyIds?: string[] },
): Promise<void> {
  try {
    await updateDoc(doc(db, 'clinics', clinicId, 'highlights', highlightId), data);
  } catch (err) {
    console.error('Error updating highlight:', err);
  }
}
