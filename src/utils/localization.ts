import i18n from '@/i18n';

/**
 * Converts Western Arabic numerals (0-9) to Eastern Arabic numerals (٠-٩)
 */
export function toArabicNumerals(num: string | number): string {
  const str = String(num);
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/\d/g, (digit) => arabicNumerals[parseInt(digit)]);
}

/**
 * Formats a number according to the current locale
 * - Arabic: Uses Eastern Arabic numerals (٠-٩)
 * - Other languages: Uses Western numerals (0-9)
 */
export function localizeNumber(num: string | number): string {
  const currentLang = i18n.language;
  const str = String(num);
  
  if (currentLang === 'ar') {
    return toArabicNumerals(str);
  }
  
  return str;
}

/**
 * Formats a date/timestamp according to the current locale
 * @param timestamp - Date object, Firestore timestamp, or milliseconds
 * @param options - Intl.DateTimeFormat options
 */
export function localizeDate(
  timestamp: any,
  options?: Intl.DateTimeFormatOptions
): string {
  const currentLang = i18n.language;
  
  let date: Date;
  
  if (!timestamp) return '';
  
  // Handle Firestore Timestamp
  if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } 
  // Handle number (milliseconds)
  else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  }
  // Handle Date object
  else if (timestamp instanceof Date) {
    date = timestamp;
  }
  else {
    return '';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  try {
    return new Intl.DateTimeFormat(currentLang, defaultOptions).format(date);
  } catch (err) {
    console.error('Date formatting error:', err);
    return date.toLocaleString();
  }
}

/**
 * Formats a relative time string (e.g., "5m ago", "2h ago")
 * Returns localized version with localized numbers
 */
export function localizeRelativeTime(timestamp: any): string {
  if (!timestamp) return '';
  
  const currentLang = i18n.language;
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return currentLang === 'ar' ? 'الآن' : 'now';
  }
  if (diffMins < 60) {
    const num = localizeNumber(diffMins);
    return currentLang === 'ar' ? `${num}د` : `${num}m`;
  }
  if (diffHours < 24) {
    const num = localizeNumber(diffHours);
    return currentLang === 'ar' ? `${num}س` : `${num}h`;
  }
  if (diffDays < 7) {
    const num = localizeNumber(diffDays);
    return currentLang === 'ar' ? `${num}ي` : `${num}d`;
  }
  
  return localizeDate(date, { month: 'short', day: 'numeric' });
}

/**
 * Formats currency with localized numbers
 * @param amount - The amount (number)
 * @param currency - Currency symbol (default: '$')
 */
export function localizeCurrency(amount: number, currency: string = '$'): string {
  const currentLang = i18n.language;
  const localizedAmount = localizeNumber(amount);
  
  if (currentLang === 'ar') {
    // Arabic: amount + currency (e.g., "٣٠$")
    return `${localizedAmount}${currency}`;
  }
  
  // Default: currency + amount (e.g., "$30")
  return `${currency}${localizedAmount}`;
}
