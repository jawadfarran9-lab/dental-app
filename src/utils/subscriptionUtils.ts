/**
 * Subscription Status Utility
 *
 * Single source of truth for determining whether a clinic has an active subscription.
 * Used by login.tsx and AuthContext.tsx to make consistent access decisions.
 *
 * Rules:
 * 1. If `status` field exists → use it: only "active" grants access.
 * 2. If `status` field is missing (legacy docs) → fall back to `subscribed === true`.
 *
 * Phase 1B: status is the primary authority.
 */

/**
 * Determines whether a clinic document represents an active subscription.
 *
 * @param clinicData - The Firestore clinic document data (plain object).
 * @returns `true` only when the clinic should be treated as actively subscribed.
 */
export function hasActiveSubscription(clinicData: Record<string, any>): boolean {
  // Primary authority: status field
  if (clinicData.status !== undefined && clinicData.status !== null) {
    return clinicData.status === 'active';
  }

  // Legacy compatibility: older docs without status field
  return clinicData.subscribed === true;
}

/**
 * Statuses that unambiguously represent NON-active subscription state.
 * Used by subscribe.tsx (auto-open renew sheet) and renew-subscribe.tsx
 * (allow the plan-picker guard). Includes 'pending_subscription' so newly
 * signed-up but never-paid clinics are treated as inactive here too, matching
 * `!hasActiveSubscription`.
 */
export const INACTIVE_STATUSES: readonly string[] = [
  'cancelled',
  'expired',
  'inactive',
  'past_due',
  'pending_subscription',
];
