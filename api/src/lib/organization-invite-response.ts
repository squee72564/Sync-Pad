import type { OrganizationService } from '@syncpad/core';

export const toOrganizationInviteResponse = (
  organizationInvitation: Awaited<
    ReturnType<OrganizationService['getOrganizationInvitationByToken']>
  >,
) => ({
  id: organizationInvitation.id,
  organizationId: organizationInvitation.organizationId,
  email: organizationInvitation.email,
  organizationRole: organizationInvitation.organizationRole,
  status: organizationInvitation.status,
  invitedBy: organizationInvitation.invitedBy,
  acceptedBy: organizationInvitation.acceptedBy,
  expiresAt: organizationInvitation.expiresAt,
  acceptedAt: organizationInvitation.acceptedAt,
  declinedAt: organizationInvitation.declinedAt,
  revokedAt: organizationInvitation.revokedAt,
  lastSentAt: organizationInvitation.lastSentAt,
  createdAt: organizationInvitation.createdAt,
  updatedAt: organizationInvitation.updatedAt,
  isExpired: organizationInvitation.expiresAt <= new Date(),
});
