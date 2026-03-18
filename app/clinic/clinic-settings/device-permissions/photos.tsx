import PermissionDetailScreen from '@/src/components/PermissionDetailScreen';
import { useDevicePermissionsContext } from '@/src/context/DevicePermissionsContext';

export default function PhotosPermissionScreen() {
  const { photos } = useDevicePermissionsContext();

  return (
    <PermissionDetailScreen
      icon="images-outline"
      permissionName="Photos"
      description="Allow BeSmile to access your photo library so you can upload and share images from your gallery."
      perm={photos}
    />
  );
}
