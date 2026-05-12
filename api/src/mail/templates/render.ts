import { render } from '@react-email/render';
import type { OrganizationInviteEmail } from '../mailer.js';
import { OrganizationInviteEmailTemplate } from './organization-invite.js';

export type RenderedEmail = {
  html: string;
  text: string;
};

export async function renderOrganizationInviteEmail(
  input: OrganizationInviteEmail,
): Promise<RenderedEmail> {
  const template = OrganizationInviteEmailTemplate(input);

  const [html, text] = await Promise.all([
    render(template),
    render(template, { plainText: true }),
  ]);

  return { html, text };
}
