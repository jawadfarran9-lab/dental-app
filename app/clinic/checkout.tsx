import { useRouter } from 'expo-router';
import { useEffect } from 'react';

// Deprecated placeholder: redirect to unified subscription flow at /clinic/subscribe
export default function CheckoutPlaceholder() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/clinic/subscribe');
  }, [router]);

  return null;
}

