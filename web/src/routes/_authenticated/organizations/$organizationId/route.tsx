import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId',
)({
  component: OrganizationLayout,
});

function OrganizationLayout() {
  return <Outlet />;
}
