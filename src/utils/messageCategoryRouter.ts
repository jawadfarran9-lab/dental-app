/**
 * Advanced Message Category Detection & Routing
 * Analyzes message content and provides smart routing decisions
 * Includes visual feedback generation and response suggestions
 */

export type MessageCategory = 'dental' | 'warning' | 'emergency' | 'informational' | 'off-topic';

export interface CategoryDetectionResult {
	category: MessageCategory;
	confidence: number; // 0-1
	keywords: string[];
	severity: 'low' | 'medium' | 'high' | 'critical';
	requiresUrgentResponse: boolean;
	suggestedAction: 'chat-response' | 'schedule-appointment' | 'emergency-referral' | 'staff-escalation';
	visualIndicator: string; // Emoji for UI display
	backgroundColor: {
		light: string;
		dark: string;
	};
	textColor: {
		light: string;
		dark: string;
	};
}

export interface RoutingDecision {
	category: MessageCategory;
	action: 'chat-response' | 'schedule-appointment' | 'emergency-referral' | 'staff-escalation';
	priority: 'normal' | 'high' | 'emergency';
	shouldNotifyStaff: boolean;
	responseDelay: number; // milliseconds
	messageTemplate: string; // Template for response
	followUpSuggestion?: string;
}

// Emergency keywords (life-threatening)
const EMERGENCY_KEYWORDS = [
	'emergency',
	'life threatening',
	'severe bleeding',
	'can\'t breathe',
	'difficulty breathing',
	'unconscious',
	'fainted',
	'swelling in throat',
	'anaphylaxis',
	'allergic reaction',
	'traumatic injury',
	'jaw fracture',
	'knocked out tooth',
	'extensive facial injury',
	'foreign object in throat',
	'persistent severe bleeding',
];

// Warning keywords (requires urgent attention)
const WARNING_KEYWORDS = [
	'severe pain',
	'unbearable pain',
	'excruciating',
	'swelling',
	'infection',
	'abscess',
	'fever',
	'bleeding',
	'bleeding gums',
	'persistent bleeding',
	'unable to swallow',
	'jaw locked',
	'can\'t open mouth',
	'jaw pain',
	'pus',
	'discharge',
	'foul smell',
	'broken tooth',
	'cracked tooth',
];

// Informational keywords (educational content)
const INFORMATIONAL_KEYWORDS = [
	'how to',
	'what is',
	'explain',
	'benefits of',
	'difference between',
	'why',
	'steps to',
	'best practices',
	'guidelines',
	'recommendations',
	'should i',
	'can i',
	'is it safe',
	'tell me about',
];

// Dental-related keywords
const DENTAL_KEYWORDS = [
	'tooth',
	'teeth',
	'dental',
	'dentist',
	'cavity',
	'cavities',
	'filling',
	'crown',
	'root canal',
	'extraction',
	'implant',
	'denture',
	'bridge',
	'gum',
	'gums',
	'gingivitis',
	'periodontitis',
	'plaque',
	'tartar',
	'whitening',
	'bleaching',
	'veneer',
	'braces',
	'orthodontic',
	'enamel',
	'decay',
	'toothache',
	'pain',
	'sensitivity',
	'bleeding',
	'swelling',
	'infection',
	'oral',
	'mouth',
	'jaw',
	'bite',
	'chewing',
	'smile',
	'hygiene',
	'brush',
	'floss',
	'mouthwash',
	'fluoride',
	'checkup',
	'cleaning',
	'scaling',
	'polish',
];

// Off-topic keywords (non-dental)
const OFFTOPIC_KEYWORDS = [
	'math',
	'physics',
	'chemistry',
	'programming',
	'code',
	'software',
	'weather',
	'sports',
	'movie',
	'music',
	'game',
	'recipe',
	'cooking',
	'travel',
	'politics',
	'stock',
	'investment',
	'cryptocurrency',
];

/**
 * Detect message category with detailed analysis
 * @param message - User message
 * @returns Detailed category detection result
 */
export function detectMessageCategory(message: string): CategoryDetectionResult {
	const lowerMessage = message.toLowerCase();
	const foundKeywords: string[] = [];

	// Score each category
	let emergencyScore = 0;
	let warningScore = 0;
	let informationalScore = 0;
	let dentalScore = 0;
	let offtopicScore = 0;

	// Check emergency keywords (highest priority)
	EMERGENCY_KEYWORDS.forEach((keyword) => {
		if (lowerMessage.includes(keyword)) {
			emergencyScore += 2; // Double weight for emergencies
			foundKeywords.push(keyword);
		}
	});

	// Check warning keywords
	WARNING_KEYWORDS.forEach((keyword) => {
		if (lowerMessage.includes(keyword)) {
			warningScore += 1;
			foundKeywords.push(keyword);
		}
	});

	// Check informational keywords
	INFORMATIONAL_KEYWORDS.forEach((keyword) => {
		if (lowerMessage.includes(keyword)) {
			informationalScore += 1;
			foundKeywords.push(keyword);
		}
	});

	// Check dental keywords
	DENTAL_KEYWORDS.forEach((keyword) => {
		if (lowerMessage.includes(keyword)) {
			dentalScore += 1;
			foundKeywords.push(keyword);
		}
	});

	// Check off-topic keywords
	OFFTOPIC_KEYWORDS.forEach((keyword) => {
		if (lowerMessage.includes(keyword)) {
			offtopicScore += 1;
			foundKeywords.push(keyword);
		}
	});

	// Determine final category based on scores
	let category: MessageCategory = 'off-topic';
	let confidence = 0;
	let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
	let suggestedAction: 'chat-response' | 'schedule-appointment' | 'emergency-referral' | 'staff-escalation' =
		'chat-response';
	let requiresUrgentResponse = false;

	if (emergencyScore > 0) {
		category = 'emergency';
		severity = 'critical';
		confidence = Math.min(1, emergencyScore / 2);
		suggestedAction = 'emergency-referral';
		requiresUrgentResponse = true;
	} else if (warningScore > 0 && warningScore >= dentalScore / 2) {
		category = 'warning';
		severity = 'high';
		confidence = Math.min(1, warningScore / WARNING_KEYWORDS.length);
		suggestedAction = 'staff-escalation';
		requiresUrgentResponse = true;
	} else if (informationalScore > 0 && dentalScore > 0) {
		category = 'informational';
		severity = 'low';
		confidence = Math.min(1, (informationalScore + dentalScore) / 20);
		suggestedAction = 'chat-response';
	} else if (dentalScore > offtopicScore) {
		category = 'dental';
		severity = 'low';
		confidence = Math.min(1, dentalScore / DENTAL_KEYWORDS.length);
		suggestedAction = 'chat-response';
	} else if (message.length < 10) {
		// Very short messages are less reliable
		category = 'off-topic';
		confidence = 0.3;
	}

	// Ensure confidence is at least 0.5 if any keywords found
	if (foundKeywords.length > 0 && confidence < 0.5) {
		confidence = 0.5;
	}

	return {
		category,
		confidence,
		keywords: foundKeywords.slice(0, 5), // Top 5 keywords
		severity,
		requiresUrgentResponse,
		suggestedAction,
		visualIndicator: getVisualIndicator(category),
		backgroundColor: getBackgroundColor(category),
		textColor: getTextColor(category),
	};
}

/**
 * Get emoji indicator for category
 */
function getVisualIndicator(category: MessageCategory): string {
	switch (category) {
		case 'emergency':
			return '🚨'; // Red alert siren
		case 'warning':
			return '⚠️'; // Warning triangle
		case 'dental':
			return '🦷'; // Tooth
		case 'informational':
			return 'ℹ️'; // Info symbol
		case 'off-topic':
		default:
			return '💬'; // Speech bubble
	}
}

/**
 * Get background color for message category (light & dark mode)
 */
function getBackgroundColor(category: MessageCategory): { light: string; dark: string } {
	switch (category) {
		case 'emergency':
			return {
				light: '#fee2e2', // Light red
				dark: '#7f1d1d', // Dark red
			};
		case 'warning':
			return {
				light: '#fef3c7', // Light amber
				dark: '#78350f', // Dark brown
			};
		case 'dental':
			return {
				light: '#dbeafe', // Light blue
				dark: '#1e3a8a', // Dark blue
			};
		case 'informational':
			return {
				light: '#e0f2fe', // Light cyan
				dark: '#0c2d48', // Dark cyan
			};
		case 'off-topic':
		default:
			return {
				light: '#f3f4f6', // Light gray
				dark: '#374151', // Dark gray
			};
	}
}

/**
 * Get text color for message category (light & dark mode)
 */
function getTextColor(category: MessageCategory): { light: string; dark: string } {
	switch (category) {
		case 'emergency':
			return {
				light: '#991b1b', // Dark red text
				dark: '#fecaca', // Light red text
			};
		case 'warning':
			return {
				light: '#78350f', // Dark brown text
				dark: '#fef08a', // Light yellow text
			};
		case 'dental':
			return {
				light: '#0c4a6e', // Dark blue text
				dark: '#e0f2fe', // Light blue text
			};
		case 'informational':
			return {
				light: '#164e63', // Dark cyan text
				dark: '#cffafe', // Light cyan text
			};
		case 'off-topic':
		default:
			return {
				light: '#374151', // Dark gray text
				dark: '#f3f4f6', // Light gray text
			};
	}
}

/**
 * Make routing decision based on detected category
 */
export function makeRoutingDecision(
	category: MessageCategory,
	severity: 'low' | 'medium' | 'high' | 'critical',
): RoutingDecision {
	switch (category) {
		case 'emergency':
			return {
				category,
				action: 'emergency-referral',
				priority: 'emergency',
				shouldNotifyStaff: true,
				responseDelay: 0,
				messageTemplate: 'emergency-response',
				followUpSuggestion: 'Call 911 or your nearest emergency dental clinic immediately',
			};

		case 'warning':
			return {
				category,
				action: 'staff-escalation',
				priority: 'high',
				shouldNotifyStaff: true,
				responseDelay: 0,
				messageTemplate: 'warning-response',
				followUpSuggestion: 'Please schedule an urgent appointment with your dentist',
			};

		case 'informational':
			return {
				category,
				action: 'chat-response',
				priority: 'normal',
				shouldNotifyStaff: false,
				responseDelay: 500,
				messageTemplate: 'informational-response',
				followUpSuggestion: 'For personalized advice, consult your dentist',
			};

		case 'dental':
			return {
				category,
				action: 'chat-response',
				priority: 'normal',
				shouldNotifyStaff: false,
				responseDelay: 500,
				messageTemplate: 'dental-response',
				followUpSuggestion: 'Schedule a checkup if you have ongoing concerns',
			};

		case 'off-topic':
		default:
			return {
				category: 'off-topic',
				action: 'chat-response',
				priority: 'normal',
				shouldNotifyStaff: false,
				responseDelay: 500,
				messageTemplate: 'offtopic-response',
			};
	}
}

/**
 * Calculate message sentiment/urgency
 * Returns a score 0-1 where 1 is most urgent
 */
export function calculateUrgencyScore(message: string): number {
	const lowerMessage = message.toLowerCase();

	// Count different intensity words
	const criticalWords = [
		'emergency',
		'severe',
		'urgent',
		'immediately',
		'can\'t breathe',
		'unconscious',
	].filter((word) => lowerMessage.includes(word)).length;

	const highWords = ['pain', 'bleeding', 'infection', 'swelling', 'asap'].filter((word) =>
		lowerMessage.includes(word),
	).length;

	const questionMarks = (message.match(/\?/g) || []).length;
	const exclamationMarks = (message.match(/!/g) || []).length;

	// Calculate score
	let score = 0;
	score += criticalWords * 0.5;
	score += highWords * 0.2;
	score += Math.min(exclamationMarks * 0.1, 0.3);

	return Math.min(score, 1);
}

/**
 * Get response priority based on urgency
 */
export function getResponsePriority(urgencyScore: number): 'low' | 'normal' | 'high' | 'emergency' {
	if (urgencyScore >= 0.8) return 'emergency';
	if (urgencyScore >= 0.5) return 'high';
	if (urgencyScore >= 0.2) return 'normal';
	return 'low';
}
