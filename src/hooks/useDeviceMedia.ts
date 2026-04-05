import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useState } from 'react';

export interface MediaAsset {
  id: string;
  uri: string;
  mediaType: 'photo' | 'video';
  duration?: number;
  width: number;
  height: number;
}

type PermissionState = 'loading' | 'granted' | 'denied';

/**
 * Hook to fetch device media via expo-media-library.
 * Handles permission checking, paginated asset loading, and normalization.
 *
 * Isolated from useCameraRollPermission (settings toggle) —
 * this hook owns its own permission lifecycle for the picker flow.
 */
export function useDeviceMedia() {
  const [permission, setPermission] = useState<PermissionState>('loading');
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [endCursor, setEndCursor] = useState<string | undefined>();
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // ── Permission check on mount ───────────────────────────────
  useEffect(() => {
    (async () => {
      const { status, accessPrivileges } = await MediaLibrary.getPermissionsAsync();
      if (status === 'granted' || accessPrivileges === 'limited') {
        setPermission('granted');
      } else if (status === 'denied') {
        setPermission('denied');
        setIsLoading(false);
      } else {
        // Not determined — request
        const req = await MediaLibrary.requestPermissionsAsync();
        if (req.status === 'granted' || req.accessPrivileges === 'limited') {
          setPermission('granted');
        } else {
          setPermission('denied');
          setIsLoading(false);
        }
      }
    })();
  }, []);

  // ── Load first batch when permission is granted ─────────────
  const loadMedia = useCallback(async (cursor?: string) => {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: 60,
        after: cursor,
        mediaType: [MediaLibrary.MediaType.photo, MediaLibrary.MediaType.video],
        sortBy: [MediaLibrary.SortBy.creationTime],
      });

      const mapped: MediaAsset[] = result.assets.map((a) => ({
        id: a.id,
        uri: a.uri,
        mediaType: a.mediaType === 'video' ? 'video' : 'photo',
        duration: a.duration,
        width: a.width,
        height: a.height,
      }));

      if (cursor) {
        setAssets((prev) => [...prev, ...mapped]);
      } else {
        setAssets(mapped);
      }
      setEndCursor(result.endCursor);
      setHasNextPage(result.hasNextPage);
    } catch {
      // Silently fail — grid stays empty
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permission === 'granted') {
      loadMedia();
    }
  }, [permission, loadMedia]);

  // ── Pagination ──────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (hasNextPage && endCursor && !isLoading) {
      loadMedia(endCursor);
    }
  }, [hasNextPage, endCursor, isLoading, loadMedia]);

  // ── Manual permission request (for retry button) ────────────
  const requestPermission = useCallback(async () => {
    const { status, accessPrivileges } = await MediaLibrary.getPermissionsAsync();
    if (status === 'granted' || accessPrivileges === 'limited') {
      setPermission('granted');
      return;
    }
    const req = await MediaLibrary.requestPermissionsAsync();
    if (req.status === 'granted' || req.accessPrivileges === 'limited') {
      setPermission('granted');
    } else {
      setPermission('denied');
    }
  }, []);

  return { assets, isLoading, hasNextPage, loadMore, permission, requestPermission } as const;
}
