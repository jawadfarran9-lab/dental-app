import { useEffect } from 'react';
import { router } from 'expo-router';

// Safety redirect to ensure any legacy /home navigation lands on the tabbed Home screen.
export default function HomeRedirect() {
  useEffect(() => {
    router.replace('/(tabs)/home');
  }, []);

  return null;
}
