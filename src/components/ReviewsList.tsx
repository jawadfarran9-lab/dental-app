import i18n from '@/i18n';
import ProBadge from '@/src/components/ProBadge';
import { useTheme } from '@/src/context/ThemeContext';
import { calculateReviewQuality, getReviewQualityTags } from '@/src/utils/reviewEngine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  verified: boolean;
  date: string;
}

interface ReviewsListProps {
  visible: boolean;
  clinicName: string;
  reviews?: Review[];
  avgRating: number;
  onClose: () => void;
}

// Mocked reviews data (UI-only)
const MOCKED_REVIEWS: Review[] = [
  {
    id: '1',
    name: 'Ahmed Mohammed',
    rating: 5,
    text: 'Excellent service and friendly staff. The doctor was very professional and explained everything clearly. Would definitely recommend to others.',
    verified: true,
    date: '2 weeks ago',
  },
  {
    id: '2',
    name: 'Fatima Hassan',
    rating: 4,
    text: 'Great clinic with modern equipment. A bit crowded during peak hours but the team works efficiently.',
    verified: true,
    date: '1 month ago',
  },
  {
    id: '3',
    name: 'Karim Ali',
    rating: 5,
    text: 'من أفضل العيادات التي زرتها. طاقم يتسم بالاحترافية والودية. سأعود مرة أخرى بكل تأكيد.',
    verified: true,
    date: '3 weeks ago',
  },
  {
    id: '4',
    name: 'Zainab Omar',
    rating: 4,
    text: 'النظافة والتعقيم ممتاز جداً. السعر مناسب والموظفين لطفاء.',
    verified: true,
    date: '1 week ago',
  },
  {
    id: '5',
    name: 'Mohammed Saleh',
    rating: 5,
    text: 'Fantastic dentist! Pain-free treatment and results exceeded my expectations.',
    verified: true,
    date: '5 days ago',
  },
];

export const ReviewsList: React.FC<ReviewsListProps> = ({
  visible,
  clinicName,
  reviews = MOCKED_REVIEWS,
  avgRating,
  onClose,
}: ReviewsListProps) => {
  const { colors, isDark } = useTheme();
  const isRTL = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);

  const socialProofMessages = isRTL
    ? [
        '٨ من أصل ١٠ مرضى يقرؤون أحدث المراجعات قبل الحجز',
        'ذكر المرضى "شرح واضح" و"راحة" هذا الشهر',
      ]
    : [
        '8 of 10 patients read recent reviews before booking',
        'Patients mention "clear explanations" and "comfort" this month',
      ];

  const renderStars = (rating: number, size: number = 14) => (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <Ionicons
          key={idx}
          name={idx < rating ? 'star' : 'star-outline'}
          size={size}
          color={idx < rating ? (isDark ? '#D4AF37' : '#0a7ea4') : isDark ? '#4b5563' : '#cbd5e1'}
        />
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: isDark ? '#0a0b10' : '#fff' }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#1f2636' : '#e5e7eb' }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons
              name={isRTL ? 'chevron-forward' : 'chevron-back'}
              size={24}
              color={isDark ? '#f9fafb' : '#0b0f18'}
            />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={[styles.headerText, { color: isDark ? '#f9fafb' : '#0b0f18' }]}>
              {isRTL ? 'التقييمات' : 'Reviews'}
            </Text>
            <Text style={[styles.clinicNameText, { color: isDark ? '#e5e7eb' : '#4b5563' }]}>
              {clinicName}
            </Text>
          </View>
          <View style={styles.spacer} />
        </View>

        {/* Summary */}
        <View style={[styles.summaryCard, { backgroundColor: isDark ? '#121624' : '#f9fafb' }]}>
          <View style={styles.ratingBig}>
            <Text style={[styles.ratingNumber, { color: isDark ? '#d4af37' : '#0a7ea4' }]}>
              {avgRating.toFixed(1)}
            </Text>
            <View style={styles.ratingDetails}>
              {renderStars(Math.round(avgRating), 16)}
              <Text style={[styles.reviewCount, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                {isRTL ? `${reviews.length} تقييم` : `${reviews.length} reviews`}
              </Text>
            </View>
          </View>
        </View>

        {/* L4: Social proof micro-messages (UI-only) */}
        <View style={styles.socialProofRow}>
          {socialProofMessages.map((msg, idx) => (
            <View
              key={idx}
              style={[
                styles.socialProofPill,
                {
                  backgroundColor: isDark ? '#0f172a' : '#eef2ff',
                  borderColor: isDark ? '#1f2636' : '#c7d2fe',
                },
              ]}
            >
              <Ionicons name="sparkles" size={14} color={isDark ? '#fbbf24' : '#7c3aed'} />
              <Text style={[styles.socialProofText, { color: isDark ? '#e5e7eb' : '#312e81' }]}>
                {msg}
              </Text>
            </View>
          ))}
        </View>

        {/* K4: Connect reviews to Pro eligibility (UI-only) */}
        <View style={[styles.proConnectRow, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9', borderColor: isDark ? '#1f2636' : '#e5e7eb' }]}>
          <ProBadge size="sm" />
          <Text style={[styles.proConnectText, { color: isDark ? '#e5e7eb' : '#0b0f18' }]}>
            {isRTL ? 'المراجعات المفصلة تساعد في ترقية العيادة إلى Pro' : 'Detailed, helpful reviews boost your Pro eligibility'}
          </Text>
        </View>

        {/* Reviews List */}
        <ScrollView style={styles.reviewsContainer} contentContainerStyle={styles.reviewsContent}>
          {reviews.map((review) => (
            <View
              key={review.id}
              style={[
                styles.reviewCard,
                {
                  backgroundColor: isDark ? '#1a1f2e' : '#fff',
                  borderColor: isDark ? '#1f2636' : '#e5e7eb',
                },
              ]}
            >
              {/* Review Header */}
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {review.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.nameDate}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.reviewerName, { color: isDark ? '#f9fafb' : '#0b0f18' }]}>
                        {review.name}
                      </Text>
                      {review.verified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={isDark ? '#10b981' : '#059669'}
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </View>
                    <Text style={[styles.reviewDate, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                      {review.date}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stars */}
              <View style={styles.reviewStars}>{renderStars(review.rating, 14)}</View>

              {/* Quality Tags (J2) */}
              {(() => {
                const tags = getReviewQualityTags(review.rating, review.text.length);
                return tags.length > 0 ? (
                  <View style={styles.tagsRow}>
                    {tags.map((tag, idx) => (
                      <View
                        key={idx}
                        style={[
                          styles.qualityTag,
                          { backgroundColor: isDark ? '#1f2636' : '#f3f4f6' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.qualityTagText,
                            { color: isDark ? '#9ca3af' : '#6b7280' },
                          ]}
                        >
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null;
              })()}

              {/* L3: Visual weighting for reviews (UI-only) */}
              {(() => {
                const quality = calculateReviewQuality(review.rating, review.text.length);
                const weightPct = Math.round(quality.weightedScore);
                return (
                  <View
                    style={[
                      styles.weightRow,
                      {
                        backgroundColor: isDark ? '#0b1220' : '#f8fafc',
                        borderColor: isDark ? '#1f2636' : '#e5e7eb',
                      },
                    ]}
                  >
                    <Text style={[styles.weightLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {isRTL ? 'وزن المراجعة لرؤى الجودة' : 'Weight toward quality insights'}
                    </Text>
                    <View style={[styles.weightBar, { backgroundColor: isDark ? '#0f172a' : '#e5e7eb' }]}>
                      <View
                        style={[
                          styles.weightFill,
                          { width: `${weightPct}%`, backgroundColor: isDark ? '#38bdf8' : '#0ea5e9' },
                        ]}
                      />
                    </View>
                    <Text style={[styles.weightValue, { color: isDark ? '#e5e7eb' : '#0f172a' }]}>{weightPct}%</Text>
                  </View>
                );
              })()}

              {/* Review Text */}
              <Text
                style={[styles.reviewText, { color: isDark ? '#e5e7eb' : '#4b5563' }]}
                numberOfLines={4}
              >
                {review.text}
              </Text>

              {/* Verified Badge */}
              {review.verified && (
                <View
                  style={[
                    styles.verifiedBadge,
                    { backgroundColor: isDark ? '#065f46' : '#d1fae5' },
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={12}
                    color={isDark ? '#10b981' : '#059669'}
                  />
                  <Text
                    style={[
                      styles.verifiedText,
                      { color: isDark ? '#10b981' : '#059669' },
                    ]}
                  >
                    {isRTL ? 'موثق' : 'Verified'}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    marginLeft: 12,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '800',
  },
  clinicNameText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  spacer: {
    width: 40,
  },
  summaryCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  ratingBig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: '800',
    minWidth: 60,
  },
  ratingDetails: {
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  reviewCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  socialProofRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  socialProofPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  socialProofText: {
    fontSize: 12,
    fontWeight: '700',
  },
  proConnectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  proConnectText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  reviewsContainer: {
    flex: 1,
  },
  reviewsContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  reviewHeader: {
    marginBottom: 12,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
  },
  nameDate: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewDate: {
    fontSize: 12,
    marginTop: 2,
  },
  reviewStars: {
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  qualityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qualityTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
  },
  weightLabel: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  weightBar: {
    height: 8,
    flex: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  weightFill: {
    height: 8,
    borderRadius: 999,
  },
  weightValue: {
    fontSize: 12,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
