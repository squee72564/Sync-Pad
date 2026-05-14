import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useLoaderData } from '@tanstack/react-router';
import {
  CheckCircle2Icon,
  MailIcon,
  ShieldCheckIcon,
  UsersIcon,
  XCircleIcon,
} from 'lucide-react';
import { Suspense } from 'react';
import { EmptyStateCard } from '#/components/empty-state-card';
import { PageHeader, PageHeaderStat } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Skeleton } from '#/components/ui/skeleton';
import { organizationMembersQuery } from '#/features/organizations/queries';
import type { OrganizationMembersDetailedDto } from '#/features/organizations/types';
import { assertUuidParam } from '#/lib/route-params';
import { formatShortDate, getInitials } from '#/lib/utils';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization/members',
)({
  loader: ({ context, params }) => {
    assertUuidParam('OrganizationMemberships', params.organizationId);
    context.queryClient.prefetchQuery(
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
  const access = useLoaderData({
    from: '/_authenticated/organizations/$organizationId/_organization',
    select: (data) => data.access,
  });
  const { organizationId } = Route.useParams();
  const navigate = Route.useNavigate();

  const navigateToInvitePage = async () => {
    navigate({
      to: '/organizations/$organizationId/invite',
      params: {
        organizationId,
      },
      search: {
        status: 'pending',
        cursor: undefined,
      },
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Members"
        title="Organization Members"
        description="Review who has access to this organization and the role assigned to each account."
        actions={
          access.permissions.invite ? (
            <Button onClick={navigateToInvitePage}>
              Manage Member Invites
            </Button>
          ) : null
        }
      >
        <Suspense fallback={<MembersHeaderStatsSkeleton />}>
          <MembersHeaderStats />
        </Suspense>
      </PageHeader>

      <Suspense fallback={<MembersGridSkeleton />}>
        <MembersContent />
      </Suspense>
    </div>
  );
}

function MembersHeaderStats() {
  const { organizationId } = Route.useParams();
  const { data } = useSuspenseQuery(organizationMembersQuery(organizationId));

  return (
    <div className="grid grid-rows-2 items-center gap-2 sm:min-w-80">
      <PageHeaderStat label="Total" value={data.memberships.length} />
    </div>
  );
}

function MembersHeaderStatsSkeleton() {
  return (
    <div className="grid grid-rows-2 items-center gap-2 sm:min-w-80">
      <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
        <Skeleton className="h-5 w-10" />
        <Skeleton className="mt-1 h-3 w-12" />
      </div>
    </div>
  );
}

function MembersContent() {
  const { organizationId } = Route.useParams();
  const { data } = useSuspenseQuery(organizationMembersQuery(organizationId));
  const { memberships } = data;

  return memberships.length > 0 ? (
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
  );
}

const memberSkeletonCards = [
  'organization-member-1',
  'organization-member-2',
  'organization-member-3',
];

function MembersGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {memberSkeletonCards.map((card) => (
        <MemberCardSkeleton key={card} />
      ))}
    </div>
  );
}

function MemberCardSkeleton() {
  return (
    <Card className="border-border/70">
      <CardHeader className="gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />

          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 shrink-0" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
        </div>

        <CardAction>
          <Skeleton className="h-6 w-20" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
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
  const Icon = status === 'active' ? CheckCircle2Icon : XCircleIcon;
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
