import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Text, View } from 'react-native';

interface Props {
  format?: '12h' | '24h';
  time?: string;
}

export default function TimeStickerView({ time }: Props) {
  const display =
    time ||
    new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <View style={styles.pill}>
      <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.7)" style={styles.icon} />
      <Text style={styles.text} allowFontScaling={false}>
        {display}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28,28,30,0.82)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
    gap: 6,
  },
  icon: {
    opacity: 0.85,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
    textAlign: 'center',
    ...(Platform.OS === 'ios' ? { fontFamily: 'System' } : {}),
  },
});
