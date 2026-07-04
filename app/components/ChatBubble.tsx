import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { localizeDate } from '@/utils/localization';
import { Image, StyleSheet, Text, View } from 'react-native';

type ChatBubbleProps = {
  text: string;
  isSender: boolean;
  senderType?: 'clinic' | 'patient';
  senderName?: string;
  senderRole?: string;
  createdAt?: number | Date;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  reactionClinic?: string;
  reactionPatient?: string;
};

export default function ChatBubble({
  text,
  isSender,
  senderName,
  senderRole,
  createdAt,
  imageUrl,
  imageWidth,
  imageHeight,
  reactionClinic,
  reactionPatient,
}: ChatBubbleProps) {
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  const { colors } = useTheme();
  const localizedTimestamp = createdAt
    ? localizeDate(createdAt, { hour: '2-digit', minute: '2-digit' })
    : '';

  const BUBBLE_MAX_W = 220;
  const ratio = imageWidth && imageHeight ? imageHeight / imageWidth : 1;
  const imgH = Math.min(Math.max(BUBBLE_MAX_W * ratio, 120), 320);

  const hasReaction = !!(reactionClinic || reactionPatient);
  const reactionBadge = hasReaction ? (
    <View style={[styles.reactionBadge, styles.reactionBadgeLeft]}>
      <Text style={styles.reactionBadgeText}>
        {[reactionClinic, reactionPatient].filter(Boolean).join(' ')}
      </Text>
    </View>
  ) : null;

  return (
    <View style={[styles.reactWrap, isSender ? styles.reactWrapRight : styles.reactWrapLeft, hasReaction && styles.reactWrapReacted]}>
      <View style={{ position: 'relative' }}>
        <View style={[styles.bubble, isSender ? [styles.senderBubble, { backgroundColor: colors.buttonBackground }] : styles.receiverBubble]}>
          {senderName && (
            <Text style={[
              styles.senderLabel,
              isSender ? styles.senderLabelSender : styles.senderLabelReceiver,
            ]}>
              {senderName}{senderRole ? ` (${senderRole})` : ''}
            </Text>
          )}
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{ width: BUBBLE_MAX_W, height: imgH, borderRadius: 12 }}
              resizeMode="cover"
            />
          ) : null}
          {text ? (
            <Text style={[
              styles.text,
              isSender ? [styles.senderText, { color: colors.buttonText }] : styles.receiverText,
              isRTL && { writingDirection: 'rtl', textAlign: 'right' },
              imageUrl ? { marginTop: 6 } : null,
            ]}>
              {text}
            </Text>
          ) : null}
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
        {reactionBadge}
      </View>
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
  reactWrap: {},
  reactWrapLeft: { alignItems: 'flex-start' },
  reactWrapRight: { alignItems: 'flex-end' },
  reactWrapReacted: { marginBottom: 16 },
  reactionBadge: {
    position: 'absolute',
    bottom: -14,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.20,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  reactionBadgeLeft: { left: 10 },
  reactionBadgeText: { fontSize: 13 },
});
