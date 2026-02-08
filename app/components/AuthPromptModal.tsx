import { useClinic } from '@/src/context/ClinicContext';
import { useTheme } from '@/src/context/ThemeContext';
import { findUserByEmailAndPassword } from '@/src/services/clinicMembersService';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface AuthPromptModalProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  userEmail?: string;  // Email of the clinic user
}

export default function AuthPromptModal({
  visible,
  onSuccess,
  onCancel,
  title = 'Verify Your Identity',
  userEmail = '',
}: AuthPromptModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { colors } = useTheme();
  const { clinicUser } = useClinic();

  const handleVerify = async () => {
    if (!password.trim()) {
      Alert.alert('Validation', 'Please enter your password');
      return;
    }

    if (!userEmail) {
      Alert.alert('Error', 'User email not found');
      return;
    }

    setLoading(true);
    try {
      // Verify password by attempting to find the user with email + password
      const result = await findUserByEmailAndPassword(
        userEmail,
        password
      );

      if (result) {
        // Password is correct
        setPassword('');
        setShowPassword(false);
        Keyboard.dismiss();
        onSuccess();
      } else {
        Alert.alert('Error', 'Incorrect password');
      }
    } catch (error: any) {
      // Error logging disabled for production
      Alert.alert('Error', error.message || 'Password verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setShowPassword(false);
    Keyboard.dismiss();
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        onPress={handleCancel}
        activeOpacity={1}
      >
        <TouchableOpacity
          style={[styles.modalContainer, { backgroundColor: colors.card }]}
          onPress={() => {}} // Prevent closing when tapping inside modal
          activeOpacity={1}
        >
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="lock-closed" size={28} color={colors.accentBlue} />
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
          </View>

          {/* Description */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Please enter your password to continue
          </Text>

          {/* Password Input */}
          <View
            style={[
              styles.inputContainer,
              { borderColor: colors.cardBorder, backgroundColor: colors.inputBackground },
            ]}
          >
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { color: colors.textPrimary }]}
              editable={!loading}
              onSubmitEditing={handleVerify}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye' : 'eye-off'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.verifyButton,
                { backgroundColor: colors.accentBlue, opacity: loading ? 0.6 : 1 },
              ]}
              onPress={handleVerify}
              disabled={loading || !password.trim()}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.verifyButtonText}>Verify</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { borderColor: colors.cardBorder, backgroundColor: colors.inputBackground },
              ]}
              onPress={handleCancel}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: colors.textPrimary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },
  description: {
    fontSize: 14,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 20,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  eyeButton: {
    padding: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  verifyButton: {
    flex: 1.2,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    borderWidth: 1.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
