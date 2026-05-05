import { Link, useParams } from '@tanstack/react-router';
import {
  BotIcon,
  Building2Icon,
  CreditCardIcon,
  FolderKanbanIcon,
  FolderPlusIcon,
  HomeIcon,
  LogOutIcon,
  type LucideIcon,
  Settings2Icon,
  UserRoundPlusIcon,
  UsersIcon,
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
import type { Organization } from '#/features/organizations/types';
import { authClient } from '#/lib/auth-client';

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
  to:
    | '/organizations/$organizationId/settings'
    | '/organizations/$organizationId/billing';
};

type OrganizationSidebarProps = {
  organization?: Organization;
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
    to: '/organizations/$organizationId/workspaces/new',
  },
];

const organizationManagementItems: OrganizationManagementItem[] = [
  {
    title: 'Settings',
    icon: Settings2Icon,
    to: '/organizations/$organizationId/settings',
  },
  {
    title: 'Billing',
    icon: CreditCardIcon,
    to: '/organizations/$organizationId/billing',
  },
];

export function OrganizationSidebar({
  organization,
}: OrganizationSidebarProps) {
  const params = useParams({ strict: false });
  const organizationId =
    typeof params.organizationId === 'string' ? params.organizationId : null;
  const [isSigningOut, setIsSigningOut] = useState(false);
  const organizationDescription = organization?.description.trim().length
    ? organization.description
    : 'Organization overview';

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
        <div className="flex items-start gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/35 px-3 py-3 shadow-sm group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground group-data-[collapsible=icon]:size-9">
            <Building2Icon className="size-4 group-data-[collapsible=icon]:size-3.5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.68rem] font-medium uppercase tracking-wide text-sidebar-foreground/60">
              Organization
            </p>
            <p className="truncate text-sm font-semibold leading-5">
              {organization?.name ?? 'Syncpad'}
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
                {organizationNavItems.map((item) => (
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

        {organizationId ? (
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {organizationManagementItems.map((item) => (
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
