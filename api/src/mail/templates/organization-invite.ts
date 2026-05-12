import type { CSSProperties } from 'react';
import { createElement } from 'react';
import type { OrganizationInviteEmail } from '../mailer.js';

const emailBodyStyle = {
  backgroundColor: '#f7f7f5',
  color: '#1c1c1a',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  margin: '0',
  padding: '0',
} satisfies CSSProperties;

const containerStyle = {
  margin: '0 auto',
  maxWidth: '560px',
  padding: '40px 24px',
} satisfies CSSProperties;

const panelStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #deded8',
  borderRadius: '8px',
  padding: '32px',
} satisfies CSSProperties;

const eyebrowStyle = {
  color: '#6f6f66',
  fontSize: '12px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  margin: '0 0 12px',
  textTransform: 'uppercase',
} satisfies CSSProperties;

const headingStyle = {
  color: '#1c1c1a',
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '1.25',
  margin: '0 0 16px',
} satisfies CSSProperties;

const paragraphStyle = {
  color: '#3f3f38',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 18px',
} satisfies CSSProperties;

const buttonStyle = {
  backgroundColor: '#1c1c1a',
  borderRadius: '6px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 700,
  padding: '12px 18px',
  textDecoration: 'none',
} satisfies CSSProperties;

const detailStyle = {
  borderTop: '1px solid #eeeeea',
  color: '#6f6f66',
  fontSize: '13px',
  lineHeight: '1.5',
  marginTop: '28px',
  paddingTop: '20px',
} satisfies CSSProperties;

const linkStyle = {
  color: '#1c1c1a',
  wordBreak: 'break-all',
} satisfies CSSProperties;

const formatRole = (role: OrganizationInviteEmail['role']) =>
  role.charAt(0).toUpperCase() + role.slice(1);

const formatExpiry = (expiresAt: Date) =>
  new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(expiresAt);

export function OrganizationInviteEmailTemplate(
  input: OrganizationInviteEmail,
) {
  const inviter = `${input.inviterName} (${input.inviterEmail})`;

  return createElement(
    'html',
    { lang: 'en' },
    createElement(
      'body',
      { style: emailBodyStyle },
      createElement(
        'main',
        { style: containerStyle },
        createElement(
          'section',
          { style: panelStyle },
          createElement('p', { style: eyebrowStyle }, 'Syncpad invitation'),
          createElement(
            'h1',
            { style: headingStyle },
            `Join ${input.organizationName}`,
          ),
          createElement(
            'p',
            { style: paragraphStyle },
            `${inviter} invited you to collaborate in ${input.organizationName} as ${formatRole(
              input.role,
            )}.`,
          ),
          createElement(
            'p',
            { style: paragraphStyle },
            'Sign in or create an account with this email address to review and accept the invitation.',
          ),
          createElement(
            'a',
            {
              href: input.inviteUrl,
              style: buttonStyle,
            },
            'Review invitation',
          ),
          createElement(
            'div',
            { style: detailStyle },
            createElement(
              'p',
              { style: { margin: '0 0 10px' } },
              `This invite was sent to ${input.recipientEmail} and expires ${formatExpiry(
                input.expiresAt,
              )} UTC.`,
            ),
            createElement(
              'p',
              { style: { margin: '0' } },
              'If the button does not work, open this link: ',
              createElement(
                'a',
                { href: input.inviteUrl, style: linkStyle },
                input.inviteUrl,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}
