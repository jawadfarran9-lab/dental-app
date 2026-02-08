// postService.ts - Firebase Firestore operations for posts
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    arrayRemove,
    arrayUnion,
    doc,
    getDoc,
    increment,
    serverTimestamp,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ========== Device ID Management ==========
const DEVICE_ID_KEY = '@device_id';

/**
 * Get or generate a unique device ID for anonymous tracking
 */
export const getDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      // Generate a random device ID
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
  } catch (error) {
    console.error('Error getting device ID:', error);
    // Fallback to a session-based ID
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
};

// ========== Like Operations ==========

/**
 * Initialize a post in Firestore if it doesn't exist
 */
export const initializePost = async (postId: string, initialLikes: number = 0): Promise<void> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      await setDoc(postRef, {
        likeCount: initialLikes,
        likedBy: [],
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error('Error initializing post:', error);
  }
};

/**
 * Toggle like for a post (like/unlike)
 * Returns the new like status and count
 */
export const togglePostLike = async (
  postId: string, 
  initialLikes: number = 0
): Promise<{ isLiked: boolean; likeCount: number }> => {
  try {
    const deviceId = await getDeviceId();
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      // Create the post document
      await setDoc(postRef, {
        likeCount: initialLikes + 1,
        likedBy: [deviceId],
        createdAt: serverTimestamp(),
      });
      return { isLiked: true, likeCount: initialLikes + 1 };
    }
    
    const postData = postSnap.data();
    const likedBy: string[] = postData.likedBy || [];
    const currentLikes = postData.likeCount || initialLikes;
    const hasLiked = likedBy.includes(deviceId);
    
    if (hasLiked) {
      // Unlike - remove device ID and decrement count
      await updateDoc(postRef, {
        likeCount: increment(-1),
        likedBy: arrayRemove(deviceId),
      });
      return { isLiked: false, likeCount: Math.max(0, currentLikes - 1) };
    } else {
      // Like - add device ID and increment count
      await updateDoc(postRef, {
        likeCount: increment(1),
        likedBy: arrayUnion(deviceId),
      });
      return { isLiked: true, likeCount: currentLikes + 1 };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

/**
 * Check if current device has liked a post
 */
export const checkIfLiked = async (postId: string): Promise<boolean> => {
  try {
    const deviceId = await getDeviceId();
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      const likedBy: string[] = postSnap.data().likedBy || [];
      return likedBy.includes(deviceId);
    }
    return false;
  } catch (error) {
    console.error('Error checking like status:', error);
    return false;
  }
};

/**
 * Get the current like count for a post from Firestore
 */
export const getLikeCount = async (postId: string, fallbackCount: number = 0): Promise<number> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (postSnap.exists()) {
      return postSnap.data().likeCount || fallbackCount;
    }
    return fallbackCount;
  } catch (error) {
    console.error('Error getting like count:', error);
    return fallbackCount;
  }
};

/**
 * Get like status and count for multiple posts (batch)
 */
export const getPostsLikeData = async (
  postIds: string[], 
  fallbackCounts: Record<string, number> = {}
): Promise<Record<string, { isLiked: boolean; likeCount: number }>> => {
  try {
    const deviceId = await getDeviceId();
    const result: Record<string, { isLiked: boolean; likeCount: number }> = {};
    
    await Promise.all(
      postIds.map(async (postId) => {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        
        if (postSnap.exists()) {
          const data = postSnap.data();
          const likedBy: string[] = data.likedBy || [];
          result[postId] = {
            isLiked: likedBy.includes(deviceId),
            likeCount: data.likeCount || fallbackCounts[postId] || 0,
          };
        } else {
          result[postId] = {
            isLiked: false,
            likeCount: fallbackCounts[postId] || 0,
          };
        }
      })
    );
    
    return result;
  } catch (error) {
    console.error('Error getting posts like data:', error);
    // Return fallback data
    const result: Record<string, { isLiked: boolean; likeCount: number }> = {};
    postIds.forEach(id => {
      result[id] = { isLiked: false, likeCount: fallbackCounts[id] || 0 };
    });
    return result;
  }
};

// ========== Saved Posts Operations (Local Storage) ==========

const SAVED_POSTS_KEY = '@saved_posts';

/**
 * Get all saved post IDs from local storage
 */
export const getSavedPostIds = async (): Promise<string[]> => {
  try {
    const savedPosts = await AsyncStorage.getItem(SAVED_POSTS_KEY);
    return savedPosts ? JSON.parse(savedPosts) : [];
  } catch (error) {
    console.error('Error getting saved posts:', error);
    return [];
  }
};

/**
 * Toggle save status for a post (save/unsave)
 */
export const toggleSavePost = async (postId: string): Promise<boolean> => {
  try {
    const savedPosts = await getSavedPostIds();
    const isSaved = savedPosts.includes(postId);
    
    let newSavedPosts: string[];
    if (isSaved) {
      // Remove from saved
      newSavedPosts = savedPosts.filter(id => id !== postId);
    } else {
      // Add to saved
      newSavedPosts = [...savedPosts, postId];
    }
    
    await AsyncStorage.setItem(SAVED_POSTS_KEY, JSON.stringify(newSavedPosts));
    return !isSaved; // Return new save status
  } catch (error) {
    console.error('Error toggling save:', error);
    throw error;
  }
};

/**
 * Check if a post is saved
 */
export const isPostSaved = async (postId: string): Promise<boolean> => {
  try {
    const savedPosts = await getSavedPostIds();
    return savedPosts.includes(postId);
  } catch (error) {
    console.error('Error checking saved status:', error);
    return false;
  }
};

/**
 * Get saved status for multiple posts
 */
export const getSavedStatusBatch = async (postIds: string[]): Promise<Record<string, boolean>> => {
  try {
    const savedPosts = await getSavedPostIds();
    const result: Record<string, boolean> = {};
    postIds.forEach(id => {
      result[id] = savedPosts.includes(id);
    });
    return result;
  } catch (error) {
    console.error('Error getting saved status batch:', error);
    const result: Record<string, boolean> = {};
    postIds.forEach(id => {
      result[id] = false;
    });
    return result;
  }
};
