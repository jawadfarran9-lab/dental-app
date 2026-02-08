/**
 * useConversationManager Hook
 * Manages conversation lifecycle: create, rename, archive, clear, delete
 * Handles conversation persistence and retrieval
 */

import i18n from '@/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export interface ChatMessage {
	id: string;
	text: string;
	sender: 'user' | 'ai';
	timestamp?: number;
	category?: 'dental' | 'warning' | 'emergency' | 'off-topic';
}

export interface ConversationMetadata {
	id: string;
	title: string;
	createdAt: number;
	updatedAt: number;
	archived: boolean;
	messageCount: number;
	category?: string; // Most common category
}

interface UseConversationManagerResult {
	conversations: ConversationMetadata[];
	currentConversationId: string | null;
	isLoading: boolean;
	error: string | null;
	getConversation: (id: string) => Promise<ChatMessage[]>;
	createConversation: (title: string) => Promise<string>;
	renameConversation: (id: string, newTitle: string) => Promise<void>;
	archiveConversation: (id: string) => Promise<void>;
	unarchiveConversation: (id: string) => Promise<void>;
	deleteConversation: (id: string) => Promise<void>;
	clearConversation: (id: string) => Promise<void>;
	saveMessage: (conversationId: string, message: ChatMessage) => Promise<void>;
	setCurrentConversation: (id: string) => Promise<void>;
	exportConversation: (id: string, format: 'json' | 'csv' | 'txt') => Promise<string>;
}

const STORAGE_PREFIX = 'conversation';
const CONVERSATIONS_LIST_KEY = 'conversations:list';
const CURRENT_CONVERSATION_KEY = 'conversation:current';

export function useConversationManager(): UseConversationManagerResult {
	const [conversations, setConversations] = useState<ConversationMetadata[]>([]);
	const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const language = i18n.language;

	// Load conversations list on mount
	useEffect(() => {
		const loadConversations = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Load conversations list
				const listData = await AsyncStorage.getItem(
					`${CONVERSATIONS_LIST_KEY}:${language}`,
				);
				const list: ConversationMetadata[] = listData
					? JSON.parse(listData)
					: [];

				setConversations(list);

				// Load current conversation ID
				const currentId = await AsyncStorage.getItem(
					`${CURRENT_CONVERSATION_KEY}:${language}`,
				);
				setCurrentConversationId(currentId);
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to load conversations';
				setError(errorMsg);
				setConversations([]);
			} finally {
				setIsLoading(false);
			}
		};

		loadConversations();
	}, [language]);

	// Get conversation messages
	const getConversation = useCallback(
		async (id: string): Promise<ChatMessage[]> => {
			try {
				const key = `${STORAGE_PREFIX}:${id}:messages:${language}`;
				const data = await AsyncStorage.getItem(key);
				return data ? JSON.parse(data) : [];
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to get conversation';
				setError(errorMsg);
				return [];
			}
		},
		[language],
	);

	// Create new conversation
	const createConversation = useCallback(
		async (title: string): Promise<string> => {
			try {
				const id = `conv-${Date.now()}`;
				const metadata: ConversationMetadata = {
					id,
					title,
					createdAt: Date.now(),
					updatedAt: Date.now(),
					archived: false,
					messageCount: 0,
				};

				// Add to list
				const updatedConversations = [metadata, ...conversations];
				await AsyncStorage.setItem(
					`${CONVERSATIONS_LIST_KEY}:${language}`,
					JSON.stringify(updatedConversations),
				);

				// Initialize empty messages
				const key = `${STORAGE_PREFIX}:${id}:messages:${language}`;
				await AsyncStorage.setItem(key, JSON.stringify([]));

				setConversations(updatedConversations);
				return id;
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to create conversation';
				setError(errorMsg);
				throw err;
			}
		},
		[conversations, language],
	);

	// Rename conversation
	const renameConversation = useCallback(
		async (id: string, newTitle: string): Promise<void> => {
			try {
				const updated = conversations.map((conv) =>
					conv.id === id
						? { ...conv, title: newTitle, updatedAt: Date.now() }
						: conv,
				);

				await AsyncStorage.setItem(
					`${CONVERSATIONS_LIST_KEY}:${language}`,
					JSON.stringify(updated),
				);

				setConversations(updated);
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to rename conversation';
				setError(errorMsg);
				throw err;
			}
		},
		[conversations, language],
	);

	// Archive conversation
	const archiveConversation = useCallback(
		async (id: string): Promise<void> => {
			try {
				const updated = conversations.map((conv) =>
					conv.id === id
						? { ...conv, archived: true, updatedAt: Date.now() }
						: conv,
				);

				await AsyncStorage.setItem(
					`${CONVERSATIONS_LIST_KEY}:${language}`,
					JSON.stringify(updated),
				);

				setConversations(updated);
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to archive conversation';
				setError(errorMsg);
				throw err;
			}
		},
		[conversations, language],
	);

	// Unarchive conversation
	const unarchiveConversation = useCallback(
		async (id: string): Promise<void> => {
			try {
				const updated = conversations.map((conv) =>
					conv.id === id
						? { ...conv, archived: false, updatedAt: Date.now() }
						: conv,
				);

				await AsyncStorage.setItem(
					`${CONVERSATIONS_LIST_KEY}:${language}`,
					JSON.stringify(updated),
				);

				setConversations(updated);
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to unarchive conversation';
				setError(errorMsg);
				throw err;
			}
		},
		[conversations, language],
	);

	// Delete conversation
	const deleteConversation = useCallback(
		async (id: string): Promise<void> => {
			try {
				// Remove from list
				const updated = conversations.filter((conv) => conv.id !== id);
				await AsyncStorage.setItem(
					`${CONVERSATIONS_LIST_KEY}:${language}`,
					JSON.stringify(updated),
				);

				// Delete messages
				const key = `${STORAGE_PREFIX}:${id}:messages:${language}`;
				await AsyncStorage.removeItem(key);

				// Clear current if it's this conversation
				if (currentConversationId === id) {
					await AsyncStorage.removeItem(`${CURRENT_CONVERSATION_KEY}:${language}`);
					setCurrentConversationId(null);
				}

				setConversations(updated);
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to delete conversation';
				setError(errorMsg);
				throw err;
			}
		},
		[conversations, currentConversationId, language],
	);

	// Clear all messages in conversation
	const clearConversation = useCallback(
		async (id: string): Promise<void> => {
			try {
				// Clear messages
				const key = `${STORAGE_PREFIX}:${id}:messages:${language}`;
				await AsyncStorage.setItem(key, JSON.stringify([]));

				// Update metadata
				const updated = conversations.map((conv) =>
					conv.id === id
						? { ...conv, messageCount: 0, updatedAt: Date.now() }
						: conv,
				);

				await AsyncStorage.setItem(
					`${CONVERSATIONS_LIST_KEY}:${language}`,
					JSON.stringify(updated),
				);

				setConversations(updated);
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to clear conversation';
				setError(errorMsg);
				throw err;
			}
		},
		[conversations, language],
	);

	// Save message to conversation
	const saveMessage = useCallback(
		async (conversationId: string, message: ChatMessage): Promise<void> => {
			try {
				// Add timestamp if not present
				const messageWithTime = {
					...message,
					timestamp: message.timestamp || Date.now(),
				};

				// Get existing messages
				const key = `${STORAGE_PREFIX}:${conversationId}:messages:${language}`;
				const data = await AsyncStorage.getItem(key);
				const messages: ChatMessage[] = data ? JSON.parse(data) : [];

				// Add new message
				messages.push(messageWithTime);
				await AsyncStorage.setItem(key, JSON.stringify(messages));

				// Update metadata
				const updated = conversations.map((conv) =>
					conv.id === conversationId
						? {
								...conv,
								messageCount: messages.length,
								updatedAt: Date.now(),
								category: messageWithTime.category,
							}
						: conv,
				);

				await AsyncStorage.setItem(
					`${CONVERSATIONS_LIST_KEY}:${language}`,
					JSON.stringify(updated),
				);

				setConversations(updated);
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to save message';
				setError(errorMsg);
				throw err;
			}
		},
		[conversations, language],
	);

	// Set current conversation
	const setCurrentConversation = useCallback(
		async (id: string): Promise<void> => {
			try {
				await AsyncStorage.setItem(`${CURRENT_CONVERSATION_KEY}:${language}`, id);
				setCurrentConversationId(id);
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to set current conversation';
				setError(errorMsg);
				throw err;
			}
		},
		[language],
	);

	// Export conversation
	const exportConversation = useCallback(
		async (id: string, format: 'json' | 'csv' | 'txt'): Promise<string> => {
			try {
				const messages = await getConversation(id);
				const metadata = conversations.find((c) => c.id === id);

				switch (format) {
					case 'json':
						return JSON.stringify(
							{
								metadata,
								messages,
								exportDate: new Date().toISOString(),
							},
							null,
							2,
						);

					case 'csv': {
						const headers = 'Timestamp,Sender,Message,Category';
						const rows = messages
							.map((msg) => [
								new Date(msg.timestamp || 0).toISOString(),
								msg.sender,
								`"${msg.text.replace(/"/g, '""')}"`,
								msg.category || 'N/A',
							])
							.map((row) => row.join(','));

						return [headers, ...rows].join('\n');
					}

					case 'txt':
					default: {
						const lines = [
							metadata?.title || 'Conversation Export',
							`Exported: ${new Date().toLocaleString()}`,
							`Messages: ${messages.length}`,
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
						];

						return lines.join('\n');
					}
				}
			} catch (err) {
				const errorMsg = err instanceof Error ? err.message : 'Failed to export conversation';
				setError(errorMsg);
				throw err;
			}
		},
		[conversations, getConversation],
	);

	return {
		conversations: conversations.filter((c) => !c.archived),
		currentConversationId,
		isLoading,
		error,
		getConversation,
		createConversation,
		renameConversation,
		archiveConversation,
		unarchiveConversation,
		deleteConversation,
		clearConversation,
		saveMessage,
		setCurrentConversation,
		exportConversation,
	};
}
