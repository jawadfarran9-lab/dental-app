/**
 * Message Search & Filter Utility
 * Provides search, filtering, and conversation management for AI chat messages
 */

export interface ChatMessage {
	id: string;
	text: string;
	sender: 'user' | 'ai';
	timestamp?: number;
	category?: 'dental' | 'warning' | 'emergency' | 'off-topic';
	isWarning?: boolean;
	isEmergency?: boolean;
}

export interface Conversation {
	id: string;
	title: string;
	messages: ChatMessage[];
	createdAt: number;
	updatedAt: number;
	archived: boolean;
}

export interface SearchResult {
	messageId: string;
	conversationId: string;
	text: string;
	sender: 'user' | 'ai';
	matchIndices: number[]; // Character positions where match occurs
	context: string; // Message with context
}

/**
 * Search messages by keyword
 * @param messages - Array of messages to search
 * @param query - Search query (case-insensitive)
 * @param conversationId - Optional conversation ID for results
 * @returns Array of matching results with context
 */
export function searchMessages(
	messages: ChatMessage[],
	query: string,
	conversationId: string = 'current',
): SearchResult[] {
	if (!query.trim()) return [];

	const lowerQuery = query.toLowerCase();
	const results: SearchResult[] = [];

	messages.forEach((msg) => {
		const lowerText = msg.text.toLowerCase();
		const indices: number[] = [];
		let index = 0;

		// Find all occurrences
		while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
			indices.push(index);
			index += lowerQuery.length;
		}

		if (indices.length > 0) {
			results.push({
				messageId: msg.id,
				conversationId,
				text: msg.text,
				sender: msg.sender,
				matchIndices: indices,
				context: getMessageContext(msg.text, indices[0], lowerQuery.length),
			});
		}
	});

	return results;
}

/**
 * Filter messages by category
 * @param messages - Array of messages
 * @param category - Category to filter by
 * @returns Filtered messages
 */
export function filterByCategory(
	messages: ChatMessage[],
	category: ChatMessage['category'],
): ChatMessage[] {
	return messages.filter((msg) => msg.category === category);
}

/**
 * Filter messages by sender
 * @param messages - Array of messages
 * @param sender - 'user' or 'ai'
 * @returns Filtered messages
 */
export function filterBySender(
	messages: ChatMessage[],
	sender: 'user' | 'ai',
): ChatMessage[] {
	return messages.filter((msg) => msg.sender === sender);
}

/**
 * Filter messages by date range
 * @param messages - Array of messages
 * @param startDate - Start timestamp
 * @param endDate - End timestamp
 * @returns Filtered messages
 */
export function filterByDateRange(
	messages: ChatMessage[],
	startDate: number,
	endDate: number,
): ChatMessage[] {
	return messages.filter((msg) => {
		const timestamp = msg.timestamp || 0;
		return timestamp >= startDate && timestamp <= endDate;
	});
}

/**
 * Get context around search match
 * @param text - Full message text
 * @param matchStart - Start position of match
 * @param matchLength - Length of match
 * @param contextLength - Characters to include before/after
 * @returns Context string with ellipsis if needed
 */
function getMessageContext(
	text: string,
	matchStart: number,
	matchLength: number,
	contextLength: number = 50,
): string {
	const start = Math.max(0, matchStart - contextLength);
	const end = Math.min(text.length, matchStart + matchLength + contextLength);

	let context = text.substring(start, end);
	if (start > 0) context = '...' + context;
	if (end < text.length) context = context + '...';

	return context;
}

/**
 * Group messages by category for statistics
 * @param messages - Array of messages
 * @returns Object with category counts
 */
export function getStatistics(messages: ChatMessage[]) {
	const stats = {
		total: messages.length,
		userMessages: 0,
		aiMessages: 0,
		dental: 0,
		warning: 0,
		emergency: 0,
		offtopic: 0,
	};

	messages.forEach((msg) => {
		if (msg.sender === 'user') {
			stats.userMessages++;
		} else {
			stats.aiMessages++;
		}

		switch (msg.category) {
			case 'dental':
				stats.dental++;
				break;
			case 'warning':
				stats.warning++;
				break;
			case 'emergency':
				stats.emergency++;
				break;
			case 'off-topic':
				stats.offtopic++;
				break;
		}
	});

	return stats;
}

/**
 * Get conversation summary
 * @param messages - Array of messages
 * @param maxLength - Max characters for summary
 * @returns Summary string
 */
export function getConversationSummary(
	messages: ChatMessage[],
	maxLength: number = 100,
): string {
	if (messages.length === 0) return '';

	// Get first few user messages
	const userMessages = filterBySender(messages, 'user')
		.slice(0, 2)
		.map((m) => m.text.substring(0, 50))
		.join(' • ');

	if (userMessages.length > maxLength) {
		return userMessages.substring(0, maxLength) + '...';
	}

	return userMessages;
}

/**
 * Sort messages by date
 * @param messages - Array of messages
 * @param descending - Sort in descending order (newest first)
 * @returns Sorted messages
 */
export function sortByDate(
	messages: ChatMessage[],
	descending: boolean = false,
): ChatMessage[] {
	const sorted = [...messages].sort((a, b) => {
		const timeA = a.timestamp || 0;
		const timeB = b.timestamp || 0;
		return descending ? timeB - timeA : timeA - timeB;
	});

	return sorted;
}

/**
 * Export messages to CSV format
 * @param messages - Array of messages to export
 * @param conversationTitle - Optional title for export
 * @returns CSV string
 */
export function exportToCSV(
	messages: ChatMessage[],
	conversationTitle: string = 'AI Chat Export',
): string {
	const headers = ['Timestamp', 'Sender', 'Message', 'Category'];
	const rows = messages.map((msg) => [
		new Date(msg.timestamp || 0).toISOString(),
		msg.sender,
		`"${msg.text.replace(/"/g, '""')}"`, // Escape quotes
		msg.category || 'N/A',
	]);

	const csv = [
		[conversationTitle],
		[''], // Empty line
		headers,
		...rows,
	]
		.map((row) => row.join(','))
		.join('\n');

	return csv;
}

/**
 * Export messages to plain text format
 * @param messages - Array of messages to export
 * @param conversationTitle - Optional title for export
 * @returns Text string
 */
export function exportToText(
	messages: ChatMessage[],
	conversationTitle: string = 'AI Chat Export',
): string {
	const timestamp = new Date().toLocaleString();
	const stats = getStatistics(messages);

	const text = [
		`${conversationTitle}`,
		`Exported on: ${timestamp}`,
		`Messages: ${stats.total} (User: ${stats.userMessages}, AI: ${stats.aiMessages})`,
		`Categories: Dental(${stats.dental}) | Warning(${stats.warning}) | Emergency(${stats.emergency})`,
		'',
		'---',
		'',
		...messages.map((msg) => {
			const time = msg.timestamp
				? new Date(msg.timestamp).toLocaleTimeString()
				: '';
			const sender = msg.sender.toUpperCase();
			const category = msg.category ? ` [${msg.category}]` : '';
			return `${time} ${sender}${category}:\n${msg.text}`;
		}),
	].join('\n');

	return text;
}

/**
 * Generate PDF export (returns base64 encoded content)
 * For actual PDF generation, integrate with a PDF library like react-native-pdf-lib
 * @param messages - Array of messages to export
 * @param conversationTitle - Optional title
 * @returns Formatted text for PDF conversion
 */
export function generatePDFContent(
	messages: ChatMessage[],
	conversationTitle: string = 'AI Chat Export',
): string {
	return exportToText(messages, conversationTitle);
}

/**
 * Create backup of conversation
 * @param conversation - Conversation object
 * @returns JSON string of conversation
 */
export function createConversationBackup(conversation: Conversation): string {
	return JSON.stringify(
		{
			...conversation,
			exportDate: new Date().toISOString(),
		},
		null,
		2,
	);
}

/**
 * Restore conversation from backup
 * @param backupJson - JSON backup string
 * @returns Restored conversation
 */
export function restoreConversationFromBackup(backupJson: string): Conversation {
	const backup = JSON.parse(backupJson);
	delete backup.exportDate; // Remove metadata

	return backup as Conversation;
}
