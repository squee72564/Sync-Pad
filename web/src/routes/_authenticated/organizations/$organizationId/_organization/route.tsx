import { createFileRoute, Outlet } from '@tanstack/react-router';
import { PanelLeftDashedIcon } from 'lucide-react';
import { OrganizationSidebar } from '#/components/organization-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from '#/components/ui/sidebar';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization',
)({
  component: OrganizationShell,
});

function OrganizationShell() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': '18rem',
          '--sidebar-width-mobile': '18rem',
        } as React.CSSProperties
      }
    >
      <OrganizationSidebar />
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
