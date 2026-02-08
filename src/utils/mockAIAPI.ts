/**
 * Mock AI Chat API Utility
 * Simulates Cloud Function responses for development
 * Replace with real API endpoint when Cloud Function is deployed
 */

export interface AIRequest {
  message: string;
  userId?: string;
  clinicId?: string;
  language?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface AIResponse {
  message: string;
  category: 'dental' | 'warning' | 'emergency' | 'off-topic';
  confidence: number;
  timestamp: number;
}

// Mock AI responses database
const mockResponses: Record<string, { reply: string; category: 'dental' | 'warning' | 'emergency' | 'off-topic' }[]> = {
  default: [
    {
      reply: 'This is helpful information about your dental question. Please consult with a licensed dentist for personalized advice.',
      category: 'dental',
    },
    {
      reply: 'I can provide general dental information. For specific concerns, please visit your dentist.',
      category: 'dental',
    },
    {
      reply: 'That\'s a common dental question. Here are some general guidelines...',
      category: 'dental',
    },
  ],
  pain: [
    {
      reply: 'Dental pain can indicate several conditions. Please see a dentist as soon as possible.',
      category: 'warning',
    },
    {
      reply: 'If you\'re experiencing severe dental pain, you should seek immediate dental care.',
      category: 'emergency',
    },
    {
      reply: 'Pain in your mouth should be evaluated by a professional dentist.',
      category: 'warning',
    },
  ],
  bleeding: [
    {
      reply: 'Bleeding gums may indicate gum disease. Please schedule an appointment with your dentist.',
      category: 'warning',
    },
    {
      reply: 'Persistent bleeding should be evaluated by a dental professional.',
      category: 'warning',
    },
  ],
  emergency: [
    {
      reply: 'This sounds like an emergency. Please go to an emergency dental clinic or hospital immediately.',
      category: 'emergency',
    },
    {
      reply: 'For urgent dental issues, please seek immediate emergency dental care.',
      category: 'emergency',
    },
  ],
};

/**
 * Detect message category based on keywords
 */
function detectCategory(message: string): 'dental' | 'warning' | 'emergency' | 'off-topic' {
  const lowerMessage = message.toLowerCase();

  // Emergency keywords
  const emergencyKeywords = ['loss of consciousness', 'severe bleeding', 'facial swelling', 'can\'t breathe', 'trauma', 'accident', 'broken tooth', 'knocked out'];
  if (emergencyKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'emergency';
  }

  // Warning keywords
  const warningKeywords = ['pain', 'bleeding', 'infection', 'abscess', 'swollen', 'severe', 'worst', 'urgent', 'cannot', 'cant'];
  if (warningKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'warning';
  }

  // General dental keywords
  const dentalKeywords = ['teeth', 'tooth', 'dental', 'gum', 'cavity', 'floss', 'brush', 'crown', 'filling', 'root canal', 'cleaning', 'implant', 'braces', 'orthodont'];
  if (dentalKeywords.some(kw => lowerMessage.includes(kw))) {
    return 'dental';
  }

  return 'off-topic';
}

/**
 * Select appropriate response based on message category
 */
function selectResponse(category: 'dental' | 'warning' | 'emergency' | 'off-topic'): { reply: string; category: 'dental' | 'warning' | 'emergency' | 'off-topic' } {
  let responses: typeof mockResponses['default'];

  switch (category) {
    case 'warning':
      responses = mockResponses.bleeding;
      break;
    case 'emergency':
      responses = mockResponses.emergency;
      break;
    default:
      responses = mockResponses.default;
  }

  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Simulate streaming response by returning chunks
 */
function* generateStreamChunks(text: string, chunkSize: number = 15): Generator<string> {
  for (let i = 0; i < text.length; i += chunkSize) {
    yield text.slice(i, i + chunkSize);
  }
}

/**
 * Mock AI Chat API - simulates Cloud Function /ai-chat endpoint
 * @param request - AI request payload
 * @param onChunk - Callback for each streamed chunk
 * @param signal - AbortSignal for cancellation
 * @returns Promise<AIResponse>
 */
export async function mockAIChatAPI(
  request: AIRequest,
  onChunk?: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<AIResponse> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Check for abort
  if (signal?.aborted) {
    throw new DOMException('API call aborted', 'AbortError');
  }

  // Detect message category
  const category = detectCategory(request.message);

  // Select appropriate response
  const { reply, category: responseCategory } = selectResponse(category);

  // Simulate streaming the response
  if (onChunk) {
    const chunks = Array.from(generateStreamChunks(reply, 10 + Math.random() * 20));
    for (const chunk of chunks) {
      // Check for abort between chunks
      if (signal?.aborted) {
        throw new DOMException('API call aborted', 'AbortError');
      }

      onChunk(chunk);
      // Simulate delay between chunks
      await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    }
  }

  return {
    message: reply,
    category: responseCategory,
    confidence: 0.85 + Math.random() * 0.15,
    timestamp: Date.now(),
  };
}

/**
 * Fallback error messages for different error types
 */
export function getFallbackMessage(errorType: 'timeout' | 'network' | 'parse' | 'unknown'): string {
  const messages = {
    timeout: 'The request took too long. Please try again.',
    network: 'Network error. Please check your connection and try again.',
    parse: 'Invalid response from the AI service. Please try again.',
    unknown: 'Something went wrong. Please try again later.',
  };
  return messages[errorType];
}
