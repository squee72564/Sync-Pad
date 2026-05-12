import { StatusCodes } from 'http-status-codes';
import { Resend } from 'resend';
import type { Env } from '../../lib/env.js';
import { ApiError } from '../../lib/error.js';
import type { Mailer, OrganizationInviteEmail } from '../mailer.js';
import { renderOrganizationInviteEmail } from '../templates/render.js';

const displayNamePart = /^[^<>"\r\n]+$/;

const buildReplyTo = (input: OrganizationInviteEmail, env: Env) => {
  if (env.MAIL_REPLY_TO) {
    return env.MAIL_REPLY_TO;
  }

  if (!input.inviterEmail.trim()) {
    return undefined;
  }

  if (!displayNamePart.test(input.inviterName.trim())) {
    return input.inviterEmail;
  }

  return `${input.inviterName.trim()} <${input.inviterEmail}>`;
};

export function createResendMailer(env: Env): Mailer {
  const resend = new Resend(env.RESEND_API_KEY);

  return {
    organizationInvite: {
      baseUrl: env.BETTER_AUTH_URL,
      ttlHours: env.ORGANIZATION_INVITE_TTL_HOURS,
    },
    sendOrganizationInvite: async (input: OrganizationInviteEmail) => {
      const { html, text } = await renderOrganizationInviteEmail(input);
      const { error } = await resend.emails.send({
        from: env.MAIL_FROM,
        to: input.recipientEmail,
        replyTo: buildReplyTo(input, env),
        subject: `${input.inviterName} invited you to ${input.organizationName} on Syncpad`,
        html,
        text,
      });

      if (error) {
        throw new ApiError({
          code: 'MAIL_SEND_FAILED',
          details: {
            provider: 'resend',
            providerError: error,
            recipientEmail: input.recipientEmail,
          },
          expose: false,
          message: `Resend failed to send organization invite email to ${input.recipientEmail}`,
          status: StatusCodes.INTERNAL_SERVER_ERROR,
          userMessage: 'Unable to send invitation email.',
        });
      }
    },
  };
}
