import { useRouter } from 'expo-router';
import { useEffect } from 'react';

// Deprecated alternate UI: redirect to unified subscribe flow
export default function SubscriptionTabRedirect() {
	const router = useRouter();

	useEffect(() => {
		router.replace('/clinic/subscribe');
	}, [router]);

	return null;
}
