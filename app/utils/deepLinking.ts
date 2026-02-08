/**
 * BeSmile AI - Deep Linking Utilities
 * 
 * This module provides utilities for generating and handling deep links
 * for posts within the BeSmile AI dental application.
 */

// Base URL for BeSmile app deep links
export const BESMILE_BASE_URL = 'https://besmile.app';

// URL scheme for native app links
export const BESMILE_SCHEME = 'besmileai';

/**
 * Generate a deep link URL for a specific post
 * @param postId - The unique identifier of the post
 * @returns The full URL that can be used in QR codes or shared
 */
export function generatePostDeepLink(postId: string): string {
  return `${BESMILE_BASE_URL}/post/${postId}`;
}

/**
 * Generate a native app link URL for a specific post
 * @param postId - The unique identifier of the post
 * @returns The native scheme URL (besmileai://post/abc123)
 */
export function generatePostNativeLink(postId: string): string {
  return `${BESMILE_SCHEME}://post/${postId}`;
}

/**
 * Extract post ID from a deep link URL
 * @param url - The full URL or native link
 * @returns The post ID or null if not found
 */
export function extractPostIdFromUrl(url: string): string | null {
  try {
    // Handle HTTPS URLs
    if (url.startsWith('https://')) {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const postIndex = pathParts.indexOf('post');
      if (postIndex !== -1 && pathParts[postIndex + 1]) {
        return pathParts[postIndex + 1];
      }
    }
    
    // Handle native scheme URLs (besmileai://post/abc123)
    if (url.startsWith(`${BESMILE_SCHEME}://`)) {
      const path = url.replace(`${BESMILE_SCHEME}://`, '');
      const pathParts = path.split('/');
      const postIndex = pathParts.indexOf('post');
      if (postIndex !== -1 && pathParts[postIndex + 1]) {
        return pathParts[postIndex + 1];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting post ID from URL:', error);
    return null;
  }
}

/**
 * Check if a URL is a valid BeSmile post deep link
 * @param url - The URL to check
 * @returns True if it's a valid post deep link
 */
export function isValidPostDeepLink(url: string): boolean {
  return (
    url.startsWith(`${BESMILE_BASE_URL}/post/`) ||
    url.startsWith(`${BESMILE_SCHEME}://post/`)
  );
}

/**
 * Generate the qrCodeLink field for Firebase Firestore
 * This should be called when creating a new post
 * @param postId - The post document ID from Firestore
 * @returns Object containing the qrCodeLink field
 */
export function generateQrCodeLinkField(postId: string): { qrCodeLink: string } {
  return {
    qrCodeLink: generatePostDeepLink(postId),
  };
}

/**
 * Example usage when creating a new post in Firebase:
 * 
 * ```typescript
 * import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
 * import { generateQrCodeLinkField } from '@/app/utils/deepLinking';
 * 
 * async function createPost(postData: PostData) {
 *   // Add the post to Firestore
 *   const docRef = await addDoc(collection(db, 'posts'), postData);
 *   
 *   // Update with the qrCodeLink field
 *   await updateDoc(doc(db, 'posts', docRef.id), {
 *     ...generateQrCodeLinkField(docRef.id),
 *   });
 *   
 *   return docRef.id;
 * }
 * ```
 */

export default {
  BESMILE_BASE_URL,
  BESMILE_SCHEME,
  generatePostDeepLink,
  generatePostNativeLink,
  extractPostIdFromUrl,
  isValidPostDeepLink,
  generateQrCodeLinkField,
};
