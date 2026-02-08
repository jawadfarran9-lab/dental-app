import { createContext, ReactNode, useContext, useState } from 'react';

type CameraToolsSide = 'left' | 'right';
type ContentType = 'story' | 'reels';

interface StorySettings {
  defaultFrontCamera: boolean;
  cameraToolsSide: CameraToolsSide;
  allowCameraRollAccess: boolean;
  contentType: ContentType;
}

interface StorySettingsContextType {
  settings: StorySettings;
  updateSettings: (newSettings: Partial<StorySettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: StorySettings = {
  defaultFrontCamera: false,
  cameraToolsSide: 'right',
  allowCameraRollAccess: true,
  contentType: 'story',
};

const StorySettingsContext = createContext<StorySettingsContextType | undefined>(undefined);

export function StorySettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StorySettings>(defaultSettings);

  const updateSettings = (newSettings: Partial<StorySettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <StorySettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
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

