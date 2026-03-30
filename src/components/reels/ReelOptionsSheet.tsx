import { toggleSavePost } from '@/services/engagementService';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface ReelOptionsSheetProps {
  visible: boolean;
  reelId: string;
  clinicId: string;
  onClose: () => void;
  onHide: () => void;
}

const SHEET_HEIGHT = 300;

const REPORT_REASONS = [
  'Spam',
  'Nudity or sexual activity',
  'Hate speech or symbols',
  'Violence or dangerous organizations',
  'Sale of illegal or regulated goods',
  'Bullying or harassment',
  'Intellectual property violation',
  'False information',
  "I just don't like it",
];

// ---- Tiny inline toast ----
const useToast = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = useState('');
  const [showing, setShowing] = useState(false);

  const show = useCallback(
    (text: string) => {
      setMessage(text);
      setShowing(true);
      opacity.setValue(0);
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setShowing(false));
    },
    [opacity],
  );

  const element = showing ? (
    <Animated.View style={[toastStyles.wrap, { opacity }]} pointerEvents="none">
      <Text style={toastStyles.text}>{message}</Text>
    </Animated.View>
  ) : null;

  return { show, element };
};

const ReelOptionsSheet = ({
  visible,
  reelId,
  clinicId,
  onClose,
  onHide,
}: ReelOptionsSheetProps) => {
  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const [saved, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(sheetAnim, {
          toValue: 0,
          damping: 22,
          stiffness: 280,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, sheetAnim, backdropAnim]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(sheetAnim, {
        toValue: SHEET_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  }, [sheetAnim, backdropAnim, onClose]);

  const handleSave = useCallback(async () => {
    try {
      const nowSaved = await toggleSavePost(reelId);
      setSaved(nowSaved);
      toast.show(nowSaved ? 'Saved' : 'Removed');
    } catch {
      // silent
    }
    dismiss();
  }, [reelId, dismiss, toast]);

  const handleNotInterested = useCallback(() => {
    toast.show('Not interested');
    onHide();
    dismiss();
  }, [onHide, dismiss, toast]);

  const handleReport = useCallback(() => {
    setReportOpen(true);
  }, []);

  const handleReportReason = useCallback(
    (reason: string) => {
      setReportOpen(false);
      toast.show('Thanks for reporting');
      dismiss();
    },
    [dismiss, toast],
  );

  const closeReport = useCallback(() => {
    setReportOpen(false);
  }, []);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      {toast.element}

      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </Pressable>

      {/* Main sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
      >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          onPress={handleSave}
        >
          <View style={styles.iconWrap}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color="#fff"
            />
          </View>
          <Text style={styles.optionText}>{saved ? 'Unsave' : 'Save'}</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          onPress={handleNotInterested}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="eye-off-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.optionText}>Not interested</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          onPress={handleReport}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="flag-outline" size={24} color="#FF453A" />
          </View>
          <Text style={[styles.optionText, { color: '#FF453A' }]}>Report</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.option, styles.cancel, pressed && styles.pressed]}
          onPress={dismiss}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>

      {/* Report reasons modal */}
      <Modal visible={reportOpen} transparent animationType="slide" onRequestClose={closeReport}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeReport}>
          <View style={styles.backdrop} />
        </Pressable>
        <View style={styles.reportSheet}>
          <View style={styles.handleRow}>
            <View style={styles.handle} />
          </View>
          <Text style={styles.reportTitle}>Why are you reporting this?</Text>
          <FlatList
            data={REPORT_REASONS}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <Pressable style={styles.reportRow} onPress={() => handleReportReason(item)}>
                <Text style={styles.reportRowText}>{item}</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.4)" />
              </Pressable>
            )}
          />
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  handleRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 18,
    paddingHorizontal: 22,
  },
  pressed: {
    opacity: 0.6,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
  },
  optionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancel: {
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 16,
    fontWeight: '500',
  },
  // Report modal
  reportSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '60%',
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  reportTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  reportRowText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '400',
  },
});

const toastStyles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 100,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ReelOptionsSheet;
