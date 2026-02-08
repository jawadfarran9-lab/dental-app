import { useTheme } from '@/src/context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (startDate: number, endDate: number) => void;
  startDate?: number;
  endDate?: number;
}

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const generateCalendar = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(year, month);
  const days: (number | null)[] = Array(firstDay).fill(null);

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  visible,
  onClose,
  onApply,
  startDate: initialStartDate,
  endDate: initialEndDate,
}: DateRangePickerProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const today = new Date();
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(
    initialStartDate ? new Date(initialStartDate) : null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(
    initialEndDate ? new Date(initialEndDate) : null
  );

  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [selectingStart, setSelectingStart] = useState(true);

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(displayYear, displayMonth, day);

    if (selectingStart) {
      setSelectedStartDate(selectedDate);
      setSelectingStart(false);
    } else {
      if (selectedDate >= (selectedStartDate || new Date())) {
        setSelectedEndDate(selectedDate);
      } else {
        // If end date is before start date, swap them
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(selectedDate);
      }
    }
  };

  const handleApply = () => {
    if (selectedStartDate && selectedEndDate) {
      onApply(selectedStartDate.getTime(), selectedEndDate.getTime());
      onClose();
    }
  };

  const handleReset = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setSelectingStart(true);
  };

  const months = [
    t('dateRangePicker.months.january'),
    t('dateRangePicker.months.february'),
    t('dateRangePicker.months.march'),
    t('dateRangePicker.months.april'),
    t('dateRangePicker.months.may'),
    t('dateRangePicker.months.june'),
    t('dateRangePicker.months.july'),
    t('dateRangePicker.months.august'),
    t('dateRangePicker.months.september'),
    t('dateRangePicker.months.october'),
    t('dateRangePicker.months.november'),
    t('dateRangePicker.months.december'),
  ];

  const weekDays = [
    t('dateRangePicker.weekdays.sundayShort'),
    t('dateRangePicker.weekdays.mondayShort'),
    t('dateRangePicker.weekdays.tuesdayShort'),
    t('dateRangePicker.weekdays.wednesdayShort'),
    t('dateRangePicker.weekdays.thursdayShort'),
    t('dateRangePicker.weekdays.fridayShort'),
    t('dateRangePicker.weekdays.saturdayShort'),
  ];

  const calendarDays = generateCalendar(displayYear, displayMonth);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.scrim,
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 40,
      maxHeight: '90%',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 16,
    },
    section: {
      marginVertical: 12,
    },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    selectedDateBox: {
      backgroundColor: colors.inputBackground,
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    selectedDateText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 4,
    },
    dateValue: {
      fontSize: 12,
      color: colors.buttonBackground,
      fontWeight: '600',
    },
    monthYearHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    monthYearText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    monthNavButton: {
      padding: 6,
    },
    calendar: {
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    weekDays: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    weekDay: {
      flex: 1,
      textAlign: 'center',
      fontSize: 10,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.285%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 4,
    },
    dayButton: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 6,
    },
    dayButtonEmpty: {
      backgroundColor: 'transparent',
    },
    dayButtonDisabled: {
      backgroundColor: 'transparent',
    },
    dayButtonSelectable: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    dayButtonSelected: {
      backgroundColor: colors.buttonBackground,
    },
    dayButtonInRange: {
      backgroundColor: colors.bannerOverlay,
    },
    dayText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    dayTextSelected: {
      color: colors.buttonText,
      fontWeight: '700',
    },
    dayTextDisabled: {
      color: colors.textSecondary,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: colors.buttonBackground,
    },
    buttonSecondary: {
      backgroundColor: colors.inputBackground,
    },
    buttonTertiary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    buttonTextPrimary: {
      color: colors.buttonText,
    },
    buttonTextSecondary: {
      color: colors.textPrimary,
    },
  });

  const isDateInRange = (day: number) => {
    if (!selectedStartDate || !selectedEndDate || !day) return false;
    const date = new Date(displayYear, displayMonth, day);
    return date > selectedStartDate && date < selectedEndDate;
  };

  const isDateSelected = (day: number) => {
    if (!day) return false;
    const date = new Date(displayYear, displayMonth, day);
    return (
      (selectedStartDate && date.getTime() === selectedStartDate.getTime()) ||
      (selectedEndDate && date.getTime() === selectedEndDate.getTime())
    );
  };

  return (
    <Modal visible={visible} transparent={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>{t('dateRangePicker.selectDateRange')}</Text>

            {/* Selected Dates Display */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{t('dateRangePicker.selectedRange')}</Text>
              <View style={styles.selectedDateBox}>
                <Text style={styles.selectedDateText}>{t('dateRangePicker.startDate')}</Text>
                <Text style={styles.dateValue}>
                  {selectedStartDate
                    ? selectedStartDate.toLocaleDateString()
                    : t('dateRangePicker.notSelected')}
                </Text>
              </View>
              <View style={styles.selectedDateBox}>
                <Text style={styles.selectedDateText}>{t('dateRangePicker.endDate')}</Text>
                <Text style={styles.dateValue}>
                  {selectedEndDate
                    ? selectedEndDate.toLocaleDateString()
                    : t('dateRangePicker.notSelected')}
                </Text>
              </View>
            </View>

            {/* Calendar */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                {selectingStart ? t('dateRangePicker.selectStartDate') : t('dateRangePicker.selectEndDate')}
              </Text>

              <View style={styles.calendar}>
                {/* Month/Year Navigation */}
                <View style={styles.monthYearHeader}>
                  <TouchableOpacity
                    style={styles.monthNavButton}
                    onPress={() => {
                      if (displayMonth === 0) {
                        setDisplayMonth(11);
                        setDisplayYear(displayYear - 1);
                      } else {
                        setDisplayMonth(displayMonth - 1);
                      }
                    }}
                  >
                    <MaterialIcons
                      name="chevron-left"
                      size={24}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>

                  <Text style={styles.monthYearText}>
                    {months[displayMonth]} {displayYear}
                  </Text>

                  <TouchableOpacity
                    style={styles.monthNavButton}
                    onPress={() => {
                      if (displayMonth === 11) {
                        setDisplayMonth(0);
                        setDisplayYear(displayYear + 1);
                      } else {
                        setDisplayMonth(displayMonth + 1);
                      }
                    }}
                  >
                    <MaterialIcons
                      name="chevron-right"
                      size={24}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>
                </View>

                {/* Week Days Header */}
                <View style={styles.weekDays}>
                  {weekDays.map((day, idx) => (
                    <Text key={idx} style={styles.weekDay}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((day, idx) => {
                    const isSelected = isDateSelected(day as number);
                    const isInRange = isDateInRange(day as number);

                    return (
                      <View key={idx} style={styles.dayCell}>
                        {day === null ? (
                          <View style={[styles.dayButton, styles.dayButtonEmpty]} />
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.dayButton,
                              isSelected && styles.dayButtonSelected,
                              !isSelected && isInRange && styles.dayButtonInRange,
                              !isSelected && !isInRange && styles.dayButtonSelectable,
                            ]}
                            onPress={() => handleDateSelect(day)}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                isSelected && styles.dayTextSelected,
                              ]}
                            >
                              {day}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonTertiary]}
              onPress={handleReset}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                {t('dateRangePicker.reset')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                {t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                !selectedStartDate || !selectedEndDate
                  ? { opacity: 0.5 }
                  : null,
              ]}
              onPress={handleApply}
              disabled={!selectedStartDate || !selectedEndDate}
            >
              <Text style={[styles.buttonText, styles.buttonTextPrimary]}>
                {t('dateRangePicker.apply')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DateRangePicker;
