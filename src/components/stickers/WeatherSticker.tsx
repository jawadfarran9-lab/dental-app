import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  temp?: string;
  condition?: string;
}

export default function WeatherSticker({
  temp = '24°',
  condition = 'Sunny',
}: Props) {
  const icon =
    condition === 'Rainy'
      ? 'rainy'
      : condition === 'Cloudy'
        ? 'cloudy'
        : 'sunny';

  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={18} color="#FFD60A" style={styles.icon} />
      <Text style={styles.temp}>{temp}</Text>
      <Text style={styles.condition}>{condition}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  icon: { marginRight: 2 },
  temp: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  condition: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
  },
});
