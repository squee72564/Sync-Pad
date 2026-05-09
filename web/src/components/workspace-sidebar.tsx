import type { WorkspaceAccessDto, WorkspacePermission } from '@syncpad/types';
import { Link, useParams } from '@tanstack/react-router';
import {
  BriefcaseBusinessIcon,
  FileTextIcon,
  FolderKanbanIcon,
  HomeIcon,
  type LucideIcon,
  Settings2Icon,
  UsersIcon,
} from 'lucide-react';
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
import type { AuthContext } from '#/lib/auth-context';
import SignOutMenuButton from './sign-out-menu-button';

type WorkspaceRouteItem = {
  title: string;
  icon: LucideIcon;
  to:
    | '/organizations/$organizationId/workspaces/$workspaceId'
    | '/organizations/$organizationId/workspaces/$workspaceId/members';
};

type OrganizationWorkspaceRouteItem = {
  title: string;
  icon: LucideIcon;
  to: '/organizations/$organizationId/workspaces';
};

type OrganizationWorkspaceResourceItem = {
  title: string;
  icon: LucideIcon;
  to: '/organizations/$organizationId/workspaces/$workspaceId/documents';
};

type WorkspaceManagementItems = {
  title: string;
  icon: LucideIcon;
  requiredPermission: WorkspacePermission;
};

type WorkspaceSidebarProps = {
  workspace?: Workspace & {
    organizationName?: string;
  };
  access: WorkspaceAccessDto;
  auth: AuthContext;
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
    title: 'Members',
    icon: UsersIcon,
    to: '/organizations/$organizationId/workspaces/$workspaceId/members',
  },
];

const organizationWorkspaceRouteItems: OrganizationWorkspaceRouteItem[] = [
  {
    title: 'Organization workspaces',
    icon: FolderKanbanIcon,
    to: '/organizations/$organizationId/workspaces',
  },
];

const workspaceContentItems: OrganizationWorkspaceResourceItem[] = [
  {
    title: 'Docs',
    icon: FileTextIcon,
    to: '/organizations/$organizationId/workspaces/$workspaceId/documents',
  },
];

const workspaceManagementItems: WorkspaceManagementItems[] = [
  {
    title: 'Workspace settings',
    icon: Settings2Icon,
    requiredPermission: 'manage',
  },
];

export function WorkspaceSidebar({
  workspace,
  access,
  auth,
}: WorkspaceSidebarProps) {
  const params = useParams({ strict: false });
  const organizationId =
    typeof params.organizationId === 'string' ? params.organizationId : null;
  const workspaceId =
    typeof params.workspaceId === 'string' ? params.workspaceId : null;
  const workspaceSubline =
    workspace?.organizationName ??
    (workspace?.description.trim().length
      ? workspace.description
      : 'Workspace overview');

  const visibleWorkspaceManagementItems = workspaceManagementItems.filter(
    (item) => access.permissions[item.requiredPermission],
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <div className="flex items-start gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-3 shadow-sm group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-9"
            style={
              workspace?.color
                ? { backgroundColor: workspace.color }
                : undefined
            }
          >
            <BriefcaseBusinessIcon className="size-4 group-data-[collapsible=icon]:size-3.5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.68rem] font-medium uppercase tracking-wide text-sidebar-foreground/60">
              Workspace
            </p>
            <p className="truncate text-sm font-semibold leading-5">
              {workspace?.name ?? 'Workspace'}
            </p>
            <p className="line-clamp-2 text-xs leading-4 text-sidebar-foreground/70">
              {workspaceSubline}
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

        {organizationId ? (
          <SidebarGroup>
            <SidebarGroupLabel>Organization</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {organizationWorkspaceRouteItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link
                        to={item.to}
                        params={{ organizationId }}
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

        {organizationId && workspaceId ? (
          <SidebarGroup>
            <SidebarGroupLabel>Content</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {workspaceContentItems.map((item) => (
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

        {visibleWorkspaceManagementItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleWorkspaceManagementItems.map((item) => (
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
        ) : null}
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SignOutMenuButton auth={auth} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
