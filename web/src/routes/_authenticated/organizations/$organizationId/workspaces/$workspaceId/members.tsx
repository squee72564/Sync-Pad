import { createFileRoute } from '@tanstack/react-router';
import {
  BriefcaseBusinessIcon,
  HashIcon,
  MailIcon,
  ShieldCheckIcon,
  UserIcon,
  UsersIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { EmptyStateCard } from '#/components/empty-state-card';
import { PageHeader, PageHeaderStat } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Badge } from '#/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { workspaceMembersQuery } from '#/features/workspaces/queries';
import type { WorkspaceMembershipDetailedDto } from '#/features/workspaces/types';
import { assertUuidParam } from '#/lib/route-params';
import { getInitials } from '#/lib/utils';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/workspaces/$workspaceId/members',
)({
  loader: ({ context, params }) => {
    assertUuidParam('Organization', params.organizationId);
    assertUuidParam('Workspace', params.workspaceId);

    return context.queryClient.ensureQueryData(
      workspaceMembersQuery(params.organizationId, params.workspaceId),
    );
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Workspace members not found"
      fallbackDescription="Unable to load workspace members."
    />
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { memberships } = Route.useLoaderData();
  const managerCount = memberships.filter(
    (membership) => membership.workspaceRole === 'manager',
  ).length;
  const editorCount = memberships.filter(
    (membership) => membership.workspaceRole === 'editor',
  ).length;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Members"
        title="Workspace members"
        description="Review every member returned by the workspace membership payload, including role, account, and scope identifiers."
      >
        <div className="grid grid-cols-3 gap-2 sm:min-w-80">
          <PageHeaderStat label="Total" value={memberships.length} />
          <PageHeaderStat label="Managers" value={managerCount} />
          <PageHeaderStat label="Editors" value={editorCount} />
        </div>
      </PageHeader>

      {memberships.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {memberships.map((membership) => (
            <MemberCard key={membership.userId} membership={membership} />
          ))}
        </div>
      ) : (
        <EmptyStateCard
          icon={UsersIcon}
          title="No members yet"
          description="Members added to this workspace will appear here with their role and membership payload details."
        />
      )}
    </div>
  );
}

function MemberCard({
  membership,
}: {
  membership: WorkspaceMembershipDetailedDto;
}) {
  return (
    <Card className="border-border/70 transition-colors hover:bg-muted/20">
      <CardHeader className="gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar size="lg" className="size-11 border border-border/70">
            <AvatarImage
              src={membership.userImage ?? undefined}
              alt={membership.userName}
            />
            <AvatarFallback className="text-sm font-semibold">
              {getInitials(membership.userName)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{membership.userName}</CardTitle>
            <CardDescription className="mt-0.5 flex min-w-0 items-center gap-1.5">
              <MailIcon className="size-3.5 shrink-0" />
              <span className="truncate">{membership.userEmail}</span>
            </CardDescription>
          </div>
        </div>

        <CardAction>
          <RoleBadge role={membership.workspaceRole} />
        </CardAction>
      </CardHeader>

      <CardContent className="grid gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
        <MemberMeta
          icon={UserIcon}
          label="User ID"
          value={membership.userId}
          mono
        />
        <MemberMeta
          icon={UserIcon}
          label="User image"
          value={membership.userImage ?? 'No image'}
          mono={Boolean(membership.userImage)}
        />
        <MemberMeta
          icon={BriefcaseBusinessIcon}
          label="Workspace ID"
          value={membership.workspaceId}
          mono
        />
        <MemberMeta
          icon={HashIcon}
          label="Organization ID"
          value={membership.organizationId}
          mono
        />
      </CardContent>
    </Card>
  );
}

function RoleBadge({
  role,
}: {
  role: WorkspaceMembershipDetailedDto['workspaceRole'];
}) {
  return (
    <Badge
      variant={role === 'manager' ? 'default' : 'outline'}
      className="gap-1"
    >
      <ShieldCheckIcon className="size-3" />
      {formatLabel(role)}
    </Badge>
  );
}

function MemberMeta({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <span
        className={
          mono
            ? 'truncate font-mono text-[11px] text-foreground'
            : 'truncate text-foreground'
        }
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
