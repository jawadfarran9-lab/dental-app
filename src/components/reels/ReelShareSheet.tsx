import { generatePostDeepLink } from '@/app/utils/deepLinking';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef } from 'react';
import {
    Animated,
    Modal,
    Pressable,
    Share,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import useToast from './useToast';

interface ReelShareSheetProps {
  visible: boolean;
  reelId: string;
  onClose: () => void;
}

const SHEET_HEIGHT = 280;

const ReelShareSheet = ({ visible, reelId, onClose }: ReelShareSheetProps) => {
  const sheetAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
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

  const handleCopyLink = useCallback(async () => {
    await Clipboard.setStringAsync(generatePostDeepLink(reelId));
    toast.show('Link copied');
    dismiss();
  }, [reelId, dismiss, toast]);

  const handleShareTo = useCallback(async () => {
    dismiss();
    // Small delay so sheet animates out before native share appears
    setTimeout(async () => {
      try {
        await Share.share({
          message: `Check this out on BeSmile AI!\n\n${generatePostDeepLink(reelId)}`,
        });
      } catch {
        // User cancelled or share failed
      }
    }, 250);
  }, [reelId, dismiss]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      {toast.element}

      {/* Backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={dismiss}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </Pressable>

      {/* Sheet */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}
      >
        <View style={styles.handleRow}>
          <View style={styles.handle} />
        </View>

        {/* Send via (placeholder) */}
        <View style={[styles.option, styles.placeholder]}>
          <View style={styles.iconWrap}>
            <Ionicons name="paper-plane-outline" size={24} color="rgba(255,255,255,0.35)" />
          </View>
          <Text style={styles.placeholderText}>Send via...</Text>
        </View>

        {/* Copy Link */}
        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          onPress={handleCopyLink}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="link-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.optionText}>Copy Link</Text>
        </Pressable>

        {/* Share to... (native) */}
        <Pressable
          style={({ pressed }) => [styles.option, pressed && styles.pressed]}
          onPress={handleShareTo}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.optionText}>Share to...</Text>
        </Pressable>

        {/* Cancel */}
        <Pressable
          style={({ pressed }) => [styles.option, styles.cancel, pressed && styles.pressed]}
          onPress={dismiss}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Animated.View>
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
  placeholder: {
    opacity: 0.45,
  },
  placeholderText: {
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
});

export default ReelShareSheet;
