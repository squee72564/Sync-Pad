import type {
  OrganizationAccessDto,
  OrganizationPermission,
} from '@syncpad/types';
import { Link, useParams } from '@tanstack/react-router';
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
    | '/organizations/$organizationId/members/new';
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
    requiredPermission: 'manage',
    to: '/organizations/$organizationId/members/new',
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
  const params = useParams({ strict: false });
  const organizationId =
    typeof params.organizationId === 'string' ? params.organizationId : null;
  const organizationDescription = organization.description.trim().length
    ? organization.description
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
      <SidebarHeader className="gap-3 px-3 py-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
        <div className="flex items-start gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-3 shadow-sm group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
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

        {organizationId ? (
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
        ) : null}

        {organizationId && visibleOrganizationManagementItems.length > 0 ? (
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
