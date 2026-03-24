import { StyleSheet, Text, View } from 'react-native';

interface Props {
  tag: string;
}

export default function HashtagSticker({ tag }: Props) {
  const display = tag.startsWith('#') ? tag : `#${tag}`;
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>{display}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  text: {
    color: '#1A2B3F',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
});
