import { createFileRoute } from '@tanstack/react-router';
import {
  CheckCircle2Icon,
  Clock3Icon,
  MailIcon,
  ShieldCheckIcon,
  UsersIcon,
  XCircleIcon,
} from 'lucide-react';
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
import { organizationMembersQuery } from '#/features/organizations/queries';
import type { OrganizationMembersDetailedDto } from '#/features/organizations/types';
import { assertUuidParam } from '#/lib/route-params';
import { formatShortDate, getInitials } from '#/lib/utils';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization/members',
)({
  loader: ({ context, params }) => {
    assertUuidParam('OrganizationMemberships', params.organizationId);
    return context.queryClient.ensureQueryData(
      organizationMembersQuery(params.organizationId),
    );
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Organization members not found"
      fallbackDescription="Unable to load organization members."
    />
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { memberships } = Route.useLoaderData();
  const activeMemberCount = memberships.filter(
    (membership) => membership.status === 'active',
  ).length;
  const ownerCount = memberships.filter(
    (membership) => membership.organizationRole === 'owner',
  ).length;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Members"
        title="Organization Members"
        description="Review who has access to this organization and the role assigned to each account."
      >
        <div className="grid grid-cols-3 gap-2 sm:min-w-80">
          <PageHeaderStat label="Total" value={memberships.length} />
          <PageHeaderStat label="Active" value={activeMemberCount} />
          <PageHeaderStat label="Owners" value={ownerCount} />
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
          description="Members invited to this organization will appear here with their role and access status."
        />
      )}
    </div>
  );
}

function MemberCard({
  membership,
}: {
  membership: OrganizationMembersDetailedDto;
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
          <RoleBadge role={membership.organizationRole} />
        </CardAction>
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
        <StatusBadge status={membership.status} />
        <div className="text-xs text-muted-foreground">
          {membership.joinedAt
            ? `Joined ${formatShortDate(membership.joinedAt)}`
            : 'Not joined yet'}
        </div>
      </CardContent>
    </Card>
  );
}

function RoleBadge({
  role,
}: {
  role: OrganizationMembersDetailedDto['organizationRole'];
}) {
  return (
    <Badge variant={role === 'owner' ? 'default' : 'outline'} className="gap-1">
      <ShieldCheckIcon className="size-3" />
      {formatLabel(role)}
    </Badge>
  );
}

function StatusBadge({
  status,
}: {
  status: OrganizationMembersDetailedDto['status'];
}) {
  const Icon =
    status === 'active'
      ? CheckCircle2Icon
      : status === 'invited'
        ? Clock3Icon
        : XCircleIcon;
  const variant = status === 'active' ? 'secondary' : 'outline';

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="size-3" />
      {formatLabel(status)}
    </Badge>
  );
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
