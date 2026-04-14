import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const IMPORT_DIR_NAME = 'reels-imports';

function getImportDir(): Directory {
  return new Directory(Paths.cache, IMPORT_DIR_NAME);
}

function ensureImportDir(): void {
  const dir = getImportDir();
  if (!dir.exists) {
    dir.create({ intermediates: true });
  }
}

function isAppOwned(uri: string): boolean {
  const cacheUri = Paths.cache.uri;
  const docUri = Paths.document.uri;
  return uri.startsWith(cacheUri) || uri.startsWith(docUri);
}

/**
 * Resolves a gallery/template media asset to an app-owned file URI
 * that the video player can read without permission issues.
 *
 * If the source is already app-owned (cache/documents), returns it directly.
 * Otherwise copies the file into the app cache.
 */
export async function resolveMediaToOwnedFile(
  assetId: string,
  originalUri: string,
  mediaType: string,
): Promise<string> {
  // Only videos need copying; photos don't go through the player
  if (mediaType !== 'video') {
    return originalUri;
  }

  // Step 1: Resolve to best local URI via MediaLibrary
  const info = await MediaLibrary.getAssetInfoAsync(assetId, { shouldDownloadFromNetwork: true });
  let sourceUri = info.localUri ?? originalUri;

  // Step 2: Strip iOS hash fragment
  if (sourceUri.includes('#')) {
    sourceUri = sourceUri.split('#')[0];
  }

  console.log('[media-copy] source uri:', sourceUri);

  // Step 3: If already app-owned, skip copy
  if (isAppOwned(sourceUri)) {
    console.log('[media-copy] already app-owned, skipping copy');
    return sourceUri;
  }

  // Step 4: Build deterministic destination
  ensureImportDir();
  const ext = sourceUri.includes('.') ? sourceUri.substring(sourceUri.lastIndexOf('.')) : '.mp4';
  const safeName = `${assetId.replace(/[^a-zA-Z0-9]/g, '_')}${ext}`;
  const destFile = new File(getImportDir(), safeName);
  const destUri = destFile.uri;

  console.log('[media-copy] destination uri:', destUri);

  // Step 5: If destination already exists from a previous copy, return it
  if (destFile.exists) {
    console.log('[media-copy] cached copy exists, reusing');
    return destUri;
  }

  // Step 6: Copy
  try {
    console.log('[media-copy] copy start');
    const sourceFile = new File(sourceUri);
    sourceFile.copy(destFile);
    console.log('[media-copy] copy success');
    return destUri;
  } catch (err: any) {
    console.log('[media-copy] copy failed:', err?.message ?? err);
    // Fallback: return the source URI anyway (player may still fail, but diagnostics will log it)
    return sourceUri;
  }
}
