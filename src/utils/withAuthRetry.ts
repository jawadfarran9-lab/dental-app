const TRANSIENT_AUTH_CODES = new Set(['auth/network-request-failed', 'auth/timeout', 'auth/internal-error']);

export async function withAuthRetry<T>(op: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await op();
    } catch (e: any) {
      lastErr = e;
      if (!TRANSIENT_AUTH_CODES.has(e?.code) || attempt === maxAttempts) throw e;
      await new Promise((r) => setTimeout(r, attempt * 400 + 100));
    }
  }
  throw lastErr;
}
