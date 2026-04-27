import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { authClient } from '#/lib/auth-client';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();

    if (!session.data?.session) {
      throw redirect({
        to: '/signin',
        search: { redirect: location.href },
      });
    }

    return { session: session.data };
  },
});

function AuthenticatedLayout() {
  return <Outlet />;
}
