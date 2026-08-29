import PermissionDetailScreen from '@/src/components/PermissionDetailScreen';
import { useDevicePermissionsContext } from '@/src/context/DevicePermissionsContext';

export default function CameraPermissionScreen() {
  const { camera } = useDevicePermissionsContext();

  return (
    <PermissionDetailScreen
      icon="camera-outline"
      permissionName="Camera"
      description="Allow BeSmile to access your camera so you can take photos and videos directly within the app."
      perm={camera}
    />
  );
}
