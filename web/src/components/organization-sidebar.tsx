import type {
  OrganizationAccessDto,
  OrganizationPermission,
} from '@syncpad/types';
import { Link } from '@tanstack/react-router';
import {
  Building2Icon,
  CreditCardIcon,
  FolderKanbanIcon,
  FolderPlusIcon,
  HomeIcon,
  type LucideIcon,
  Settings2Icon,
  UserRoundPlusIcon,
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
import type { Organization } from '#/features/organizations/types';
import type { AuthContext } from '#/lib/auth-context';
import SignOutMenuButton from './sign-out-menu-button';

type PrimaryNavItem = {
  title: string;
  to:
    | '/dashboard'
    | '/dashboard/organizations'
    | '/dashboard/organizations/new'
    | '/dashboard/workspaces';
  icon: LucideIcon;
};

type OrganizationNavItem = {
  title: string;
  icon: LucideIcon;
  requiredPermission?: OrganizationPermission;
  to:
    | '/organizations/$organizationId'
    | '/organizations/$organizationId/members'
    | '/organizations/$organizationId/workspaces/new'
    | '/organizations/$organizationId/workspaces'
    | '/organizations/$organizationId/invite';
};

type OrganizationManagementItem = {
  title: string;
  icon: LucideIcon;
  requiredPermission: OrganizationPermission;
  to:
    | '/organizations/$organizationId/settings'
    | '/organizations/$organizationId/billing';
};

type OrganizationSidebarProps = {
  organization: Organization;
  access: OrganizationAccessDto;
  auth: AuthContext;
};

const primaryNavItems: PrimaryNavItem[] = [
  {
    title: 'Dashboard',
    to: '/dashboard',
    icon: HomeIcon,
  },
];

const organizationNavItems: OrganizationNavItem[] = [
  {
    title: 'Overview',
    icon: Building2Icon,
    to: '/organizations/$organizationId',
  },
  {
    title: 'Members',
    icon: UsersIcon,
    to: '/organizations/$organizationId/members',
  },
  {
    title: 'Invite member',
    icon: UserRoundPlusIcon,
    requiredPermission: 'invite',
    to: '/organizations/$organizationId/invite',
  },
  {
    title: 'Workspaces',
    icon: FolderKanbanIcon,
    to: '/organizations/$organizationId/workspaces',
  },
  {
    title: 'Create workspace',
    icon: FolderPlusIcon,
    requiredPermission: 'manage',
    to: '/organizations/$organizationId/workspaces/new',
  },
];

const organizationManagementItems: OrganizationManagementItem[] = [
  {
    title: 'Settings',
    icon: Settings2Icon,
    requiredPermission: 'manage',
    to: '/organizations/$organizationId/settings',
  },
  {
    title: 'Billing',
    icon: CreditCardIcon,
    requiredPermission: 'manage',
    to: '/organizations/$organizationId/billing',
  },
];

export function OrganizationSidebar({
  organization,
  access,
  auth,
}: OrganizationSidebarProps) {
  const organizationId = organization.id;
  const organizationDescription = organization.description.trim().length
    ? organization.description.trim()
    : 'Organization overview';
  const visibleOrganizationNavItems = organizationNavItems.filter(
    (item) =>
      item.requiredPermission === undefined ||
      access.permissions[item.requiredPermission],
  );
  const visibleOrganizationManagementItems = organizationManagementItems.filter(
    (item) => access.permissions[item.requiredPermission],
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="app-sidebar-header">
        <div className="app-sidebar-identity">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-9">
            <Building2Icon className="size-4 group-data-[collapsible=icon]:size-3.5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.68rem] font-medium uppercase tracking-wide text-sidebar-foreground/60">
              Organization
            </p>
            <p className="truncate text-sm font-semibold leading-5">
              {organization.name}
            </p>
            <p className="line-clamp-2 text-xs leading-4 text-sidebar-foreground/70">
              {organizationDescription}
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
              {visibleOrganizationNavItems.map((item) => (
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

        {visibleOrganizationManagementItems.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleOrganizationManagementItems.map((item) => (
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
