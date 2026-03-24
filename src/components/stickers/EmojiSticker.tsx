import { StyleSheet, Text, View } from 'react-native';

interface Props {
  emoji: string;
  size?: number;
}

export default function EmojiSticker({ emoji, size = 48 }: Props) {
  return (
    <View style={styles.wrap}>
      <Text
        style={[styles.emoji, { fontSize: size, lineHeight: size * 1.15 }]}
        allowFontScaling={false}
      >
        {emoji}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
  },
  emoji: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
