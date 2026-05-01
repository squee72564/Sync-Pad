import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId',
)({
  component: OrganizationPage,
});

function OrganizationPage() {
  return <div>Hello "/_authenticated/organizations/$organizationId"!</div>;
}
