import { Link, useParams } from '@tanstack/react-router';
import {
  BotIcon,
  CalendarClockIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HomeIcon,
  LayoutGridIcon,
  LogOutIcon,
  type LucideIcon,
  Settings2Icon,
  Table2Icon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '#/components/ui/sidebar';
import type { Workspace } from '#/features/workspaces/types';
import { authClient } from '#/lib/auth-client';

type WorkspaceRouteItem = {
  title: string;
  icon: LucideIcon;
  to:
    | '/dashboard/workspaces'
    | '/organizations/$organizationId/workspaces/$workspaceId';
};

type PendingWorkspaceItem = {
  title: string;
  icon: LucideIcon;
};

type WorkspaceSidebarProps = {
  workspace?: Workspace;
};

type PrimaryNavItem = {
  title: string;
  to: '/dashboard';
  icon: LucideIcon;
};

const primaryNavItems: PrimaryNavItem[] = [
  {
    title: 'Dashboard',
    to: '/dashboard',
    icon: HomeIcon,
  },
];

const workspaceRouteItems: WorkspaceRouteItem[] = [
  {
    title: 'Workspace home',
    icon: HomeIcon,
    to: '/organizations/$organizationId/workspaces/$workspaceId',
  },
  {
    title: 'All workspaces',
    icon: FolderKanbanIcon,
    to: '/dashboard/workspaces',
  },
];

const workspaceContentItems: PendingWorkspaceItem[] = [
  {
    title: 'Docs',
    icon: FileTextIcon,
  },
  {
    title: 'Timeline',
    icon: CalendarClockIcon,
  },
  {
    title: 'Sheets',
    icon: Table2Icon,
  },
];

const workspaceManagementItems: PendingWorkspaceItem[] = [
  {
    title: 'Workspace settings',
    icon: Settings2Icon,
  },
];

export function WorkspaceSidebar({ workspace }: WorkspaceSidebarProps) {
  const params = useParams({ strict: false });
  const organizationId =
    typeof params.organizationId === 'string' ? params.organizationId : null;
  const workspaceId =
    typeof params.workspaceId === 'string' ? params.workspaceId : null;
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    await authClient.signOut({
      fetchOptions: {
        onRequest: () => {
          setIsSigningOut(true);
        },
        onSuccess: () => {
          setIsSigningOut(false);
          toast.success('Signed out');
          window.location.assign('/signin');
        },
        onError: (ctx) => {
          setIsSigningOut(false);
          toast.error(ctx.error.message || 'Unable to sign out.');
        },
      },
    });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <div className="flex items-start gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 px-3 py-3 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-9">
            <LayoutGridIcon className="size-4 group-data-[collapsible=icon]:size-3.5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">
              {workspace?.name ?? 'Workspace'}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {workspace?.id ?? workspaceId ?? 'Workspace overview'}
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Home</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link
                      to={item.to}
                      activeOptions={{ exact: true }}
                      activeProps={{ 'data-active': true }}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {organizationId && workspaceId ? (
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {workspaceRouteItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link
                        to={item.to}
                        params={{ organizationId, workspaceId }}
                        activeOptions={{ exact: true }}
                        activeProps={{ 'data-active': true }}
                      >
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarGroupLabel>Content</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceContentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} disabled>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceManagementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} disabled>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={isSigningOut ? 'Signing out...' : 'Sign out'}
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="border border-sidebar-border/70 bg-sidebar-accent/30 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center"
            >
              {isSigningOut ? (
                <BotIcon className="size-4 animate-pulse group-data-[collapsible=icon]:size-3.5" />
              ) : (
                <LogOutIcon className="size-4 group-data-[collapsible=icon]:size-3.5" />
              )}
              <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
