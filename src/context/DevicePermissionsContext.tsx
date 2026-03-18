import {
    useCameraPermission,
    useContactsPermission,
    useLocationPermission,
    useMicrophonePermission,
    useNotificationPermission,
    usePhotosPermission,
    type PermissionInfo,
} from '@/src/hooks/useDevicePermissions';
import React, { createContext, useContext } from 'react';

interface DevicePermissionsContextValue {
  camera: PermissionInfo;
  photos: PermissionInfo;
  location: PermissionInfo;
  notifications: PermissionInfo;
  microphone: PermissionInfo;
  contacts: PermissionInfo;
}

const DevicePermissionsContext = createContext<DevicePermissionsContextValue | null>(null);

export function DevicePermissionsProvider({ children }: { children: React.ReactNode }) {
  const camera = useCameraPermission();
  const photos = usePhotosPermission();
  const location = useLocationPermission();
  const notifications = useNotificationPermission();
  const microphone = useMicrophonePermission();
  const contacts = useContactsPermission();

  return (
    <DevicePermissionsContext.Provider value={{ camera, photos, location, notifications, microphone, contacts }}>
      {children}
    </DevicePermissionsContext.Provider>
  );
}

export function useDevicePermissionsContext(): DevicePermissionsContextValue {
  const ctx = useContext(DevicePermissionsContext);
  if (!ctx) {
    throw new Error('useDevicePermissionsContext must be used within DevicePermissionsProvider');
  }
  return ctx;
}
