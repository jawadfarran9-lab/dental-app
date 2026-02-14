import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StarAvatar from '@/src/components/StarAvatar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const PROFILE_SIZE = 56;

const QUESTION_COLORS = [
  '#FFFFFF',
  '#22C55E',
  '#1E90FF',
  '#06B6D4',
  '#8B5CF6',
  '#F97316',
  '#EC4899',
  '#000000',
];

/** Returns true when the hex colour is perceptually dark. */
function isDark(hex: string): boolean {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  // W3C relative luminance approximation
  return r * 0.299 + g * 0.587 + b * 0.114 < 140;
}

export default function QuestionEditorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    editUri?: string;
    editWidth?: string;
    editHeight?: string;
    editMediaType?: string;
  }>();

  const [colorIndex, setColorIndex] = useState(0);
  const [questionText, setQuestionText] = useState('');

  const bgColor = QUESTION_COLORS[colorIndex];
  const textColor = isDark(bgColor) ? '#FFFFFF' : '#000000';
  const subtleOpacity = isDark(bgColor) ? 0.35 : 0.2;

  // Next colour in the palette (shown inside the colour-cycle button)
  const nextColor = useMemo(
    () => QUESTION_COLORS[(colorIndex + 1) % QUESTION_COLORS.length],
    [colorIndex],
  );

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        {/* X — close */}
        <TouchableOpacity
          style={styles.headerSide}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Colour cycle button */}
        <TouchableOpacity
          style={styles.colorButton}
          onPress={() =>
            setColorIndex(prev => (prev + 1) % QUESTION_COLORS.length)
          }
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.colorCircle,
              { backgroundColor: nextColor, borderColor: '#FFFFFF' },
            ]}
          />
        </TouchableOpacity>

        {/* Done */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => {
            const finalText = questionText.trim() || 'Ask me a question';
            router.navigate({
              pathname: '/story/edit',
              params: {
                uri: params.editUri || '',
                width: params.editWidth || '',
                height: params.editHeight || '',
                mediaType: params.editMediaType || '',
                questionText: finalText,
                questionBgColor: bgColor,
                questionProfileUrl: 'https://ui-avatars.com/api/?name=Me&background=888&color=fff&size=112',
              },
            });
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Body ─── */}
      <View style={styles.body}>
        {/* Card */}
        <View style={[styles.card, { backgroundColor: bgColor }]}>
          {/* Profile image — overlaps top edge */}
          <View style={styles.profileWrapper}>
            <StarAvatar
              size={PROFILE_SIZE}
              uri="https://ui-avatars.com/api/?name=Me&background=888&color=fff&size=112"
            />
          </View>

          {/* Question TextInput */}
          <TextInput
            style={[styles.questionInput, { color: textColor }]}
            placeholder="Ask me a question"
            placeholderTextColor={
              isDark(bgColor) ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)'
            }
            value={questionText}
            onChangeText={setQuestionText}
            multiline
            numberOfLines={3}
            maxLength={200}
            textAlignVertical="center"
            blurOnSubmit
          />

          {/* Secondary box */}
          <View
            style={[
              styles.responseBox,
              {
                backgroundColor: isDark(bgColor)
                  ? `rgba(255,255,255,${subtleOpacity})`
                  : `rgba(0,0,0,${subtleOpacity})`,
              },
            ]}
          >
            <Text style={[styles.responseText, { color: textColor }]}>
              Viewers respond here
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerSide: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  doneText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },

  /* ── Body ── */
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* ── Card ── */
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    paddingTop: PROFILE_SIZE / 2 + 16, // space for the overlapping profile
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  profileWrapper: {
    position: 'absolute',
    top: -(PROFILE_SIZE / 2),
    alignSelf: 'center',
  },

  /* ── Question input ── */
  questionInput: {
    width: '100%',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    minHeight: 72, // ~3 lines
    marginBottom: 16,
    padding: 0,
  },

  /* ── Response box ── */
  responseBox: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  responseText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
