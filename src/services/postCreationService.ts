/**
 * Post / Reel Creation Service
 * Writes new media documents to clinics/{clinicId}/media.
 * Pure Firestore write — no side effects, no UI logic.
 */
import { db } from '@/firebaseConfig';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export type PostType = 'post' | 'reel';

export interface CreatePostInput {
  type: PostType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
  clinicName?: string;
}

/**
 * Create a new post or reel in a clinic's media collection.
 */
export async function createPost(
  clinicId: string,
  data: CreatePostInput,
): Promise<void> {
  try {
    const colRef = collection(db, `clinics/${clinicId}/media`);

    await addDoc(colRef, {
      type: data.type,
      mediaUrl: data.mediaUrl,
      thumbnailUrl: data.thumbnailUrl ?? data.mediaUrl,
      caption: data.caption ?? '',
      clinicId,
      clinicName: data.clinicName ?? '',
      isVideo: data.type === 'reel',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('[POST_CREATION] Error creating post:', error);
    throw error;
  }
}
