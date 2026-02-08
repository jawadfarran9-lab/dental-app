// Lightweight analytics wrapper for React Native
// Firebase Analytics requires web-specific APIs (document/window) that don't exist in RN
// Using console logging for now - can be extended to use @react-native-firebase/analytics


type Params = Record<string, any> | undefined;

// Safe analytics logging for React Native environment
const logFn = (name: string, params?: Params) => {
  // Only log in development mode
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log('[analytics]', name, params || {});
  }
  
  // TODO: Add @react-native-firebase/analytics for production tracking
  // Example:
  // import analytics from '@react-native-firebase/analytics';
  // await analytics().logEvent(name, params);
};

export function trackEvent(name: string, params?: Params) {
  try {
    logFn(name, params);
  } catch (_) {
    // Silently fail - analytics should never break the app
  }
}
