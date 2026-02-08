/**
 * STEP G - Image Compression Utility
 * 
 * Compress images before upload to Firebase Storage
 * Max width: 1600px, Quality: 0.7
 */

import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface CompressOptions {
  maxWidth?: number;
  quality?: number;
}

/**
 * Compress image with default settings for patient imaging
 * @param uri Original image URI
 * @param options Compression options
 * @returns Compressed image URI
 */
export async function compressImage(
  uri: string,
  options: CompressOptions = {}
): Promise<{ uri: string; width: number; height: number }> {
  const { maxWidth = 1600, quality = 0.7 } = options;

  try {
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: maxWidth } }],
      { compress: quality, format: SaveFormat.JPEG }
    );

    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('[IMAGE COMPRESS ERROR]', error);
    throw new Error('Failed to compress image');
  }
}
