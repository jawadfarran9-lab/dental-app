import { AI_CHAT_ENDPOINT, AI_TIMEOUT_MS } from '@/app/config';
import i18n from '@/i18n';
import { AIProFeatureTooltip } from '@/src/components/AIProFeatureTooltip';
import { AIProUpgradePrompt } from '@/src/components/AIProUpgradePrompt';
import { useTheme } from '@/src/context/ThemeContext';
import { useAIProStatus } from '@/src/hooks/useAIProStatus';
import { useAuth } from '@/src/hooks/useAuth';
import { useSubscriptionStatus } from '@/src/hooks/useSubscriptionStatus';
import { createAIStreamAbortController, sendMessageToAIStream } from '@/src/utils/aiAssistant';
import {
    trackAIChatStarted,
    trackAIFeatureUsed,
    trackUpgradePromptShown,
} from '@/src/utils/aiProAnalytics';
import { getFallbackMessage, mockAIChatAPI } from '@/src/utils/mockAIAPI';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface ChatMessage {
	id: string;
	text: string;
	sender: 'user' | 'ai';
	isWarning?: boolean;
	isEmergency?: boolean;
	category?: 'dental' | 'warning' | 'emergency' | 'off-topic';
}

export default function AIChatScreen() {
	const router = useRouter();
	const { colors } = useTheme();
	const { t } = useTranslation();
	const { userRole, clinicId: clinicIdRaw } = useAuth();
	const clinicId = clinicIdRaw ?? undefined;
	const { hasAIAccess, tier, isLoading: subLoading } = useSubscriptionStatus();
	const { hasAIPro, isLoading: aiProLoading } = useAIProStatus();
	const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
	const styles = useMemo(() => createStyles(colors, isRTL), [colors, isRTL]);

	const storageKey = useMemo(() => `aiChatHistory:${i18n.language}`, [i18n.language]);

	const welcomeMessage: ChatMessage = useMemo(
		() => ({
			id: 'welcome',
			text: t('clinicAI.welcome'),
			sender: 'ai',
			category: 'dental',
		}),
		[t, i18n.language],
	);

	const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
	const [inputText, setInputText] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [hasHydrated, setHasHydrated] = useState(false);
	const [streamingText, setStreamingText] = useState('');
	const [streamingCategory, setStreamingCategory] = useState<'dental' | 'warning' | 'emergency' | 'off-topic' | null>(null);
	const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
	const [showProTooltip, setShowProTooltip] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Track when upgrade prompt is shown (non-Pro users trying to chat)
	useEffect(() => {
		if (showUpgradePrompt && clinicId) {
			trackUpgradePromptShown(clinicId).catch(() => {});
		}
	}, [showUpgradePrompt, clinicId]);

	// Track when chat is started (first message sent)
	useEffect(() => {
		if (hasHydrated && messages.length > 2 && clinicId) {
			// More than welcome message + at least one user message
			trackAIChatStarted(clinicId).catch(() => {});
		}
	}, [hasHydrated, messages.length, clinicId]);

	// Track when AI Pro feature is used (Pro response received)
	useEffect(() => {
		if (hasAIPro && streamingText.length > 0 && clinicId) {
			trackAIFeatureUsed('detailed-analysis', clinicId).catch(() => {});
			// Show Pro feature tooltip on first Pro response
			setShowProTooltip(true);
		}
	}, [hasAIPro, streamingText, clinicId]);

	useEffect(() => {
		let isMounted = true;
		(async () => {
			try {
				const stored = await AsyncStorage.getItem(storageKey);
				if (stored) {
					const parsed = JSON.parse(stored);
					if (isMounted && Array.isArray(parsed) && parsed.length) {
						setMessages(parsed);
						setHasHydrated(true);
						return;
					}
				}
			} catch (error) {
				// Silently handle errors - fallback to default message
			}
			if (isMounted) {
				setMessages([welcomeMessage]);
				setHasHydrated(true);
			}
		})();

		return () => {
			isMounted = false;
		};
	}, [storageKey, welcomeMessage]);

	useEffect(() => {
		if (!hasHydrated) return;
		AsyncStorage.setItem(storageKey, JSON.stringify(messages)).catch(() => {
			// Silently handle persistence errors
		});
	}, [messages, hasHydrated, storageKey]);

	useEffect(() => {
		if (!hasHydrated) return;
		if (messages.length === 1 && messages[0]?.id === 'welcome') {
			setMessages([welcomeMessage]);
		}
	}, [welcomeMessage, hasHydrated]);

	const handleSend = async () => {
		if (!inputText.trim() || isLoading) return;

		const userMessage = inputText.trim();

		const userMsg: ChatMessage = {
			id: `${Date.now()}-user`,
			text: userMessage,
			sender: 'user',
			category: 'off-topic',
		};
		setMessages((prev) => [...prev, userMsg]);
		setInputText('');
		setIsLoading(true);
		setStreamingText('');
		setStreamingCategory(null);

		// Create abort controller for Stop button
		const controller = createAIStreamAbortController();
		abortControllerRef.current = controller;

		try {
			// Build conversation history for context
			const history = messages
				.filter(m => m.id !== 'welcome')
				.map(m => ({
					role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
					content: m.text,
				}));

			// Determine which API to use (real or mock)
			const useRealAPI = !!AI_CHAT_ENDPOINT && !AI_CHAT_ENDPOINT.includes('undefined');

			let finalCategory: ChatMessage['category'] = 'dental';
			let finalText = '';

			if (useRealAPI) {
				// Use real Cloud Function
				try {
					const result = await sendMessageToAIStream(
						userMessage,
						{
							userId: 'patient',
							role: 'patient',
							language: i18n.language,
							clinicId,
							clinicName: undefined,
							history,
							hasAIPro, // ← Pass AI Pro status to backend
						},
						{
							endpoint: AI_CHAT_ENDPOINT,
							headers: undefined,
							timeoutMs: AI_TIMEOUT_MS,
							onDelta: (delta) => {
								setStreamingText((prev) => prev + delta);
							},
							onCategory: (cat) => {
								setStreamingCategory(cat);
							},
						},
						controller,
					);

					finalCategory = result.category || streamingCategory || 'dental';
					finalText = result.finalText || streamingText;
				} catch (apiError: any) {
					if (apiError.name === 'AbortError') {
						throw apiError;
					}
					// Fallback to mock API on real API failure
					await useMockAPI();
				}
			} else {
				// Use mock API for development
				await useMockAPI();
			}

			// Helper function to use mock API
			async function useMockAPI() {
				const response = await mockAIChatAPI(
					{
						message: userMessage,
						userId: 'patient',
						language: i18n.language,
						clinicId,
					},
					(chunk) => {
						setStreamingText((prev) => prev + chunk);
					},
					controller.signal,
				);

				finalCategory = response.category;
				finalText = response.message;
			}

			// Add final AI message
			const aiMsg: ChatMessage = {
				id: `${Date.now()}-ai`,
				text: finalText,
				sender: 'ai',
				isWarning: finalCategory !== 'dental',
				isEmergency: finalCategory === 'emergency',
				category: finalCategory,
			};

			setMessages((prev) => [...prev, aiMsg]);
			setStreamingText('');
			setStreamingCategory(null);

		} catch (error: any) {
			// If aborted by user, don't show error
			if (error.name === 'AbortError') {
				// Save partial response if exists
				if (streamingText) {
					const partialMsg: ChatMessage = {
						id: `${Date.now()}-ai-partial`,
						text: streamingText,
						sender: 'ai',
						category: streamingCategory || 'dental',
					};
					setMessages((prev) => [...prev, partialMsg]);
				}
				setStreamingText('');
				setStreamingCategory(null);
			} else {
				// Determine error type and show appropriate fallback
				let errorType: 'timeout' | 'network' | 'parse' | 'unknown' = 'unknown';
				
				if (error.message?.includes('timeout')) {
					errorType = 'timeout';
				} else if (error.message?.includes('network') || error.message?.includes('fetch')) {
					errorType = 'network';
				} else if (error.message?.includes('parse') || error.message?.includes('JSON')) {
					errorType = 'parse';
				}

				const fallbackText = getFallbackMessage(errorType);
				const errorMsg: ChatMessage = {
					id: `${Date.now()}-error`,
					text: fallbackText,
					sender: 'ai',
					isWarning: true,
					category: 'warning',
				};
				setMessages((prev) => [...prev, errorMsg]);
			}
		} finally {
			setIsLoading(false);
			abortControllerRef.current = null;
		}
	};

	const handleStopGenerating = () => {
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
	};

	const renderMessage = ({ item }: { item: ChatMessage }) => {
		const isUser = item.sender === 'user';
		const isWarning = item.isWarning;
		const isEmergency = item.isEmergency;
		const category: ChatMessage['category'] = item.category || (isEmergency ? 'emergency' : isWarning ? 'warning' : 'dental');

		let bubbleBgColor = colors.cardBorder;
		let textColor = colors.textPrimary;
		let indicatorColor = colors.accentBlue;

		if (isUser) {
			bubbleBgColor = colors.accentBlue;
			textColor = '#fff';
			indicatorColor = '#fff';
		} else if (category === 'emergency') {
			bubbleBgColor = '#fee2e2';
			textColor = '#991b1b';
			indicatorColor = '#dc2626';
		} else if (category === 'warning') {
			bubbleBgColor = '#fef3c7';
			textColor = '#78350f';
			indicatorColor = '#d97706';
		}

		const indicatorIcon = isUser
			? ''
			: category === 'emergency'
				? '⚠️'
				: category === 'warning'
					? '⁉️'
					: '🦷';
		const indicatorLabel = !isUser ? t(`clinicAI.labels.${category}`) : '';

		return (
			<View
				style={[
					styles.messageRow,
					{ justifyContent: isUser ? (isRTL ? 'flex-start' : 'flex-end') : (isRTL ? 'flex-end' : 'flex-start') },
				]}
			>
				<View
					style={[
						styles.messageBubble,
						{
							backgroundColor: bubbleBgColor,
							maxWidth: '80%',
							borderColor: isEmergency ? '#dc2626' : 'transparent',
							borderWidth: isEmergency ? 2 : 0,
						},
					]}
				>
					{!isUser && (
						<View style={[styles.messageHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
							<Text style={[styles.indicatorIcon, { color: indicatorColor }]}>{indicatorIcon}</Text>
							<Text
								style={[
									styles.indicatorText,
									{ color: indicatorColor, textAlign: isRTL ? 'right' : 'left' },
								]}
							>
								{indicatorLabel}
							</Text>
						</View>
					)}
					<Text
						style={[
							styles.messageText,
							{
								color: textColor,
								textAlign: isRTL ? 'right' : 'left',
							},
						]}
					>
						{item.text}
					</Text>
				</View>
			</View>
		);
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={[styles.container, { backgroundColor: colors.background }]}
		>
			{/* AI Pro Upgrade Prompt Modal */}
			<AIProUpgradePrompt
				visible={showUpgradePrompt}
				onClose={() => setShowUpgradePrompt(false)}
				clinicId={clinicId}
				context="ai_chat"
			/>

			{/* AI Pro Feature Tooltip */}
			<AIProFeatureTooltip
				visible={showProTooltip}
				message={t('clinicAI.aiProEnabled', 'AI Pro features enabled')}
				autoHide={true}
				duration={3000}
				position="top"
			/>

			<View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
				<Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
					{t('clinicAI.title') || 'AI Dental Assistant'}
				</Text>
				<Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
					{t('clinicAI.subtitle') || 'Educational information only'}
				</Text>
			</View>

			{subLoading ? (
				// Loading state
				<View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
					<ActivityIndicator size="large" color={colors.accentBlue} />
					<Text style={[styles.loadingText, { color: colors.textSecondary, marginTop: 12 }]}>
						{t('common.loading')}
					</Text>
				</View>
			) : !hasAIAccess ? (
				// Subscription gating - show upgrade prompt
				<View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
					<View style={[styles.upgradeCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
<Ionicons name="lock-closed" size={48} color={colors.accentBlue} style={styles.upgradeIcon} />
						
						<Text style={[styles.upgradeTitle, { color: colors.textPrimary }]}>
							{t('ai.upgradeRequired.title') || 'Upgrade to AI Pro'}
						</Text>
						
						<Text style={[styles.upgradeDescription, { color: colors.textSecondary }]}>
							{t('ai.upgradeRequired.description') || 'AI Assistant is only available with PRO_AI subscription'}
						</Text>

						<View style={styles.featureList}>
							<View style={[styles.featureItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
								<Ionicons name="checkmark-circle" size={20} color={colors.accentBlue} />
								<Text style={[styles.featureText, { color: colors.textPrimary, marginStart: isRTL ? 8 : 12, marginEnd: isRTL ? 12 : 8 }]}>
									{t('ai.upgradeRequired.feature1') || 'Real-time AI Chat'}
								</Text>
							</View>
							<View style={[styles.featureItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
								<Ionicons name="checkmark-circle" size={20} color={colors.accentBlue} />
								<Text style={[styles.featureText, { color: colors.textPrimary, marginStart: isRTL ? 8 : 12, marginEnd: isRTL ? 12 : 8 }]}>
									{t('ai.upgradeRequired.feature2') || 'Dental Advice'}
								</Text>
							</View>
							<View style={[styles.featureItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
								<Ionicons name="checkmark-circle" size={20} color={colors.accentBlue} />
								<Text style={[styles.featureText, { color: colors.textPrimary, marginStart: isRTL ? 8 : 12, marginEnd: isRTL ? 12 : 8 }]}>
									{t('ai.upgradeRequired.feature3') || 'Message History'}
								</Text>
							</View>
						</View>

						<TouchableOpacity
						onPress={() => setShowUpgradePrompt(true)}
						>
							<Text style={styles.upgradeButtonText}>
								{t('ai.upgradeRequired.cta') || 'Upgrade Now'}
							</Text>
						</TouchableOpacity>

						{userRole === 'clinic' && tier && !hasAIAccess && (
							<Text style={[styles.currentPlanText, { color: colors.textSecondary }]}>
								{t('ai.upgradeRequired.currentPlan') || 'Add AI Pro to your plan to unlock AI features'}
							</Text>
						)}
					</View>
				</View>
			) : (
				// Chat interface
				<>
					<FlatList
						data={messages}
						keyExtractor={(item) => item.id}
						renderItem={renderMessage}
						contentContainerStyle={styles.messagesList}
						showsVerticalScrollIndicator={false}
						keyboardShouldPersistTaps="handled"
					/>

					{isLoading && (
						<View style={styles.loadingContainer}>
							{streamingText ? (
								// Show live streaming text
								<View style={[styles.streamingBubble, { backgroundColor: colors.cardBorder, maxWidth: '80%' }]}>
									{streamingCategory && (
										<View style={[styles.messageHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
											<Text style={[styles.indicatorIcon, { color: colors.accentBlue }]}>
												{streamingCategory === 'emergency' ? '⚠️' : streamingCategory === 'warning' ? '⁉️' : '🦷'}
											</Text>
											<Text style={[styles.indicatorText, { color: colors.accentBlue, textAlign: isRTL ? 'right' : 'left' }]}>
												{t(`clinicAI.labels.${streamingCategory}`)}
											</Text>
										</View>
									)}
									<Text style={[styles.messageText, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
										{streamingText}
									</Text>
									<ActivityIndicator size="small" color={colors.accentBlue} style={{ marginTop: 8 }} />
								</View>
							) : (
								// Show "thinking" placeholder
								<View style={[styles.loadingBubble, { backgroundColor: colors.cardBorder }]}>
									<ActivityIndicator size="small" color={colors.textSecondary} />
									<View style={styles.loadingTextWrap}>
										<Text style={[styles.loadingText, { color: colors.textSecondary }]}>
											{t('clinicAI.thinking') || 'Thinking...'}
										</Text>
										<Text style={[styles.loadingHelperText, { color: colors.textSecondary }]}>
											{t('clinicAI.thinkingHelper') || 'AI is processing your message'}
										</Text>
									</View>
								</View>
							)}
							
							{/* Stop Generating Button */}
							<TouchableOpacity
								onPress={handleStopGenerating}
								style={[styles.stopButton, { backgroundColor: '#dc2626', borderColor: colors.cardBorder }]}
								accessibilityLabel="Stop generating"
							>
								<Ionicons name="stop" size={16} color="#fff" />
								<Text style={styles.stopButtonText}>
									{isRTL ? 'إيقاف التوليد' : 'Stop Generating'}
								</Text>
							</TouchableOpacity>
						</View>
					)}

					<View
						style={[
							styles.disclaimerBox,
							{ backgroundColor: colors.inputBackground, borderColor: colors.cardBorder },
						]}
					>
						<Ionicons name="information-circle" size={16} color={colors.textSecondary} />
						<Text style={[styles.disclaimerText, { color: colors.textSecondary }]}>
							{t('clinicAI.footer') || 'Not a substitute for professional medical advice'}
						</Text>
					</View>

					<View
						style={[
							styles.inputContainer,
							{ borderTopColor: colors.cardBorder },
						]}
					>
						<TextInput
							style={[
								styles.input,
								{
									backgroundColor: colors.inputBackground,
									borderColor: colors.cardBorder,
									color: colors.textPrimary,
									textAlign: isRTL ? 'right' : 'left',
									writingDirection: isRTL ? 'rtl' : 'ltr',
								},
							]}
							placeholder={t('clinicAI.inputPlaceholder') || 'Type a question...'}
							placeholderTextColor={colors.textSecondary}
							value={inputText}
							onChangeText={setInputText}
							multiline
							maxLength={500}
							editable={!isLoading}
						/>
						<TouchableOpacity
							onPress={handleSend}
							disabled={!inputText.trim() || isLoading}
							style={[
								styles.sendButton,
								{
									backgroundColor: colors.accentBlue,
									opacity: inputText.trim() && !isLoading ? 1 : 0.5,
								},
							]}
							accessibilityLabel={t('clinicAI.send') || 'Send'}
						>
							{isLoading ? (
								<ActivityIndicator size="small" color="#fff" />
							) : (
								<Ionicons name={isRTL ? 'arrow-back' : 'send'} size={18} color="#fff" />
							)}
						</TouchableOpacity>
					</View>
				</>
			)}
		</KeyboardAvoidingView>
	);
}

const createStyles = (colors: any, isRTL: boolean) => StyleSheet.create({
	container: { flex: 1 },

	header: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderBottomWidth: 1,
	},
	headerTitle: { fontSize: 18, fontWeight: '800', marginBottom: 2, textAlign: isRTL ? 'right' : 'left' },
	headerSubtitle: { fontSize: 12, fontWeight: '600', textAlign: isRTL ? 'right' : 'left' },

	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 20,
	},

	upgradeCard: {
		borderRadius: 16,
		padding: 24,
		alignItems: 'center',
		borderWidth: 1,
		width: '100%',
		maxWidth: 400,
	},
	upgradeIcon: {
		marginBottom: 16,
	},
	upgradeTitle: {
		fontSize: 20,
		fontWeight: '800',
		marginBottom: 12,
		textAlign: 'center',
	},
	upgradeDescription: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 20,
		textAlign: 'center',
		lineHeight: 20,
	},
	featureList: {
		width: '100%',
		marginBottom: 24,
		gap: 12,
	},
	featureItem: {
		alignItems: 'center',
		gap: 8,
	},
	featureText: {
		fontSize: 14,
		fontWeight: '600',
		flex: 1,
	},
	upgradeButton: {
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
		width: '100%',
		alignItems: 'center',
		marginBottom: 12,
	},
	upgradeButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '700',
	},
	currentPlanText: {
		fontSize: 12,
		fontWeight: '500',
		textAlign: 'center',
		marginTop: 12,
	},

	messagesList: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
	messageRow: { flexDirection: isRTL ? 'row-reverse' : 'row', marginVertical: 4 },
	messageBubble: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 12,
	},
	messageText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },

	messageHeader: {
		marginBottom: 4,
		alignItems: 'center',
		alignSelf: isRTL ? 'flex-end' : 'flex-start',
		gap: 6,
	},
	indicatorIcon: { fontSize: 14 },
	indicatorText: { fontSize: 12, fontWeight: '700' },

	loadingContainer: {
		paddingHorizontal: 16,
		paddingBottom: 8,
		alignItems: isRTL ? 'flex-end' : 'flex-start',
		gap: 8,
	},
	loadingBubble: {
		flexDirection: isRTL ? 'row-reverse' : 'row',
		alignItems: 'center',
		gap: 8,
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 12,
	},
	loadingTextWrap: {
		flexShrink: 1,
		gap: 2,
	},
	loadingText: { fontSize: 13, fontWeight: '600' },
	loadingHelperText: { fontSize: 11, fontWeight: '500' },
	
	streamingBubble: {
		paddingHorizontal: 12,
		paddingVertical: 10,
		borderRadius: 12,
		alignSelf: isRTL ? 'flex-end' : 'flex-start',
	},
	
	stopButton: {
		flexDirection: isRTL ? 'row-reverse' : 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		alignSelf: 'center',
		marginTop: 4,
	},
	stopButtonText: {
		color: '#fff',
		fontSize: 13,
		fontWeight: '700',
	},

	disclaimerBox: {
		flexDirection: isRTL ? 'row-reverse' : 'row',
		alignItems: 'center',
		marginHorizontal: 16,
		marginVertical: 12,
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 8,
		borderWidth: 1,
		gap: 8,
	},
	disclaimerText: { fontSize: 11, fontWeight: '600', flex: 1, textAlign: isRTL ? 'right' : 'left' },

	inputContainer: {
		flexDirection: isRTL ? 'row-reverse' : 'row',
		alignItems: 'flex-end',
		paddingHorizontal: 12,
		paddingVertical: 12,
		borderTopWidth: 1,
		gap: 8,
	},
	input: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 20,
		paddingHorizontal: 14,
		paddingVertical: 8,
		maxHeight: 100,
		fontSize: 14,
		fontWeight: '500',
	},
	sendButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: 'center',
		alignItems: 'center',
	},
});

