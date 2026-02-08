/**
 * ARCHIVED: Legacy clinic rating page
 * Moved from app/rating/clinic.tsx on 2025-12-27
 */
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RateClinicScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { clinicName } = useLocalSearchParams<{ clinicName?: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    // Mock: submit clinic rating
    console.log('Clinic rating submitted:', { rating, comment, clinicName });
    router.back();
  };

  const handleSkip = () => {
    router.back();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={styles.contentPadding}>
        {/* Header */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Rate {clinicName || 'Clinic'}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}> 
          Share your experience with this clinic
        </Text>

        {/* Stars */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={48}
                color={colors.accentBlue}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Comment Input */}
        <Text style={[styles.label, { color: colors.textPrimary }]}>Add a comment (optional)</Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.cardBorder,
              color: colors.textPrimary,
              borderColor: colors.cardBorder,
            },
          ]}
          placeholder="Tell us about your experience..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
        />

        {/* Buttons */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.accentBlue }]}
          onPress={handleSubmit}
          disabled={rating === 0}
        >
          <Text style={styles.submitButtonText}>Submit Rating</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.skipButton, { borderColor: colors.cardBorder }]} onPress={handleSkip}>
          <Text style={[styles.skipButtonText, { color: colors.textPrimary }]}>Skip</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'System',
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  skipButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
