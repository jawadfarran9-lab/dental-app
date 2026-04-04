import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type CameraToolsSide = 'left' | 'right';
type ContentType = 'story' | 'reels';

interface StorySettings {
  defaultFrontCamera: boolean;
  cameraToolsSide: CameraToolsSide;
  contentType: ContentType;
}

interface StorySettingsContextType {
  settings: StorySettings;
  isLoaded: boolean;
  updateSettings: (newSettings: Partial<StorySettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: StorySettings = {
  defaultFrontCamera: false,
  cameraToolsSide: 'right',
  contentType: 'story',
};

const SETTINGS_KEYS: ReadonlyArray<keyof StorySettings> = [
  'defaultFrontCamera',
  'cameraToolsSide',
  'contentType',
];

const CAMERA_SETTINGS_KEY = 'camera_settings_v1';

const StorySettingsContext = createContext<StorySettingsContextType | undefined>(undefined);

/** Persist settings to AsyncStorage (fire-and-forget). */
function persistSettings(s: StorySettings) {
  AsyncStorage.setItem(CAMERA_SETTINGS_KEY, JSON.stringify(s)).catch(() => {});
}

/** Pick only known keys from parsed data to prevent stale/unknown fields bleeding in. */
function sanitizeParsed(parsed: Record<string, unknown>): Partial<StorySettings> {
  const result: Partial<StorySettings> = {};
  for (const key of SETTINGS_KEYS) {
    if (key in parsed && parsed[key] !== undefined) {
      (result as Record<string, unknown>)[key] = parsed[key];
    }
  }
  return result;
}

export function StorySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StorySettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const userModified = useRef(false);

  // Load persisted settings on mount — skip merge if user already changed state
  useEffect(() => {
    AsyncStorage.getItem(CAMERA_SETTINGS_KEY)
      .then((raw) => {
        if (raw && !userModified.current) {
          try {
            const parsed = JSON.parse(raw);
            const safe = sanitizeParsed(parsed);
            setSettings((prev) => ({ ...prev, ...safe }));
          } catch {
            console.warn('[CameraSettings] corrupted storage, using defaults');
          }
        }
      })
      .catch(() => {})
      .finally(() => { setIsLoaded(true); });
  }, []);

  const updateSettings = useCallback((newSettings: Partial<StorySettings>) => {
    userModified.current = true;
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      persistSettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    userModified.current = true;
    setSettings(defaultSettings);
    persistSettings(defaultSettings);
  }, []);

  const contextValue = useMemo<StorySettingsContextType>(
    () => ({ settings, isLoaded, updateSettings, resetSettings }),
    [settings, isLoaded, updateSettings, resetSettings],
  );

  return (
    <StorySettingsContext.Provider value={contextValue}>
      {children}
    </StorySettingsContext.Provider>
  );
}

export function useStorySettings() {
  const context = useContext(StorySettingsContext);
  if (context === undefined) {
    throw new Error('useStorySettings must be used within a StorySettingsProvider');
  }
  return context;
}

export type { CameraToolsSide, ContentType, StorySettings };

