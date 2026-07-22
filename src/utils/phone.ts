export function normalizePhone(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}
export function isValidPhone(raw: string): boolean {
  const digits = normalizePhone(raw);
  return digits.length >= 7 && digits.length <= 15;
}
