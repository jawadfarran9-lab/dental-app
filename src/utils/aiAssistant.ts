/**
 * AI Dental Assistant Helper
 * Provides mock AI responses with dental-only topic filtering
 * Includes emergency dental situation detection
 */

import i18n from '@/i18n';

// Emergency/urgent dental keywords - requires immediate professional attention
const EMERGENCY_KEYWORDS = [
  'pain', 'severe pain', 'unbearable pain', 'sever', 'ache', 'severe ache',
  'bleeding', 'bleed', 'blood',
  'swelling', 'swollen', 'swell',
  'infection', 'infected', 'abscess',
  'difficulty breathing', 'breathing difficulty', 'can\'t breathe',
  'pus', 'discharge',
  'severe swelling',
  'knocked out', 'knocked-out', 'tooth knocked',
  'jaw pain', 'jaw swollen',
  'fever', 'feverish',
  'can\'t chew', 'unable to chew',
  'serious',
  'urgent',
  'emergency',
];

// Non-dental keywords to block
const NON_DENTAL_KEYWORDS = [
  // Math & Science
  'math', 'mathematics', 'algebra', 'calculus', 'geometry', 'physics', 'chemistry',
  
  // Weather & Environment
  'weather', 'forecast', 'temperature', 'rain', 'snow', 'climate',
  
  // Technology
  'programming', 'code', 'software', 'computer', 'javascript', 'python',
  
  // Entertainment
  'movie', 'film', 'music', 'song', 'game', 'sport', 'football', 'basketball',
  
  // Food (non-dental)
  'recipe', 'cooking', 'restaurant', 'menu',
  
  // Travel
  'travel', 'flight', 'hotel', 'vacation', 'tourism',
  
  // Finance
  'stock', 'investment', 'cryptocurrency', 'bitcoin',
  
  // Politics
  'politics', 'election', 'government', 'president',
];

// Dental-related keywords to recognize
const DENTAL_KEYWORDS = [
  'tooth', 'teeth', 'dental', 'dentist', 'cavity', 'cavities', 'filling', 'crown',
  'root canal', 'extraction', 'orthodontic', 'braces', 'implant', 'denture',
  'gum', 'gums', 'gingivitis', 'periodontitis', 'plaque', 'tartar',
  'whitening', 'bleaching', 'veneer', 'bridge', 'enamel', 'decay',
  'toothache', 'pain', 'sensitivity', 'bleeding', 'swelling', 'infection',
  'oral', 'mouth', 'jaw', 'bite', 'chewing', 'smile', 'hygiene',
  'brush', 'brushing', 'floss', 'flossing', 'mouthwash', 'fluoride',
];

// Mock dental responses - represented by translation keys for localization
const DENTAL_RESPONSE_KEYS = [
  'clinicAI.responses.dentalGeneral1',
  'clinicAI.responses.dentalGeneral2',
  'clinicAI.responses.dentalGeneral3',
  'clinicAI.responses.dentalGeneral4',
];

/**
 * Check if the message indicates an emergency dental situation
 */
function isEmergencySituation(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  return EMERGENCY_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  );
}

/**
 * Check if the message is dental-related
 */
function isDentalQuestion(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Check if it contains any dental keywords
  const hasDentalKeywords = DENTAL_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  return hasDentalKeywords;
}

/**
 * Check if the message contains non-dental topics
 */
function hasNonDentalContent(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  return NON_DENTAL_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword)
  );
}

/**
 * Get a random dental response
 */
function getRandomDentalResponseKey(): string {
  const randomIndex = Math.floor(Math.random() * DENTAL_RESPONSE_KEYS.length);
  return DENTAL_RESPONSE_KEYS[randomIndex];
}

export interface AIResponse {
  success: boolean;
  messageKey: string;
  isDentalTopic: boolean;
  isEmergency?: boolean;
  category: 'emergency' | 'warning' | 'dental';
}

/**
 * Send a message to the AI dental assistant
 * Returns a mock response with dental-only topic filtering and emergency detection
 * 
 * @param message - User's question/message
 * @param language - Current app language (for localized responses)
 * @returns Promise with AI response
 */
export async function sendMessageToAI(message: string, language: string = 'en'): Promise<AIResponse> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
  
  // Check for empty message
  if (!message.trim()) {
    return {
      success: false,
      messageKey: 'clinicAI.responses.empty',
      isDentalTopic: false,
      isEmergency: false,
      category: 'warning',
    };
  }
  
  // PRIORITY 1: Check for emergency situations FIRST
  if (isEmergencySituation(message)) {
    return {
      success: true,
      messageKey: 'clinicAI.responses.emergency',
      isDentalTopic: true,
      isEmergency: true,
      category: 'emergency',
    };
  }
  
  // PRIORITY 2: Check for non-dental content
  if (hasNonDentalContent(message)) {
    return {
      success: false,
      messageKey: 'clinicAI.responses.nonDental',
      isDentalTopic: false,
      isEmergency: false,
      category: 'warning',
    };
  }
  
  // PRIORITY 3: Check if it's a dental question
  if (!isDentalQuestion(message)) {
    // Ambiguous question - could be dental or not
    // Give a gentle reminder
    return {
      success: true,
      messageKey: 'clinicAI.responses.ambiguousDental',
      isDentalTopic: true,
      isEmergency: false,
      category: 'warning',
    };
  }
  
  // PRIORITY 4: It's a dental question - provide response
  const responseKey = getRandomDentalResponseKey();
  
  return {
    success: true,
    messageKey: responseKey,
    isDentalTopic: true,
    isEmergency: false,
    category: 'dental',
  };
}

/**
 * Get initial greeting message based on language
 */
export function getInitialGreeting(language: string = 'en'): string {
  return i18n.t('clinicAI.welcome');
}

// ---- Streaming integration (SSE/chunked) ----
export interface AIStreamContext {
  userId?: string;
  role?: string; // patient | doctor | owner
  language?: string;
  clinicId?: string;
  clinicName?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  /**
   * Whether the clinic has AI Pro subscription enabled
   * If true, Cloud Function can provide advanced features
   */
  hasAIPro?: boolean;
}

export interface AIStreamOptions {
  endpoint: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  onDelta?: (text: string) => void;
  onCategory?: (category: 'dental' | 'warning' | 'emergency' | 'off-topic') => void;
}

export interface AIStreamResult {
  finalText: string;
  category?: 'dental' | 'warning' | 'emergency' | 'off-topic';
}

/**
 * sendMessageToAIStream
 * Streams an AI response from a backend endpoint (SSE or chunked JSON/text).
 * - Accumulates deltas and returns the final text when complete
 * - Supports AbortController for "Stop Generating"
 * - Passes includeAIPro flag for feature gating on backend
 */
export async function sendMessageToAIStream(
  message: string,
  context: AIStreamContext,
  options: AIStreamOptions,
  abortController?: AbortController,
): Promise<AIStreamResult> {
  const controller = abortController || new AbortController();
  const signal = controller.signal;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const body = JSON.stringify({
    message,
    user: { id: context.userId, role: context.role },
    clinic: { id: context.clinicId, name: context.clinicName },
    language: context.language || i18n.language,
    history: context.history || [],
    includeAIPro: context.hasAIPro || false, // ← AI Pro flag for backend
  });

  const response = await fetch(options.endpoint, { method: 'POST', headers, body, signal });
  if (!response.ok) {
    throw new Error(`AI stream failed: ${response.status} ${response.statusText}`);
  }

  // Handle non-streaming JSON fallback
  if (!response.body) {
    const data = await response.json().catch(() => null);
    const finalText = (data && (data.message || data.fullText)) || '';
    const category: AIStreamResult['category'] = data?.category || undefined;
    if (finalText && options.onDelta) options.onDelta(finalText);
    if (category && options.onCategory) options.onCategory(category);
    return { finalText, category };
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let finalText = '';
  let doneCategory: AIStreamResult['category'] | undefined;

  const timeout = options.timeoutMs ? setTimeout(() => controller.abort(), options.timeoutMs) : undefined;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });

      // Try parsing SSE style: lines beginning with "data:" contain JSON
      const lines = chunk.split(/\r?\n/);
      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.startsWith('data:')) {
          const jsonPart = line.slice(5).trim();
          try {
            const obj = JSON.parse(jsonPart);
            if (typeof obj.delta === 'string') {
              finalText += obj.delta;
              if (options.onDelta) options.onDelta(obj.delta);
            }
            if (obj.category && !doneCategory) {
              doneCategory = obj.category as AIStreamResult['category'];
              if (doneCategory && options.onCategory) options.onCategory(doneCategory);
            }
            if (obj.done) {
              // Stream ended via SSE 'done'
              return { finalText, category: doneCategory };
            }
          } catch {
            // Not JSON, treat as plain text delta
            finalText += jsonPart;
            if (options.onDelta) options.onDelta(jsonPart);
          }
        } else {
          // Chunked non-SSE: append raw text
          finalText += line;
          if (options.onDelta) options.onDelta(line);
        }
      }
    }
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  if (doneCategory && options.onCategory) options.onCategory(doneCategory);
  return { finalText, category: doneCategory };
}

/** Create an AbortController for Stop Generating */
export function createAIStreamAbortController(): AbortController {
  return new AbortController();
}
