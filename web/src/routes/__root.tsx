import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { AppProviders } from '#/components/app-providers';
import type { AuthContext } from '#/lib/auth-context';

import '../styles.css';

type RouterContext = {
  auth: AuthContext;
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <AppProviders queryClient={queryClient}>
      <Outlet />
    </AppProviders>
  );
}
