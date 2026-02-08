/**
 * ARCHIVED: Legacy app rating screen
 * Moved from app/modal/rate-app.tsx on 2025-12-27
 */
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RateAppScreen() {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.contentPadding}>
        {/* Header */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          Rate BeSmile
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Help us improve your experience
        </Text>

        {/* Star Rating */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={48}
                color={star <= rating ? '#FFD700' : colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Feedback Text */}
        {rating > 0 && (
          <View style={styles.feedbackSection}>
            <Text style={[styles.feedbackLabel, { color: colors.textPrimary }]}>
              Tell us more (optional)
            </Text>
            <TextInput
              style={[
                styles.feedbackInput,
                {
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.cardBorder,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Your feedback..."
              placeholderTextColor={colors.textSecondary}
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* Action Buttons */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.accentBlue, opacity: rating > 0 ? 1 : 0.5 }]}
          disabled={rating === 0}
        >
          <Text style={[styles.submitText, { color: '#fff' }]}>Submit Rating</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.skipBtn, { borderColor: colors.cardBorder }]}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Maybe Later</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentPadding: { padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  subtitle: { fontSize: 14, fontWeight: '600', textAlign: 'center', marginBottom: 12 },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginVertical: 20 },
  feedbackSection: { gap: 8 },
  feedbackLabel: { fontSize: 14, fontWeight: '700' },
  feedbackInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, textAlignVertical: 'top' },
  submitBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  submitText: { fontSize: 16, fontWeight: '800' },
  skipBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  skipText: { fontSize: 16, fontWeight: '700' },
});
