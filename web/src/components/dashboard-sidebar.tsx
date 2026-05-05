import { Link } from '@tanstack/react-router';
import {
  BotIcon,
  Building2Icon,
  FolderKanbanIcon,
  HomeIcon,
  LogOutIcon,
  PlusCircleIcon,
  Settings2Icon,
  UserIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
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
import { authClient } from '#/lib/auth-client';
import { getInitials } from '#/lib/utils';

type PrimaryNavItem = {
  title: string;
  to:
    | '/dashboard'
    | '/dashboard/organizations'
    | '/dashboard/organizations/new'
    | '/dashboard/workspaces';
  icon: typeof HomeIcon;
};

type SidebarNavItem = {
  title: string;
  to: '/dashboard/profile' | '/dashboard/settings';
  icon: typeof UserIcon;
};

type DashboardSidebarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

type DashboardSidebarProps = {
  user?: DashboardSidebarUser;
};

const primaryNavItems: PrimaryNavItem[] = [
  {
    title: 'Dashboard',
    to: '/dashboard',
    icon: HomeIcon,
  },
];

const browseNavItems: PrimaryNavItem[] = [
  {
    title: 'Organizations',
    to: '/dashboard/organizations',
    icon: Building2Icon,
  },
  {
    title: 'Workspaces',
    to: '/dashboard/workspaces',
    icon: FolderKanbanIcon,
  },
];

const accountNavItems: SidebarNavItem[] = [
  {
    title: 'Profile',
    icon: UserIcon,
    to: '/dashboard/profile',
  },
  {
    title: 'Settings',
    icon: Settings2Icon,
    to: '/dashboard/settings',
  },
];

const createNavItems: PrimaryNavItem[] = [
  {
    title: 'New organization',
    to: '/dashboard/organizations/new',
    icon: PlusCircleIcon,
  },
];

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const userName = user?.name?.trim() || 'Syncpad';
  const userEmail = user?.email?.trim() || 'Dashboard';
  const initials = getInitials(userName);

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
          <Avatar
            size="lg"
            className="size-10 group-data-[collapsible=icon]:size-9"
          >
            <AvatarImage src={user?.image ?? undefined} alt={userName} />
            <AvatarFallback className="rounded-md bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.68rem] font-medium uppercase tracking-wide text-sidebar-foreground/60">
              Dashboard
            </p>
            <p className="truncate text-sm font-semibold leading-5">
              {userName}
            </p>
            <p className="truncate text-xs leading-4 text-sidebar-foreground/70">
              {userEmail}
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
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {browseNavItems.map((item) => (
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
          <SidebarGroupLabel>Create</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {createNavItems.map((item) => (
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
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNavItems.map((item) => (
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
