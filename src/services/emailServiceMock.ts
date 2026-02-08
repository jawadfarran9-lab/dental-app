import { buildSubscriptionReceiptEmail, buildSecurityNoticeEmail, buildInviteAcceptedEmail, ReceiptEmailPayload, InviteAcceptedPayload } from './emailTemplates';
import { writeAuditLog } from './auditLogService';

// Phase X: Mock email sender (no real email dispatch)
export async function sendSubscriptionReceiptMock(params: {
  clinicId?: string;
  actorId?: string;
  actorName?: string;
  payload: ReceiptEmailPayload;
}): Promise<{ preview: string }> {
  const preview = buildSubscriptionReceiptEmail(params.payload);
  if (params.clinicId) {
    await writeAuditLog({
      clinicId: params.clinicId,
      actorId: params.actorId || 'system',
      actorName: params.actorName,
      action: 'EMAIL_TEMPLATE_SENT',
      targetId: params.payload.plan,
      details: { type: 'subscription_receipt', method: params.payload.method },
    });
  }
  console.log('[EMAIL MOCK] Subscription receipt preview:\n', preview);
  return { preview };
}

export async function sendSecurityNoticeMock(params: {
  clinicId?: string;
  actorId?: string;
  actorName?: string;
}): Promise<{ preview: string }> {
  const preview = buildSecurityNoticeEmail();
  if (params.clinicId) {
    await writeAuditLog({
      clinicId: params.clinicId,
      actorId: params.actorId || 'system',
      actorName: params.actorName,
      action: 'EMAIL_TEMPLATE_SENT',
      targetId: 'security_notice',
      details: { type: 'security_notice' },
    });
  }
  console.log('[EMAIL MOCK] Security notice preview:\n', preview);
  return { preview };
}

export async function sendInviteAcceptedMock(params: {
  clinicId?: string;
  actorId?: string;
  actorName?: string;
  payload: InviteAcceptedPayload;
}): Promise<{ preview: string }> {
  const preview = buildInviteAcceptedEmail(params.payload);
  if (params.clinicId) {
    await writeAuditLog({
      clinicId: params.clinicId,
      actorId: params.actorId || 'system',
      actorName: params.actorName,
      action: 'EMAIL_TEMPLATE_SENT',
      targetId: 'invite_accepted',
      details: { type: 'invite_accepted' },
    });
  }
  console.log('[EMAIL MOCK] Invite accepted preview:\n', preview);
  return { preview };
}
