import i18n from '@/i18n';
import ProBadge from '@/src/components/ProBadge';
import { useTheme } from '@/src/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Dimensions,
    GestureResponderEvent,
    Image,
    Modal,
    PanResponder,
    PanResponderGestureState,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

interface ClinicReviewSheetProps {
  visible: boolean;
  clinicName: string;
  clinicHeroImage?: string;
  onClose: () => void;
  onSubmit: (rating: number, feedback: string) => void;
}

const STAR_SIZE = 50;
const STARS_COUNT = 5;

export const ClinicReviewSheet: React.FC<ClinicReviewSheetProps> = ({
  visible,
  clinicName,
  clinicHeroImage,
  onClose,
  onSubmit,
}: ClinicReviewSheetProps) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dragRating, setDragRating] = useState(0);
  const [prevRating, setPrevRating] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const starFillAnim = useRef(new Animated.Value(0)).current;
  const starsContainerRef = useRef<View>(null);
  const celebrationScale = useRef(new Animated.Value(0.2)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const cooldownRef = useRef(false);

  // PanResponder for swipe/drag across stars
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt: GestureResponderEvent, state: PanResponderGestureState) => {
        const { x0, moveX } = state;
        const starsWidth = STAR_SIZE * STARS_COUNT + (STARS_COUNT - 1) * 12; // gap of 12
        const relativeX = isRTL ? x0 - moveX : moveX - x0;
        const newRating = Math.max(
          1,
          Math.min(STARS_COUNT, Math.ceil((relativeX / starsWidth) * STARS_COUNT))
        );
        setDragRating(newRating);
      },
      onPanResponderRelease: () => {
        if (dragRating > 0) {
          setRating(dragRating);
          animateStarFill();
        }
        setDragRating(0);
      },
    })
  ).current;

  const animateStarFill = () => {
    Animated.timing(starFillAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const triggerCelebration = () => {
    if (cooldownRef.current) return;
    
    cooldownRef.current = true;
    setShowCelebration(true);
    celebrationScale.setValue(0.2);
    celebrationOpacity.setValue(0);

    Animated.parallel([
      Animated.sequence([
        Animated.timing(celebrationScale, {
          toValue: 1.2,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationScale, {
          toValue: 0.95,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(300),
        Animated.timing(celebrationOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setShowCelebration(false);
      setTimeout(() => {
        cooldownRef.current = false;
      }, 1200);
    });
  };

  useEffect(() => {
    const currentRating = dragRating > 0 ? dragRating : rating;
    if (prevRating !== 5 && currentRating === 5) {
      triggerCelebration();
    }
    setPrevRating(currentRating);
  }, [rating, dragRating]);

  const handleStarTap = (index: number) => {
    setRating(index + 1);
    setDragRating(0);
    starFillAnim.setValue(0);
    animateStarFill();
  };

  const handleSubmit = () => {
    if (rating >= 1) {
      onSubmit(rating, feedback);
      setSubmitted(true);
      // Auto-close after 2 seconds
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
    }
  };

  const handleLater = () => {
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleChipPress = (chip: string) => {
    setFeedback((prev) => {
      if (!prev) return chip;
      if (prev.includes(chip)) return prev;
      const spacer = prev.trim().endsWith('.') ? ' ' : ' ';
      return `${prev.trim()}${spacer}${chip}`;
    });
  };

  const resetForm = () => {
    setRating(0);
    setFeedback('');
    setSubmitted(false);
    setDragRating(0);
    starFillAnim.setValue(0);
  };

  const starColor = isDark ? '#D4AF37' : '#0a7ea4';
  const neutralColor = isDark ? '#4b5563' : '#cbd5e1';
  const currentRating = dragRating > 0 ? dragRating : rating;
  const glowOpacity = starFillAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  const thankyouTitle = isRTL ? 'شكراً لك!' : 'Thank you!';
  const thankyouSubtitle = isRTL
    ? 'سنستخدم ملاحظاتك لتحسين خدماتنا'
    : 'We\'ll use your feedback to improve our services';

  const reviewTitle = isRTL ? 'هل أعجبتك العيادة؟' : 'Did you like this clinic?';
  const feedbackPlaceholder = isRTL
    ? 'اكتب رأيك هنا… ماذا أعجبك؟ وما الذي يمكن تحسينه؟'
    : 'Write your feedback… What did you like? What can be improved?';

  const contextPrompt = isRTL
    ? currentRating >= 4
      ? 'اذكر ما أحبه المرضى الآخرون: ودية الطاقم، وضوح الشرح، أو وقت الانتظار القصير.'
      : currentRating > 0
      ? 'شارك ما يجب تحسينه: سرعة الاستقبال، وضوح الخطة، أو الراحة أثناء العلاج.'
      : `ساعد المرضى الجدد بمعرفة ما يميز ${clinicName}.`
    : currentRating >= 4
    ? 'Call out what felt great: team warmth, clear explanations, or shorter wait time.'
    : currentRating > 0
    ? 'Share what needs improvement: speed at reception, clarity of the plan, or comfort during treatment.'
    : `Help future patients understand what stands out at ${clinicName}.`;

  const guidanceChips = isRTL
    ? ['طاقم ودود', 'شرح واضح', 'انتظار قصير', 'راحة أثناء العلاج']
    : ['Friendly team', 'Clear explanation', 'Short wait time', 'Comfort during treatment'];

  const submitBtn = isRTL ? 'إرسال' : 'Submit';
  const laterBtn = isRTL ? 'لاحقاً' : 'Later';
  const closeBtn = isRTL ? 'إغلاق' : 'Close';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#1f2937' : '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            },
          ]}
        >
          {/* Header with close button */}
          <View style={styles.header}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={isDark ? '#d1d5db' : '#111827'} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {!submitted ? (
              <>
                {/* Clinic Hero */}
                {clinicHeroImage ? (
                  <Image
                    source={{ uri: clinicHeroImage }}
                    style={styles.clinicHero}
                  />
                ) : (
                  <View
                    style={[
                      styles.clinicHero,
                      { backgroundColor: isDark ? '#374151' : '#e5e7eb' },
                    ]}
                  />
                )}

                {/* Clinic Name */}
                <Text
                  style={[
                    styles.clinicName,
                    { color: isDark ? '#f9fafb' : '#0b0f18' },
                  ]}
                >
                  {clinicName}
                </Text>

                {/* Review Title */}
                <Text
                  style={[
                    styles.reviewTitle,
                    { color: isDark ? '#f9fafb' : '#0b0f18', marginTop: 16 },
                  ]}
                >
                  {reviewTitle}
                </Text>

                {/* L1: Context-aware prompt */}
                <View
                  style={[
                    styles.promptCard,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                      borderColor: isDark ? '#1f2937' : '#e5e7eb',
                    },
                  ]}
                >
                  <Text style={[styles.promptTitle, { color: isDark ? '#e5e7eb' : '#0b0f18' }]}>
                    {isRTL ? 'انصح المراجعين بما يكتبونه' : 'Guide your review'}
                  </Text>
                  <Text style={[styles.promptText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    {contextPrompt}
                  </Text>
                </View>

                {/* Stars Row (Tap + Swipe) */}
                <View style={styles.starsWrapper}>
                  <View
                    ref={starsContainerRef}
                    style={styles.starsContainer}
                    {...panResponder.panHandlers}
                  >
                    {Array.from({ length: STARS_COUNT }).map((_, idx) => {
                      const isFilled = idx < currentRating;
                      return (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => handleStarTap(idx)}
                          style={styles.starTouchable}
                        >
                          {isFilled && (
                            <Animated.View
                              style={[
                                styles.starGlow,
                                {
                                  backgroundColor: starColor,
                                  opacity: glowOpacity,
                                },
                              ]}
                            />
                          )}
                          <Ionicons
                            name={isFilled ? 'star' : 'star-outline'}
                            size={STAR_SIZE}
                            color={isFilled ? starColor : neutralColor}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Celebration emoji overlay */}
                  {showCelebration && (
                    <Animated.View
                      style={[
                        styles.celebrationOverlay,
                        {
                          transform: [{ scale: celebrationScale }],
                          opacity: celebrationOpacity,
                        },
                      ]}
                      pointerEvents="none"
                    >
                      <Text style={styles.celebrationEmoji}>😍</Text>
                    </Animated.View>
                  )}
                </View>

                {/* K4: Connect reviews to Pro visually */}
                <View style={[styles.proConnectRow, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
                  <ProBadge size="sm" />
                  <Text style={[styles.proConnectText, { color: isDark ? '#e5e7eb' : '#0b0f18' }]}>
                    {isRTL ? 'المراجعات المفصلة والمفيدة تعزز أهلية Pro' : 'Detailed, helpful reviews boost your Pro eligibility'}
                  </Text>
                </View>

                {/* L2: Quality chips to guide better reviews */}
                <View style={styles.chipsRow}>
                  {guidanceChips.map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isDark ? '#111827' : '#e5e7eb',
                          borderColor: isDark ? '#1f2937' : '#cbd5e1',
                        },
                      ]}
                      onPress={() => handleChipPress(chip)}
                    >
                      <Text style={[styles.chipText, { color: isDark ? '#e5e7eb' : '#0b0f18' }]}>
                        {chip}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Feedback TextArea */}
                <TextInput
                  style={[
                    styles.feedbackInput,
                    {
                      color: isDark ? '#f9fafb' : '#0b0f18',
                      borderColor: isDark ? '#4b5563' : '#cbd5e1',
                      backgroundColor: isDark ? '#111827' : '#f8fafc',
                    },
                  ]}
                  placeholder={feedbackPlaceholder}
                  placeholderTextColor={isDark ? '#9ca3af' : '#9ca3af'}
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline
                  numberOfLines={8}
                  textAlignVertical="top"
                />

                {/* Action Buttons */}
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={[
                      styles.secondaryBtn,
                      { borderColor: isDark ? '#4b5563' : '#cbd5e1' },
                    ]}
                    onPress={handleLater}
                  >
                    <Text
                      style={[
                        styles.secondaryBtnText,
                        { color: isDark ? '#d1d5db' : '#6b7280' },
                      ]}
                    >
                      {laterBtn}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.primaryBtn,
                      {
                        backgroundColor: starColor,
                        opacity: rating >= 1 ? 1 : 0.5,
                      },
                    ]}
                    onPress={handleSubmit}
                    disabled={rating < 1}
                  >
                    <Text style={styles.primaryBtnText}>{submitBtn}</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              /* Thank You State */
              <View style={styles.thankYouContainer}>
                <View
                  style={[
                    styles.thankYouIcon,
                    { backgroundColor: isDark ? '#065f46' : '#d1fae5' },
                  ]}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={48}
                    color={isDark ? '#10b981' : '#059669'}
                  />
                </View>

                <Text
                  style={[
                    styles.thankYouTitle,
                    { color: isDark ? '#f9fafb' : '#0b0f18', marginTop: 16 },
                  ]}
                >
                  {thankyouTitle}
                </Text>

                <Text
                  style={[
                    styles.thankYouSubtitle,
                    { color: isDark ? '#d1d5db' : '#6b7280' },
                  ]}
                >
                  {thankyouSubtitle}
                </Text>

                {/* Show stars submitted */}
                <View style={[styles.starsContainer, { marginTop: 20 }]}>
                  {Array.from({ length: STARS_COUNT }).map((_, idx) => (
                    <Ionicons
                      key={idx}
                      name={idx < rating ? 'star' : 'star-outline'}
                      size={36}
                      color={idx < rating ? starColor : neutralColor}
                    />
                  ))}
                </View>

                {/* Close Button */}
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    { backgroundColor: starColor, marginTop: 24 },
                  ]}
                  onPress={handleClose}
                >
                  <Text style={styles.primaryBtnText}>{closeBtn}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    width: '100%',
    maxHeight: Dimensions.get('window').height * 0.9,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  closeBtn: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clinicHero: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
  },
  clinicName: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  promptCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  starsWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  celebrationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  celebrationEmoji: {
    fontSize: 72,
  },
  promptTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 13,
    lineHeight: 18,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 20,
  },
  starTouchable: {
    padding: 6,
    position: 'relative',
  },
  starGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    top: -7,
    left: -7,
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    minHeight: 200,
    maxHeight: 240,
    marginVertical: 16,
    fontFamily: 'system-ui',
    fontSize: 14,
  },
  proConnectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  proConnectText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 16,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  thankYouContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  thankYouIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thankYouTitle: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  thankYouSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    maxWidth: 280,
  },
});
