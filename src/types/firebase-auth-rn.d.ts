// Firebase v12 ships getReactNativePersistence only in its React-Native build entry
// (@firebase/auth/dist/rn/index.js); it is absent from the default type definitions.
// Metro resolves it at runtime. This augmentation adds the missing type so firebaseConfig.ts
// can import it normally — no @ts-ignore (which an import organizer keeps detaching).
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: unknown): Persistence;
}
