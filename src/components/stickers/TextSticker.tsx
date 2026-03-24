import { Platform, StyleSheet, Text, View } from 'react-native';

interface Props {
  text: string;
  color?: string;
  backgroundColor?: string;
}

export default function TextSticker({
  text,
  color = '#FFFFFF',
  backgroundColor = 'rgba(0,0,0,0.65)',
}: Props) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text
        style={[styles.text, { color }]}
        numberOfLines={4}
        allowFontScaling={false}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    maxWidth: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 5,
  },
  text: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    lineHeight: 24,
    ...(Platform.OS === 'ios' ? { fontFamily: 'System' } : {}),
  },
});
