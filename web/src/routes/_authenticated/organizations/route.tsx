import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated/organizations')({
  component: OrganizationsLayout,
});

function OrganizationsLayout() {
  return <Outlet />;
}
