import { StyleSheet, Text, View } from 'react-native';

interface Props {
  question?: string;
  optionA?: string;
  optionB?: string;
}

export default function PollSticker({
  question = 'Yes or No?',
  optionA = 'Yes',
  optionB = 'No',
}: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.question}>{question}</Text>
      <View style={styles.options}>
        <View style={styles.option}>
          <Text style={styles.optionText}>{optionA}</Text>
        </View>
        <View style={[styles.option, styles.optionB]}>
          <Text style={styles.optionText}>{optionB}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  question: {
    color: '#1A2B3F',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  options: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    backgroundColor: '#E1306C',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionB: {
    backgroundColor: '#1A73E8',
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
