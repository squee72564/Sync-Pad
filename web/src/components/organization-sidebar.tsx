import { Link, useParams } from '@tanstack/react-router';
import {
  BotIcon,
  HomeIcon,
  LogOutIcon,
  SparklesIcon,
  type UserIcon,
  UsersIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '#/components/ui/badge';
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

type PrimaryNavItem = {
  title: string;
  to:
    | '/dashboard'
    | '/dashboard/organizations'
    | '/dashboard/organizations/new'
    | '/dashboard/workspaces';
  icon: typeof HomeIcon;
};

type OrganizationNavItem = {
  title: string;
  icon: typeof UserIcon;
  to:
    | '/organizations/$organizationId'
    | '/organizations/$organizationId/members';
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
    title: 'Members',
    icon: UsersIcon,
    to: '/organizations/$organizationId/members',
  },
];

export function OrganizationSidebar() {
  const params = useParams({ strict: false });
  const organizationId =
    typeof params.organizationId === 'string' ? params.organizationId : null;
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
            <SparklesIcon className="size-4 group-data-[collapsible=icon]:size-3.5" />
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold">Syncpad</p>
            <p className="text-xs text-sidebar-foreground/70">Team workspace</p>
          </div>
          <Badge
            variant="secondary"
            className="rounded-full px-2 py-0.5 group-data-[collapsible=icon]:hidden"
          >
            Alpha
          </Badge>
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
                    <Link to={item.to} activeProps={{ 'data-active': true }}>
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
            <SidebarGroupLabel>Current Organization</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {organizationNavItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link
                        to={item.to}
                        params={{ organizationId }}
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
