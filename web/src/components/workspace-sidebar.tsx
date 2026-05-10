import type {
  WorkspaceAccessDto,
  WorkspaceDto,
  WorkspacePermission,
} from '@syncpad/types';
import { Link } from '@tanstack/react-router';
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
  workspace: WorkspaceDto;
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
  const workspaceId = workspace.id;
  const organizationId = workspace.organizationId;
  const visibleWorkspaceManagementItems = workspaceManagementItems.filter(
    (item) => access.permissions[item.requiredPermission],
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="app-sidebar-header">
        <div className="app-sidebar-identity">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-9"
            style={{ backgroundColor: workspace.color }}
          >
            <BriefcaseBusinessIcon className="size-4 group-data-[collapsible=icon]:size-3.5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.68rem] font-medium uppercase tracking-wide text-sidebar-foreground/60">
              Workspace
            </p>
            <p className="truncate text-sm font-semibold leading-5">
              {workspace.name}
            </p>
            <p className="line-clamp-2 text-xs leading-4 text-sidebar-foreground/70">
              {workspace.description}
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

      <SidebarFooter className="app-sidebar-footer">
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
