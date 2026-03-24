import { StyleSheet, Text, View } from 'react-native';

export default function GifPlaceholderSticker() {
  return (
    <View style={styles.pill}>
      <Text style={styles.text}>GIF</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: '#00D4AA',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
