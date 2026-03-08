// i18next v25.8+ TFunction has no call signatures without full resource typing.
// Add callable signatures via interface merging.
import 'i18next';

declare module 'i18next' {
  interface TFunction {
    (key: string, defaultValue?: string, options?: Record<string, unknown>): string;
    (key: string, options?: Record<string, unknown>): string;
  }
}
