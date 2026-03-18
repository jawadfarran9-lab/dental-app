import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
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
  const [infoVisible, setInfoVisible] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => setInfoVisible(true)} hitSlop={8}>
              <Ionicons name="information-circle-outline" size={22} color={colors.textPrimary} />
            </Pressable>
          ),
        }}
      />

      <Text style={[styles.placeholder, { color: isDark ? '#64748B' : '#94A3B8' }]}>
        Notification Schedule
      </Text>

      {/* ── Info Modal ── */}
      <Modal visible={infoVisible} transparent animationType="fade" onRequestClose={() => setInfoVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setInfoVisible(false)}>
          <View
            style={[styles.modalCard, { backgroundColor: isDark ? '#1E2A3C' : '#FFFFFF' }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalText, { color: isDark ? '#D1D5DB' : '#374151' }]}>
              This is the amount of time you spent on average using BeSmile AI each day during the last 7 days.
              {'\n\n'}
              Time is counted while you're using the app on this device.
            </Text>

            <TouchableOpacity style={styles.modalButton} activeOpacity={0.7}>
              <Text style={styles.learnMore}>Learn more</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              activeOpacity={0.7}
              onPress={() => setInfoVisible(false)}
            >
              <Text style={[styles.cancel, { color: isDark ? '#94A3B8' : '#6B7280' }]}>Cancel</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: -4 },
      },
      android: { elevation: 16 },
    }),
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  modalButton: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  learnMore: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3D9EFF',
  },
  cancelButton: {
    marginTop: 4,
  },
  cancel: {
    fontSize: 15,
    fontWeight: '500',
  },
});
