import {
    getSavedPostIds as fetchSavedPostIds,
    toggleSavePost as toggleSavePostService,
} from '@/src/services/engagementService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const TEMPLATES_KEY = '@saved_templates';

interface SavedItemsContextValue {
  // Templates (AsyncStorage)
  savedTemplateIds: string[];
  toggleSaveTemplate: (templateId: string) => void;
  isTemplateSaved: (templateId: string) => boolean;

  // Posts/Reels (Firestore — delegates to engagementService)
  savedPostIds: string[];
  toggleSavePost: (postId: string) => Promise<void>;
  isPostSaved: (postId: string) => boolean;
  refreshSavedPosts: () => Promise<void>;

  // Future-ready
  savedReelIds: string[];

  isLoaded: boolean;
}

const SavedItemsContext = createContext<SavedItemsContextValue>({
  savedTemplateIds: [],
  toggleSaveTemplate: () => {},
  isTemplateSaved: () => false,
  savedPostIds: [],
  toggleSavePost: async () => {},
  isPostSaved: () => false,
  refreshSavedPosts: async () => {},
  savedReelIds: [],
  isLoaded: false,
});

export const useSavedItems = () => useContext(SavedItemsContext);

export const SavedItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedTemplateIds, setSavedTemplateIds] = useState<string[]>([]);
  const [savedPostIds, setSavedPostIds] = useState<string[]>([]);
  const [savedReelIds] = useState<string[]>([]);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);

  const isLoaded = templatesLoaded && postsLoaded;

  // ── Templates: load from AsyncStorage ────────────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(TEMPLATES_KEY);
        if (raw) setSavedTemplateIds(JSON.parse(raw));
      } catch {
        // Silent
      } finally {
        setTemplatesLoaded(true);
      }
    })();
  }, []);

  const persistTemplates = useCallback(async (ids: string[]) => {
    try {
      await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(ids));
    } catch {
      // Silent
    }
  }, []);

  const toggleSaveTemplate = useCallback((templateId: string) => {
    setSavedTemplateIds((prev) => {
      const exists = prev.includes(templateId);
      const next = exists ? prev.filter((id) => id !== templateId) : [...prev, templateId];
      persistTemplates(next);
      return next;
    });
  }, [persistTemplates]);

  const isTemplateSaved = useCallback(
    (templateId: string) => savedTemplateIds.includes(templateId),
    [savedTemplateIds],
  );

  // ── Posts: load from Firestore via engagementService ─────
  const refreshSavedPosts = useCallback(async () => {
    try {
      const ids = await fetchSavedPostIds();
      setSavedPostIds(ids);
    } catch {
      // Silent — keep existing list
    } finally {
      setPostsLoaded(true);
    }
  }, []);

  useEffect(() => {
    refreshSavedPosts();
  }, [refreshSavedPosts]);

  const toggleSavePost = useCallback(async (postId: string) => {
    // Optimistic update
    setSavedPostIds((prev) => {
      const exists = prev.includes(postId);
      return exists ? prev.filter((id) => id !== postId) : [...prev, postId];
    });
    try {
      await toggleSavePostService(postId);
    } catch {
      // Revert on failure
      setSavedPostIds((prev) => {
        const exists = prev.includes(postId);
        return exists ? prev.filter((id) => id !== postId) : [...prev, postId];
      });
    }
  }, []);

  const isPostSaved = useCallback(
    (postId: string) => savedPostIds.includes(postId),
    [savedPostIds],
  );

  // ── Combined value ───────────────────────────────────────
  const value = useMemo(
    () => ({
      savedTemplateIds,
      toggleSaveTemplate,
      isTemplateSaved,
      savedPostIds,
      toggleSavePost,
      isPostSaved,
      refreshSavedPosts,
      savedReelIds,
      isLoaded,
    }),
    [
      savedTemplateIds, toggleSaveTemplate, isTemplateSaved,
      savedPostIds, toggleSavePost, isPostSaved, refreshSavedPosts,
      savedReelIds, isLoaded,
    ],
  );

  return <SavedItemsContext.Provider value={value}>{children}</SavedItemsContext.Provider>;
};
