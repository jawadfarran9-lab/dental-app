/**
 * PHASE J: Smart Reviews Engine
 * Weighted review quality scoring + Pro eligibility computation
 * UI-only, mocked data-based
 */

interface ReviewQualityMetrics {
  starScore: number;      // 0-100 based on rating
  lengthScore: number;    // 0-100 based on text length
  weightedScore: number;  // Combined score (stars 60%, length 40%)
  qualityTags: string[];  // UI signals: 'Detailed', 'Verified', 'Helpful'
}

interface ProEligibilityResult {
  isEligible: boolean;
  score: number;          // 0-100
  ratingComponent: number; // 0-40
  volumeComponent: number; // 0-40
  qualityComponent: number; // 0-20
  reason: string;         // Why eligible/not
}

/**
 * J1: Calculate weighted review quality score
 * Stars (60% weight) + Text length (40% weight)
 */
export function calculateReviewQuality(rating: number, textLength: number): ReviewQualityMetrics {
  // Star score: normalize rating (1-5) to 0-100
  const starScore = (rating / 5) * 100;

  // Length score: 0 chars = 0, 200+ chars = 100
  const normalizedLength = Math.min(textLength / 200, 1);
  const lengthScore = normalizedLength * 100;

  // Weighted score: stars 60%, length 40%
  const weightedScore = starScore * 0.6 + lengthScore * 0.4;

  // J2: Quality tags based on review properties
  const qualityTags: string[] = [];
  qualityTags.push('Verified'); // All mocked reviews are verified
  if (textLength >= 100) qualityTags.push('Detailed');
  if (textLength >= 150) qualityTags.push('Helpful');
  if (rating >= 5) qualityTags.push('Excellent');
  if (rating === 4) qualityTags.push('Good');

  return {
    starScore,
    lengthScore,
    weightedScore,
    qualityTags,
  };
}

/**
 * J3: Compute Pro eligibility based on:
 * - Rating (40%): avgRating normalized to 0-40
 * - Volume (40%): reviewCount normalized to 0-40 (cap at 100)
 * - Quality (20%): average weighted score of all reviews
 * Threshold: 70+ = Pro eligible
 */
export function computeProEligibility(
  avgRating: number,
  reviewCount: number,
  reviews: Array<{ rating: number; text: string }>
): ProEligibilityResult {
  // Rating component (0-40): avgRating / 5 * 40
  const ratingComponent = (avgRating / 5) * 40;

  // Volume component (0-40): min(reviewCount, 100) / 100 * 40
  const normalizedVolume = Math.min(reviewCount, 100) / 100;
  const volumeComponent = normalizedVolume * 40;

  // Quality component (0-20): average weighted score / 100 * 20
  const qualityScores = reviews.map((r) => calculateReviewQuality(r.rating, r.text.length).weightedScore);
  const avgQualityScore = qualityScores.length > 0 ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length : 0;
  const qualityComponent = (avgQualityScore / 100) * 20;

  // Total eligibility score (0-100)
  const score = ratingComponent + volumeComponent + qualityComponent;

  // Eligibility threshold: 70+
  const isEligible = score >= 70;

  // Reason (i18n-ready, use inline in component)
  let reason = '';
  if (isEligible) {
    reason = `Your clinic meets Pro eligibility criteria (${score.toFixed(1)}/100)`;
  } else {
    const needed = (70 - score).toFixed(1);
    reason = `${needed} more points needed for Pro (${score.toFixed(1)}/100)`;
  }

  return {
    isEligible,
    score,
    ratingComponent,
    volumeComponent,
    qualityComponent,
    reason,
  };
}

/**
 * Helper: Get quality tags for a single review
 */
export function getReviewQualityTags(rating: number, textLength: number): string[] {
  return calculateReviewQuality(rating, textLength).qualityTags;
}

/**
 * Helper: Get eligibility status text
 */
export function getEligibilityStatus(score: number): { status: string; color: string } {
  if (score >= 80) return { status: 'Excellent', color: '#10b981' }; // Green
  if (score >= 70) return { status: 'Good', color: '#3b82f6' }; // Blue
  if (score >= 55) return { status: 'Fair', color: '#f59e0b' }; // Amber
  return { status: 'Growing', color: '#6b7280' }; // Gray
}
