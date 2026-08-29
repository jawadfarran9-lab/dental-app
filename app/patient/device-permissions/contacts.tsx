import PermissionDetailScreen from '@/src/components/PermissionDetailScreen';
import { useDevicePermissionsContext } from '@/src/context/DevicePermissionsContext';

export default function ContactsPermissionScreen() {
  const { contacts } = useDevicePermissionsContext();

  return (
    <PermissionDetailScreen
      icon="people-outline"
      permissionName="Contacts"
      description="Allow BeSmile to access your contacts so you can find and invite people you know."
      perm={contacts}
    />
  );
}
