import type { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import type { AuthContext } from '#/lib/auth-context';
import { routeTree } from './routeTree.gen';

export function getRouter({
  auth,
  queryClient,
}: {
  auth: AuthContext;
  queryClient: QueryClient;
}) {
  const router = createTanStackRouter({
    routeTree,
    context: { auth, queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadDelay: 150,
    defaultPreloadStaleTime: 0,
  });

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
