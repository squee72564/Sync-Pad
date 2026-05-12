import { createFileRoute } from '@tanstack/react-router';
import {
  Building2Icon,
  CalendarClockIcon,
  Clock3Icon,
  MailIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { EmptyStateCard } from '#/components/empty-state-card';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { SearchQueryInput } from '#/components/search-query-input';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { meInvitationsQuery } from '#/features/me/queries';
import type {
  MeInvitationsSearch,
  MeOrganizationInvite,
  OrganizationInviteStatus,
} from '#/features/me/types';
import {
  parseListQuerySearch,
  withListQuerySearch,
} from '#/lib/api/list-query';
import { cn, formatDate, formatShortDate } from '#/lib/utils';

export const Route = createFileRoute('/_authenticated/dashboard/invites')({
  validateSearch: parseListQuerySearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    return context.queryClient.ensureQueryData(meInvitationsQuery(deps));
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Invites not found"
      fallbackDescription="Unable to load your invitations."
    />
  ),
  component: InvitesPage,
});

function InvitesPage() {
  const { organizationInvites, pageInfo } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const goToNextPage = () => {
    if (!pageInfo.nextCursor) {
      return;
    }

    navigate({
      search: (current) => ({
        ...current,
        cursor: pageInfo.nextCursor ?? undefined,
      }),
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Invites"
        title="Invites"
        description="Organization invitations sent to your account email."
      >
        <SearchQueryInput
          onSearchChange={(q) =>
            navigate({
              replace: true,
              search: (current) => withListQuerySearch(current, q),
            })
          }
          placeholder="Search invites..."
          value={search.q}
        />
      </PageHeader>

      {organizationInvites.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {organizationInvites.map((invite) => (
              <InviteCard key={invite.id} invite={invite} />
            ))}
          </div>

          {pageInfo.hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={goToNextPage}
                disabled={!pageInfo.nextCursor}
              >
                Next page
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyStateCard
          icon={MailIcon}
          title={getEmptyStateTitle(search)}
          description={getEmptyStateDescription(search)}
        />
      )}
    </div>
  );
}

function InviteCard({ invite }: { invite: MeOrganizationInvite }) {
  return (
    <Card className="border-border/70 transition-colors hover:bg-muted/20">
      <CardHeader className="gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/70">
            <MailIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">
              Join as {formatLabel(invite.organizationRole)}
            </CardTitle>
            <CardDescription className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
              <InviteRoleBadge role={invite.organizationRole} />
              <InviteStatusBadge status={invite.status} />
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
        <InviteMeta
          icon={Building2Icon}
          label="Organization"
          value={invite.organizationId}
        />
        <InviteMeta
          icon={CalendarClockIcon}
          label="Expires"
          value={formatShortDate(invite.expiresAt)}
          title={formatDate(invite.expiresAt)}
          muted={invite.isExpired}
        />
        <InviteMeta
          icon={Clock3Icon}
          label="Last sent"
          value={
            invite.lastSentAt ? formatShortDate(invite.lastSentAt) : 'Not sent'
          }
          title={invite.lastSentAt ? formatDate(invite.lastSentAt) : undefined}
        />
        <InviteMeta
          icon={RotateCcwIcon}
          label="Created"
          value={formatShortDate(invite.createdAt)}
          title={formatDate(invite.createdAt)}
        />
      </CardContent>
    </Card>
  );
}

function InviteRoleBadge({
  role,
}: {
  role: MeOrganizationInvite['organizationRole'];
}) {
  return (
    <Badge variant={role === 'admin' ? 'default' : 'outline'} className="gap-1">
      <ShieldCheckIcon className="size-3" />
      {formatLabel(role)}
    </Badge>
  );
}

function InviteStatusBadge({ status }: { status: OrganizationInviteStatus }) {
  return (
    <Badge
      variant={getStatusBadgeVariant(status)}
      className={cn('gap-1', status === 'revoked' && 'text-destructive')}
    >
      {formatLabel(status)}
    </Badge>
  );
}

function InviteMeta({
  icon: Icon,
  label,
  value,
  title,
  muted = false,
}: {
  icon: typeof CalendarClockIcon;
  label: string;
  value: string;
  title?: string;
  muted?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex shrink-0 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <span
        className={cn(
          'truncate text-foreground',
          muted && 'text-muted-foreground',
        )}
        title={title ?? value}
      >
        {value}
      </span>
    </div>
  );
}

function getStatusBadgeVariant(status: OrganizationInviteStatus) {
  if (status === 'pending') {
    return 'secondary';
  }

  if (status === 'expired') {
    return 'destructive';
  }

  return 'outline';
}

function getEmptyStateTitle(search: MeInvitationsSearch) {
  return search.q ? 'No invites found' : 'No invites';
}

function getEmptyStateDescription(search: MeInvitationsSearch) {
  if (search.q) {
    return `No invitations match "${search.q}".`;
  }

  return 'Organization invitations sent to your account email will appear here.';
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
