import PremiumGradientBackground from '@/src/components/PremiumGradientBackground';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { Stack } from 'expo-router';
import { useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NotificationScheduleScreen() {
  const { colors, isDark } = useTheme();
  const headerHeight = useHeaderHeight();
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: 'transparent', paddingTop: headerHeight }]}>
      <PremiumGradientBackground isDark={isDark} showSparkles={true} />
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => setInfoVisible(true)} hitSlop={8}>
              <Ionicons name="information-circle-outline" size={22} color={colors.textPrimary} />
            </Pressable>
          ),
        }}
      />

      <Text style={[styles.placeholder, { color: '#1A2B3F' }]}>
        Notification Schedule
      </Text>

      {/* ── Info Modal ── */}
      <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={() => setInfoVisible(false)}>
          <View
            style={[styles.modalCard, { backgroundColor: colors.modalBg, shadowColor: colors.shadow }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalText, { color: colors.modalText }]}>
              This is the amount of time you spent on average using BeSmile AI each day during the last 7 days.
              {'\n\n'}
              Time is counted while you're using the app on this device.
            </Text>

            <TouchableOpacity style={styles.modalButton} activeOpacity={0.7}>
              <Text style={[styles.learnMore, { color: colors.brandBlue }]}>Learn more</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              activeOpacity={0.7}
              onPress={() => setInfoVisible(false)}
            >
              <Text style={[styles.cancel, { color: colors.cancelText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  placeholder: { fontSize: 15, fontWeight: '500' },

  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: -6 },
      },
      android: { elevation: 12 },
    }),
  },
  modalText: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 24,
  },
  modalButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  learnMore: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 6,
  },
  cancel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
