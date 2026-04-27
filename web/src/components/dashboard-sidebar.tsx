import { Link } from '@tanstack/react-router';
import {
  BookOpenIcon,
  BotIcon,
  FolderKanbanIcon,
  HomeIcon,
  SearchIcon,
  Settings2Icon,
  SparklesIcon,
  UsersIcon,
} from 'lucide-react';
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '#/components/ui/sidebar';

type PrimaryNavItem = {
  title: string;
  to: '/dashboard';
  icon: typeof HomeIcon;
  badge?: string;
};

type SecondaryNavItem = {
  title: string;
  icon: typeof FolderKanbanIcon;
  badge?: string;
};

const primaryNavItems: PrimaryNavItem[] = [
  {
    title: 'Overview',
    to: '/dashboard',
    icon: HomeIcon,
  },
];

const workspaceAreas: SecondaryNavItem[] = [
  {
    title: 'Projects',
    icon: FolderKanbanIcon,
  },
  {
    title: 'Documents',
    icon: BookOpenIcon,
  },
  {
    title: 'Knowledge',
    icon: SearchIcon,
  },
  {
    title: 'AI Workflows',
    icon: BotIcon,
    badge: 'Soon',
  },
];

const administrationAreas: SecondaryNavItem[] = [
  {
    title: 'Members',
    icon: UsersIcon,
  },
  {
    title: 'Settings',
    icon: Settings2Icon,
  },
];

export function DashboardSidebar() {
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
                  {item.badge ? (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace Model</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {workspaceAreas.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={item.title} disabled>
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                  {item.badge ? (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Admin</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {administrationAreas.map((item) => (
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
        <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/30 px-3 py-3 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
          <BotIcon className="hidden size-4 group-data-[collapsible=icon]:block group-data-[collapsible=icon]:size-3.5" />
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium">Connected workspace</p>
            <p className="mt-1 text-xs leading-5 text-sidebar-foreground/70">
              Shared navigation for projects, documents, knowledge, and AI.
            </p>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
