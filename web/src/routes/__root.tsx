import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AppProviders } from '#/components/app-providers';

import '../styles.css';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AppProviders>
      <Outlet />
    </AppProviders>
  );
}
