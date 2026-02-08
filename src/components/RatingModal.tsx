import { useTheme } from '@/src/context/ThemeContext';
import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export type RatingContext = 'patient' | 'clinicOwner';

type RatingModalProps = {
  visible: boolean;
  context: RatingContext;
  clinicName?: string;
  clinicId?: string;
  onSubmit?: (rating: number, note?: string) => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
};

export default function RatingModal({ visible, context, clinicName, clinicId, onSubmit, onSkip }: RatingModalProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const [rating, setRating] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  // Detect RTL languages
  const isRTL = I18nManager.isRTL || ['ar', 'he', 'ur', 'fa'].includes(i18n.language);

  useEffect(() => {
    if (visible) {
      setRating(0);
      setNote('');
    }
  }, [visible]);

  const title = useMemo(() => {
    return context === 'patient' ? t('rating.titlePatient') : t('rating.titleOwner');
  }, [context, t]);

  const subtitle = useMemo(() => {
    if (context === 'patient') {
      return clinicName ? t('rating.subtitlePatientWithClinic', { clinic: clinicName }) : t('rating.subtitlePatient');
    }
    return t('rating.subtitleOwner');
  }, [context, clinicName, t]);

  const handleSubmit = async () => {
    try {
      await onSubmit?.(rating, note.trim() || undefined);
    } catch (_) {
      // swallow
    }
  };

  const handleSkip = async () => {
    try {
      await onSkip?.();
    } catch (_) {
      // swallow
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.scrim || 'rgba(0,0,0,0.45)' }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}> 
          <Text style={[styles.title, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text> : null}
          {clinicId ? <Text style={[styles.meta, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t('rating.clinicId')}: {clinicId}</Text> : null}

          <View style={styles.starsRow}>
            {Array.from({ length: 5 }).map((_, idx) => {
              const val = idx + 1;
              const active = rating >= val;
              return (
                <TouchableOpacity key={val} onPress={() => setRating(val)}>
                  <Text style={[styles.star, { color: active ? colors.accentBlue : colors.textSecondary }]}>★</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('rating.placeholderOptional')}
            style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}
            multiline
            numberOfLines={3}
          />

          <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.buttonBackground }]} onPress={handleSubmit}>
              <Text style={[styles.primaryText, { color: colors.buttonText }]}>{t('common.submit')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.cardBorder, backgroundColor: colors.buttonSecondaryBackground }]} onPress={handleSkip}>
              <Text style={[styles.secondaryText, { color: colors.buttonSecondaryText }]}>{t('common.skip')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  card: { width: '100%', maxWidth: 420, borderRadius: 14, padding: 16, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { marginTop: 6, fontSize: 13 },
  meta: { marginTop: 2, fontSize: 11 },
  starsRow: { flexDirection: 'row', gap: 6, marginTop: 12, justifyContent: 'center' },
  star: { fontSize: 28 },
  input: { marginTop: 12, borderWidth: 1, borderRadius: 8, padding: 10, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14, justifyContent: 'flex-end' },
  primaryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8 },
  primaryText: { fontWeight: '700' },
  secondaryBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1 },
  secondaryText: { fontWeight: '700' },
});
