import type { Mailer, OrganizationInviteEmail } from '../mailer.js';

export function createNoopMailer(): Mailer {
  return {
    organizationInvite: {
      baseUrl: 'http://localhost:3000',
      ttlHours: 168,
    },
    sendOrganizationInvite: async (input: OrganizationInviteEmail) => {
      void input;
    },
  };
}
