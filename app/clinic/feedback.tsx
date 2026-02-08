import { useTheme } from '@/src/context/ThemeContext';
import { useClinicGuard, useClinicRoleGuard } from '@/src/utils/navigationGuards';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Summary = {
  plan: string;
  planName: string;
  price: string;
  aiPro: boolean;
  clinicName: string;
  email: string;
};

export default function ClinicFeedback() {
  const { colors } = useTheme();
  const router = useRouter();
  
  // Guards: Block patients and non-owners
  useClinicGuard();
  useClinicRoleGuard(['owner']);

  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      const values = await AsyncStorage.multiGet([
        'subscriptionSummaryPlan',
        'subscriptionSummaryPlanName',
        'subscriptionSummaryPrice',
        'subscriptionSummaryIncludeAIPro',
        'subscriptionSummaryClinicName',
        'subscriptionSummaryEmail',
      ]);

      const map = Object.fromEntries(values);
      setSummary({
        plan: map.subscriptionSummaryPlan || 'MONTHLY',
        planName: map.subscriptionSummaryPlanName || map.subscriptionSummaryPlan || 'Monthly',
        price: map.subscriptionSummaryPrice || '19.99',
        aiPro: map.subscriptionSummaryIncludeAIPro === 'true',
        clinicName: map.subscriptionSummaryClinicName || 'Clinic',
        email: map.subscriptionSummaryEmail || '',
      });
    };

    loadSummary();
  }, []);

  const goHome = () => {
    router.push('/(tabs)/home' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}> 
        <Ionicons name="checkmark-circle" size={80} color="#10b981" style={{ alignSelf: 'center', marginBottom: 16 }} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>You're now subscribed!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Welcome to BeSmile AI Pro. Your subscription is active.</Text>

        {summary && (
          <View style={[styles.summaryBox, { borderColor: colors.cardBorder }]}> 
            <Text style={[styles.summaryLine, { color: colors.textPrimary }]}>Plan: {summary.planName}</Text>
            <Text style={[styles.summaryLine, { color: colors.textPrimary }]}>AI Pro: {summary.aiPro ? 'Included' : 'Not included'}</Text>
            <Text style={[styles.summaryLine, { color: colors.textPrimary }]}>Total: ${summary.price}</Text>
            <Text style={[styles.summaryLine, { color: colors.textPrimary }]}>Clinic: {summary.clinicName}</Text>
            {!!summary.email && <Text style={[styles.summaryLine, { color: colors.textPrimary }]}>Email: {summary.email}</Text>}
          </View>
        )}

        <TouchableOpacity style={[styles.primary, { backgroundColor: colors.buttonBackground }]} onPress={goHome}>
          <Text style={[styles.primaryText, { color: colors.buttonText }]}>Continue to BeSmile AI</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 6, textAlign: 'center' },
  subtitle: { fontSize: 13, fontWeight: '600', marginBottom: 16, textAlign: 'center' },
  primary: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  primaryText: { fontSize: 16, fontWeight: '800' },
  summaryBox: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8, marginBottom: 8 },
  summaryLine: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
});
