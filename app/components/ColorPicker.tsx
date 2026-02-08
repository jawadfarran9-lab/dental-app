import { useTheme } from '@/src/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label: string;
  disabled?: boolean;
}

const PRESET_COLORS = [
  '#D4AF37', // Gold (default primary)
  '#0B0F1A', // Dark (default secondary)
  '#FFFFFF',
  '#000000',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  disabled = false,
}: ColorPickerProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [manualInput, setManualInput] = useState(value);
  const [showPresets, setShowPresets] = useState(false);

  const handleManualInput = (input: string) => {
    setManualInput(input);
    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(input)) {
      onChange(input);
    }
  };

  const handlePresetSelect = (color: string) => {
    setManualInput(color);
    onChange(color);
    setShowPresets(false);
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    colorPreview: {
      width: 60,
      height: 60,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      backgroundColor: value,
    },
    inputSection: {
      flex: 1,
    },
    textInput: {
      backgroundColor: colors.inputBackground,
      color: colors.textPrimary,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingVertical: 10,
      fontSize: 12,
      fontFamily: 'monospace',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      marginBottom: 8,
    },
    presetButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.inputBackground,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    presetButtonText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    presetsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    presetColorButton: {
      width: '22%',
      aspectRatio: 1,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    presetColorButtonActive: {
      borderColor: colors.textPrimary,
    },
    presetCheckmark: {
      position: 'absolute',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputRow}>
        <View style={styles.colorPreview} />
        <View style={styles.inputSection}>
          <TextInput
            style={styles.textInput}
            value={manualInput}
            onChangeText={handleManualInput}
            placeholder={t('colorPicker.placeholder', '#D4AF37')}
            placeholderTextColor={colors.textSecondary}
            editable={!disabled}
            maxLength={7}
          />
          <TouchableOpacity
            style={styles.presetButton}
            onPress={() => setShowPresets(!showPresets)}
            disabled={disabled}
          >
            <MaterialIcons
              name={showPresets ? 'expand-less' : 'expand-more'}
              size={16}
              color={colors.textPrimary}
            />
            <Text style={styles.presetButtonText}>{t('colorPicker.presets')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showPresets && (
        <View style={styles.presetsGrid}>
          {PRESET_COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.presetColorButton,
                { backgroundColor: color },
                value.toUpperCase() === color.toUpperCase() &&
                  styles.presetColorButtonActive,
              ]}
              onPress={() => handlePresetSelect(color)}
              disabled={disabled}
            >
              {value.toUpperCase() === color.toUpperCase() && (
                <MaterialIcons name="check" size={20} color="#FFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default ColorPicker;
