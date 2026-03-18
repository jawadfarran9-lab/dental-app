import PermissionDetailScreen from '@/src/components/PermissionDetailScreen';
import { useDevicePermissionsContext } from '@/src/context/DevicePermissionsContext';

export default function NotificationsPermissionScreen() {
  const { notifications } = useDevicePermissionsContext();

  return (
    <PermissionDetailScreen
      icon="notifications-outline"
      permissionName="Notifications"
      description="Allow BeSmile to send you push notifications for appointment reminders, messages, and important updates."
      perm={notifications}
    />
  );
}
