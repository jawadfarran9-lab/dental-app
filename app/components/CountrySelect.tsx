import i18n from '@/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { COUNTRIES, Country } from '@/utils/countries';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Constant for FlatList getItemLayout optimization
const COUNTRY_ITEM_HEIGHT = 56;

interface CountrySelectProps {
  value: string; // countryCode only (e.g., 'US', 'SA', 'EG')
  onChange: (countryCode: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string; // Error message to display
}

// Memoized country item component
const CountryItem = React.memo(({ 
  country, 
  isSelected, 
  onSelect, 
  borderBottomColor, 
  textColor, 
  accentColor,
  displayLang
}: { 
  country: Country;
  isSelected: boolean; 
  onSelect: (code: string) => void; 
  borderBottomColor: string; 
  textColor: string; 
  accentColor: string;
  displayLang: string;
}) => {
  const displayName = displayLang === 'ar' ? country.name_ar : country.name_en;
  return (
    <TouchableOpacity
      style={[styles.countryItem, { borderBottomColor }]}
      onPress={() => onSelect(country.code)}
      activeOpacity={0.7}
    >
      <Text style={[styles.countryItemText, { color: textColor }]}>{displayName}</Text>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={22} color={accentColor} />
      )}
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.country.code === nextProps.country.code &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.displayLang === nextProps.displayLang
  );
});

export default function CountrySelect({ value, onChange, placeholder = 'Select Country', disabled = false, error }: CountrySelectProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
  const displayLang = i18n.language;

  // Get display name for selected country code
  const getCountryDisplayName = useCallback((code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    if (!country) return '';
    return displayLang === 'ar' ? country.name_ar : country.name_en;
  }, [displayLang]);

  const handleSelect = useCallback((code: string) => {
    onChange(code);
    setModalVisible(false);
  }, [onChange]);

  const keyExtractor = useCallback((item: Country) => item.code, []);

  const renderItem = useCallback(({ item }: { item: Country }) => (
    <CountryItem
      country={item}
      isSelected={value === item.code}
      onSelect={handleSelect}
      borderBottomColor={colors.cardBorder}
      textColor={colors.textPrimary}
      accentColor={colors.accentBlue}
      displayLang={displayLang}
    />
  ), [value, handleSelect, colors.cardBorder, colors.textPrimary, colors.accentBlue, displayLang]);

  return (
    <>
      {/* Main Input Field */}
      <TouchableOpacity
        style={[
          styles.selector, 
          { backgroundColor: colors.inputBackground, borderColor: error ? colors.error : colors.inputBorder },
          disabled && styles.selectorDisabled,
          isRTL && styles.selectorRTL
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectorText, 
          { color: colors.textPrimary },
          !value && { color: colors.inputPlaceholder },
          isRTL && { textAlign: 'right', writingDirection: 'rtl' }
        ]}>
          {value ? getCountryDisplayName(value) : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Error message */}
      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {error}
        </Text>
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable 
            style={[styles.modalContent, { backgroundColor: colors.card }]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{t('createPatient.selectCountry', 'Select Country')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Country List - No Search */}
            <FlatList
              data={COUNTRIES}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
              scrollEventThrottle={16}
              getItemLayout={(data, index) => ({
                length: COUNTRY_ITEM_HEIGHT,
                offset: COUNTRY_ITEM_HEIGHT * index,
                index,
              })}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectorDisabled: {
    opacity: 0.6,
  },
  selectorRTL: {
    flexDirection: 'row-reverse',
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
    zIndex: 1001,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  countryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  countryItemText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 10,
    marginLeft: 2,
  },
});
