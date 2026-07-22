import { isValidPhoneNumber, parsePhoneNumber, isSupportedCountry } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

export function normalizePhone(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}
export function isValidPhone(raw: string): boolean {
  const digits = normalizePhone(raw);
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidPhoneForCountry(raw: string, country?: string | null): boolean {
  if (country && isSupportedCountry(country)) {
    try {
      return isValidPhoneNumber(raw, country as CountryCode);
    } catch {
      return false;
    }
  }
  return isValidPhone(raw);
}

export function toStoredPhone(raw: string, country?: string | null): string {
  if (country && isSupportedCountry(country)) {
    try {
      const parsed = parsePhoneNumber(raw, country as CountryCode);
      if (parsed && parsed.isValid()) return parsed.number;
    } catch {
      /* fall through */
    }
  }
  return normalizePhone(raw);
}
