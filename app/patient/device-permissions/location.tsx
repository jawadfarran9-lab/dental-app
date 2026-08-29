import PermissionDetailScreen from '@/src/components/PermissionDetailScreen';
import { useDevicePermissionsContext } from '@/src/context/DevicePermissionsContext';

export default function LocationPermissionScreen() {
  const { location } = useDevicePermissionsContext();

  return (
    <PermissionDetailScreen
      icon="location-outline"
      permissionName="Location"
      description="Allow BeSmile to access your location for distance calculations, nearby clinics, and map features."
      perm={location}
    />
  );
}
