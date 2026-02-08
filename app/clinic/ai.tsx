import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type ChatMessage = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
};

export default function ClinicAIScreen() {
  useClinicGuard();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'welcome', sender: 'ai', text: t('clinicAI.welcome') },
  ]);
  const [input, setInput] = useState('');

  const accent = isDark ? '#D4AF37' : '#0a7ea4';

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: ChatMessage = { id: `${Date.now()}-user`, sender: 'user', text: trimmed };
    const aiMsg: ChatMessage = { id: `${Date.now()}-ai`, sender: 'ai', text: t('clinicAI.fakeResponse') };
    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setInput('');
  };

  const renderMessage = (msg: ChatMessage) => {
    const isAI = msg.sender === 'ai';
    return (
      <View
        key={msg.id}
        style={[
          styles.message,
          {
            alignSelf: isAI ? 'flex-start' : 'flex-end',
            backgroundColor: isAI ? colors.inputBackground : accent,
            borderColor: isAI ? colors.cardBorder : accent,
          },
        ]}
      >
        {isAI && <Ionicons name="sparkles" size={16} color={isDark ? '#0b0b0b' : accent} />}
        <Text
          style={[
            styles.messageText,
            { color: isAI ? colors.textPrimary : isDark ? '#0b0b0b' : '#fff' },
            isRTL && { textAlign: 'right' },
          ]}
        >
          {msg.text}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.headerRow, isRTL && { flexDirection: 'row-reverse' }]}> 
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={[styles.headerTextWrap, isRTL && { alignItems: 'flex-end' }]}>
          <Text style={[styles.title, { color: colors.textPrimary }, isRTL && { textAlign: 'right' }]}>
            {t('clinicAI.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }, isRTL && { textAlign: 'right' }]}>
            {t('clinicAI.subtitle')}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.chat, isRTL && { flexDirection: 'column', alignItems: 'stretch' }]}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(renderMessage)}
      </ScrollView>

      <View style={[styles.inputRow, isRTL && { flexDirection: 'row-reverse' }]}> 
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={t('clinicAI.inputPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { borderColor: colors.cardBorder, color: colors.textPrimary, backgroundColor: colors.inputBackground }, isRTL && { textAlign: 'right' }]}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: accent }]}
          onPress={handleSend}
          activeOpacity={0.9}
        >
          <Ionicons name={isRTL ? 'arrow-back' : 'arrow-forward'} size={18} color={isDark ? '#0b0b0b' : '#fff'} />
          <Text style={[styles.sendText, { color: isDark ? '#0b0b0b' : '#fff' }]}>{t('clinicAI.send')}</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.footer, { color: colors.textSecondary }, isRTL && { textAlign: 'right' }]}>
        {t('clinicAI.footer')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 20, fontWeight: '900' },
  subtitle: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  chat: { gap: 10, flexGrow: 1, paddingVertical: 6 },
  message: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 6, maxWidth: '88%' },
  messageText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, maxHeight: 140, fontSize: 14, fontWeight: '600' },
  sendButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  sendText: { fontSize: 14, fontWeight: '800' },
  footer: { fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 18, marginTop: 2 },
});
