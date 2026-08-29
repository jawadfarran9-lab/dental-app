import PermissionDetailScreen from '@/src/components/PermissionDetailScreen';
import { useDevicePermissionsContext } from '@/src/context/DevicePermissionsContext';

export default function MicrophonePermissionScreen() {
  const { microphone } = useDevicePermissionsContext();

  return (
    <PermissionDetailScreen
      icon="mic-outline"
      permissionName="Microphone"
      description="Allow BeSmile to access your microphone so you can record audio messages and use voice features."
      perm={microphone}
    />
  );
}
