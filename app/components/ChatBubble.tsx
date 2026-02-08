import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import i18n from '@/i18n';
import { localizeDate } from '@/utils/localization';
import { useTheme } from '@/src/context/ThemeContext';

type ChatBubbleProps = {
  text: string;
  isSender: boolean;
  senderType?: 'clinic' | 'patient';
  senderName?: string;
  senderRole?: string;
  createdAt?: number | Date;
};

export default function ChatBubble({ text, isSender, senderName, senderRole, createdAt }: ChatBubbleProps) {
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  const { colors } = useTheme();
  const localizedTimestamp = createdAt
    ? localizeDate(createdAt, { hour: '2-digit', minute: '2-digit' })
    : '';
  
  return (
    <View style={[styles.bubble, isSender ? [styles.senderBubble, { backgroundColor: colors.buttonBackground }] : styles.receiverBubble]}>
      {senderName && (
        <Text style={[
          styles.senderLabel,
          isSender ? styles.senderLabelSender : styles.senderLabelReceiver,
        ]}>
          {senderName}{senderRole ? ` (${senderRole})` : ''}
        </Text>
      )}
      <Text style={[
        styles.text, 
        isSender ? [styles.senderText, { color: colors.buttonText }] : styles.receiverText,
        isRTL && { writingDirection: 'rtl', textAlign: 'right' }
      ]}>
        {text}
      </Text>
      {createdAt && (
        <Text style={[
          styles.timestamp,
          isSender ? styles.timestampSender : styles.timestampReceiver,
          isRTL && { textAlign: 'right' }
        ]}>
          {localizedTimestamp}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 4,
    maxWidth: '75%',
  },
  senderBubble: {
    backgroundColor: '#D4AF37',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  receiverBubble: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  senderText: {
    color: '#000000',
  },
  receiverText: {
    color: '#000000',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  timestampSender: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  timestampReceiver: {
    color: '#666666',
  },
  senderLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  senderLabelSender: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  senderLabelReceiver: {
    color: '#333333',
  },
});
