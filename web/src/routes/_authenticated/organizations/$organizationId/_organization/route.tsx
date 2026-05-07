import { createFileRoute, Outlet } from '@tanstack/react-router';
import { PanelLeftDashedIcon } from 'lucide-react';
import { OrganizationSidebar } from '#/components/organization-sidebar';
import { ScopeRouteError } from '#/components/scope-route-error';
import {
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '#/components/ui/sidebar';
import { organizationQuery } from '#/features/organizations/queries';
import { assertUuidParam } from '#/lib/route-params';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization',
)({
  loader: ({ context, params }) => {
    assertUuidParam('Organization', params.organizationId);

    return context.queryClient.ensureQueryData(
      organizationQuery(params.organizationId),
    );
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Organization not found"
      fallbackDescription="This organization does not exist or you do not have access to it."
    />
  ),
  component: OrganizationShell,
});

function OrganizationShell() {
  const { organization, access } = Route.useLoaderData();

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '18rem',
          '--sidebar-width-mobile': '18rem',
        } as React.CSSProperties
      }
    >
      <OrganizationSidebar organization={organization} access={access} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-6">
          <SidebarTrigger />
          <SidebarSeparator
            orientation="vertical"
            className="mx-0 h-5 w-px shrink-0"
          />
          <div className="ml-auto hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs text-muted-foreground sm:flex">
            <PanelLeftDashedIcon className="size-3.5" />
            Toggle sidebar with Cmd/Ctrl + B
          </div>
        </header>

        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
