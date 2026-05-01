import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/workspaces',
)({
  component: OrganizationWorkspaceLayout,
});

function OrganizationWorkspaceLayout() {
  return <Outlet />;
}
