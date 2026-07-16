// Log-only helper for previously-swallowed errors. Callers keep their
// fire-and-forget / swallow semantics; this just leaves a breadcrumb in
// the console so failures stop being invisible.
export function logSilentFailure(context: string, err: unknown): void {
  try {
    console.warn(`[silent-failure:${context}]`, err);
  } catch {
    // Logging must never break the caller.
  }
}
