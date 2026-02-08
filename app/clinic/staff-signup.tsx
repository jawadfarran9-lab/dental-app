import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

// Deprecated screen: redirect staff signup attempts to the main clinic signup flow.
export default function StaffSignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/clinic/signup' as any);
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Text style={{ fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
        Redirecting to clinic signup...
      </Text>
    </View>
  );
}
