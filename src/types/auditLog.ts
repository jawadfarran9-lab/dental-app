export type AuditAction =
  | 'INVITE_CREATED'
  | 'INVITE_ACCEPTED'
  | 'INVITE_REVOKED'
  | 'ROLE_CHANGED'
  | 'MEMBER_STATUS_CHANGED'
  | 'MEMBER_REMOVED'  // PHASE T: Soft delete
  | 'SESSION_EDITED'  // PHASE U: Session edit tracking
  | 'SESSION_STATUS_CHANGED'  // PHASE AA-4.1: Status tracking
  | 'BRANDING_UPDATED' // PHASE X: Owner branding
  | 'CHECKOUT_PLACEHOLDER_CONFIRMED' // PHASE X: UI-only checkout confirmation
  | 'EMAIL_TEMPLATE_SENT' // PHASE X: Mock email dispatch
  | 'LOGIN'
  | 'LOGIN_BLOCKED'
  | 'SESSION_INVALIDATED'
  | 'IMPERSONATION_PREVENTED'
  | 'PLAN_SELECTED'
  | 'TRIAL_STARTED'
  | 'TRIAL_EXPIRED'
  | 'USAGE_LIMIT_WARNING';

export interface AuditLogEntry {
  id?: string;
  clinicId: string;
  actorId: string;
  actorName?: string;
  action: AuditAction;
  targetId?: string;
  targetName?: string;
  details?: Record<string, any>;
  createdAt?: any;
}
