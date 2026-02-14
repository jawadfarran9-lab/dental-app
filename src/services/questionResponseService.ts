import { db } from '@/firebaseConfig';
import { QuestionResponse } from '@/src/types/questionResponse';
import {
    addDoc,
    collection,
    doc,
    getDocs,
    orderBy,
    query,
    updateDoc,
    where,
} from 'firebase/firestore';

// ─── Collection helper ───
const responsesCollection = (clinicId: string) =>
  collection(db, `clinics/${clinicId}/questionResponses`);

// ─── Create ───
export async function addQuestionResponse(
  data: Omit<QuestionResponse, 'id'>,
): Promise<string> {
  const ref = await addDoc(responsesCollection(data.clinicId), {
    questionStickerId: data.questionStickerId,
    clinicId: data.clinicId,
    storyId: data.storyId,
    responseText: data.responseText,
    createdAt: data.createdAt,
    isRead: false,
  });
  return ref.id;
}

// ─── Read (all for clinic, newest first) ───
export async function fetchQuestionResponses(
  clinicId: string,
): Promise<QuestionResponse[]> {
  const q = query(
    responsesCollection(clinicId),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<QuestionResponse, 'id'>),
  }));
}

// ─── Read (unread only) ───
export async function fetchUnreadQuestionResponses(
  clinicId: string,
): Promise<QuestionResponse[]> {
  const q = query(
    responsesCollection(clinicId),
    where('isRead', '==', false),
    orderBy('createdAt', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<QuestionResponse, 'id'>),
  }));
}

// ─── Mark as read ───
export async function markQuestionResponseRead(
  clinicId: string,
  responseId: string,
): Promise<void> {
  const ref = doc(db, `clinics/${clinicId}/questionResponses`, responseId);
  await updateDoc(ref, { isRead: true });
}
