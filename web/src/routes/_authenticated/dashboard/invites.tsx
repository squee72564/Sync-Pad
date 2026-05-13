import { useMutation, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Building2Icon,
  CalendarClockIcon,
  CheckCircle2Icon,
  Clock3Icon,
  MailIcon,
  ShieldCheckIcon,
  UserRoundIcon,
  XCircleIcon,
} from 'lucide-react';
import { Suspense, startTransition } from 'react';
import { toast } from 'sonner';
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
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';
import { createMeInvitationLink } from '#/features/me/api';
import { meInvitationsQuery } from '#/features/me/queries';
import type {
  MeInvitationsSearch,
  MeOrganizationInvite,
  OrganizationInviteStatus,
} from '#/features/me/types';
import { parseListQuerySearch } from '#/lib/api/list-query';
import { cn, formatDate, formatShortDate } from '#/lib/utils';

const inviteStatuses = [
  'pending',
  'accepted',
  'declined',
  'expired',
  'revoked',
] as const satisfies readonly OrganizationInviteStatus[];
type InviteStatusFilter = OrganizationInviteStatus;

const inviteSkeletonCards = ['invite-card-1', 'invite-card-2', 'invite-card-3'];
const inviteSkeletonItem = ['invite-item-1', 'invite-item-2', 'invite-item-3'];

export const Route = createFileRoute('/_authenticated/dashboard/invites')({
  validateSearch: parseInviteSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    context.queryClient.prefetchQuery(meInvitationsQuery(deps));
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
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const updateStatus = (status: InviteStatusFilter) => {
    startTransition(() => {
      navigate({
        replace: true,
        search: (current) => ({
          ...current,
          status,
          cursor: undefined,
        }),
      });
    });
  };

  const updateSearchQuery = (q: string) => {
    startTransition(() => {
      navigate({
        replace: true,
        search: (current) => ({
          ...current,
          q: toOptionalString(q),
          cursor: undefined,
        }),
      });
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Invites"
        title="Invites"
        description="Organization invitations sent to your account email."
      >
        <div className="flex w-full flex-col gap-3 sm:min-w-[36rem]">
          <SearchQueryInput
            className="max-w-none"
            onSearchChange={updateSearchQuery}
            placeholder="Search invites..."
            value={search.q}
          />
          <ToggleGroup
            type="single"
            value={search.status}
            onValueChange={(value) => {
              if (isInviteStatusFilter(value)) {
                updateStatus(value);
              }
            }}
            variant="outline"
            size="sm"
            className="flex-wrap"
          >
            {inviteStatuses.map((status) => (
              <ToggleGroupItem key={status} value={status}>
                {formatLabel(status)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </PageHeader>
      <Suspense fallback={<InvitesGridSkeleton />}>
        <InvitesContent />
      </Suspense>
    </div>
  );
}

function InvitesContent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  const { data } = useSuspenseQuery(meInvitationsQuery(search));

  const { organizationInvites, pageInfo } = data;

  const goToNextPage = () => {
    if (!pageInfo.nextCursor) {
      return;
    }

    startTransition(() => {
      navigate({
        search: (current) => ({
          ...current,
          cursor: pageInfo.nextCursor ?? undefined,
        }),
      });
    });
  };

  return (
    <>
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
    </>
  );
}

function InvitesGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {inviteSkeletonCards.map((card) => (
        <Card key={card} className="border-border/70 overflow-hidden">
          <CardHeader className="gap-4">
            <div className="flex items-start gap-3">
              <div className="size-11 shrink-0 rounded-lg bg-muted animate-pulse" />

              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                <div className="flex gap-2">
                  <div className="h-5 w-20 rounded-md bg-muted animate-pulse" />
                  <div className="h-5 w-16 rounded-md bg-muted animate-pulse" />
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid gap-3 border-t border-border/70 pt-4">
            {inviteSkeletonItem.map((card) => (
              <div
                key={card}
                className="flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <div className="size-3.5 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                </div>

                <div className="h-3 w-28 rounded bg-muted animate-pulse" />
              </div>
            ))}

            <div className="mt-1 h-8 w-full rounded-md bg-muted animate-pulse" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function InviteCard({ invite }: { invite: MeOrganizationInvite }) {
  const navigate = useNavigate();
  const createInviteLinkMutation = useMutation({
    mutationFn: createMeInvitationLink,
    onSuccess: async ({ inviteUrl }) => {
      await navigate({ to: inviteUrl });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Unable to open invitation.';
      toast.error(message);
    },
  });

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
          value={invite.organizationName}
        />
        <InviteMeta
          icon={UserRoundIcon}
          label="Invited by"
          value={invite.invitedByEmail ?? 'Unknown sender'}
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
        <InviteStatusMeta invite={invite} />
        {invite.status === 'pending' ? (
          <Button
            variant="outline"
            size="sm"
            className="mt-1"
            disabled={createInviteLinkMutation.isPending}
            onClick={() => createInviteLinkMutation.mutateAsync(invite.id)}
          >
            {createInviteLinkMutation.isPending
              ? 'Opening invite...'
              : 'Open invite'}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InviteStatusMeta({ invite }: { invite: MeOrganizationInvite }) {
  if (invite.status === 'accepted' && invite.acceptedAt) {
    return (
      <InviteMeta
        icon={CheckCircle2Icon}
        label="Accepted"
        value={formatShortDate(invite.acceptedAt)}
        title={formatDate(invite.acceptedAt)}
      />
    );
  }

  if (invite.status === 'declined' && invite.declinedAt) {
    return (
      <InviteMeta
        icon={XCircleIcon}
        label="Declined"
        value={formatShortDate(invite.declinedAt)}
        title={formatDate(invite.declinedAt)}
      />
    );
  }

  if (invite.status === 'revoked' && invite.revokedAt) {
    return (
      <InviteMeta
        icon={XCircleIcon}
        label="Revoked"
        value={formatShortDate(invite.revokedAt)}
        title={formatDate(invite.revokedAt)}
      />
    );
  }

  return null;
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

function parseInviteSearch(
  search: Record<string, unknown>,
): MeInvitationsSearch {
  return {
    ...parseListQuerySearch(search),
    status: toInviteStatusFilter(search.status),
  };
}

function toOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function toInviteStatusFilter(value: unknown): InviteStatusFilter {
  return isInviteStatusFilter(value) ? value : 'pending';
}

function isInviteStatusFilter(value: unknown): value is InviteStatusFilter {
  return (
    typeof value === 'string' &&
    inviteStatuses.some((status) => status === value)
  );
}

function getEmptyStateTitle(search: MeInvitationsSearch) {
  if (search.q) {
    return 'No invites found';
  }

  return `No ${formatLabel(search.status ?? 'pending').toLowerCase()} invites`;
}

function getEmptyStateDescription(search: MeInvitationsSearch) {
  if (search.q) {
    return `No ${formatLabel(search.status ?? 'pending').toLowerCase()} invitations match "${search.q}".`;
  }

  if (search.status === 'pending') {
    return 'Organization invitations sent to your account email will appear here.';
  }

  return `There are no ${formatLabel(search.status ?? 'pending').toLowerCase()} invitations sent to your account email.`;
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
