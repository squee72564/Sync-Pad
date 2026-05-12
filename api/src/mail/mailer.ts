import type { OrganizationRole } from '@syncpad/types';

export type OrganizationInviteEmail = {
  inviteUrl: string;
  declineUrl: string;
  organizationName: string;
  inviterName: string;
  inviterEmail: string;
  recipientEmail: string;
  role: OrganizationRole;
  expiresAt: Date;
};

export type OrganizationInviteMailConfig = {
  baseUrl: string;
  ttlHours: number;
};

export interface Mailer {
  organizationInvite: OrganizationInviteMailConfig;
  sendOrganizationInvite(input: OrganizationInviteEmail): Promise<void>;
}
