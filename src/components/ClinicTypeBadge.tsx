import { getClinicTypeInfo } from '@/src/utils/clinicTypeConfig';
import { StyleSheet, Text, View } from 'react-native';

type ClinicTypeBadgeProps = {
  clinicType?: string | null;
};

export default function ClinicTypeBadge({ clinicType }: ClinicTypeBadgeProps) {
  const info = getClinicTypeInfo(clinicType);
  if (!info) return null;

  return (
    <View style={[styles.pill, { backgroundColor: info.backgroundColor }]}>
      <Text style={styles.emoji}>{info.emoji}</Text>
      <Text style={styles.label}>{info.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 5,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  emoji: {
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: '#111',
  },
});
