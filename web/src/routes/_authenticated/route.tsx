import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: async ({ context, location }) => {
    const session = await context.auth.getSession();

    if (session.error) {
      throw session.error;
    }

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
