// app/firebaseConfig.ts - Re-export from root firebaseConfig.ts
// This ensures all imports work correctly with @/firebaseConfig path alias
export { db, storage, app } from '../firebaseConfig';

// Expo Router treats any file under `app/` as a route.
// Provide a default export to silence route warnings on web bundler.
export default function FirebaseConfigRouteShim() {
	return null;
}