// Phase X: Email templates (security-first, no passwords)

export interface ReceiptEmailPayload {
  clinicName?: string;
  plan: 'MONTHLY' | 'YEARLY';
  amount: number;
  method: 'PAYPAL' | 'CARD' | 'BANK';
  includeAIPro?: boolean;
}

export function buildSubscriptionReceiptEmail(payload: ReceiptEmailPayload): string {
  const planLine = payload.plan === 'MONTHLY' ? 'Monthly Plan' : 'Yearly Plan';
  return [
    `Subscription Confirmation`,
    `Clinic: ${payload.clinicName || 'Your Clinic'}`,
    `Plan: ${planLine}`,
    `Amount: $${payload.amount}`,
    `Payment Method: ${payload.method}`,
    '',
    'Security Notice:',
    '- No card or bank data is stored.',
    '- Passwords are never sent by email.',
    '- Use the secure reset link if you need to set or change a password.',
  ].join('\n');
}

export function buildSecurityNoticeEmail(): string {
  return [
    'Account Security Notice',
    'We monitor unusual activity on your account.',
    'If you did not request this action, please reset your password using the secure reset link.',
    'Passwords are never sent by email.',
    'We never ask for your password.',
  ].join('\n');
}

export interface InviteAcceptedPayload {
  clinicName?: string;
  staffName?: string;
}

export function buildInviteAcceptedEmail(payload: InviteAcceptedPayload): string {
  return [
    'Invite Accepted',
    `Welcome ${payload.staffName || 'Staff'}, your access to ${payload.clinicName || 'the clinic'} is confirmed.`,
    '',
    'Security Notice:',
    '- We never ask for your password.',
    '- Passwords are never sent by email.',
    '- Use the secure reset link if you need to set or change a password.',
  ].join('\n');
}
