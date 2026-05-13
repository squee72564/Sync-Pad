import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import {
  BanIcon,
  CalendarClockIcon,
  Clock3Icon,
  MailIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  Trash2Icon,
  UserRoundPlusIcon,
} from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { EmptyStateCard } from '#/components/empty-state-card';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { SearchQueryInput } from '#/components/search-query-input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog';
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
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field';
import { Input } from '#/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet';
import { ToggleGroup, ToggleGroupItem } from '#/components/ui/toggle-group';
import {
  createOrganizationInvite,
  revokeOrganizationInvite,
} from '#/features/invites/api';
import {
  inviteQueryKeys,
  organizationInvitesQuery,
} from '#/features/invites/queries';
import type {
  InvitableOrganizationRole,
  OrganizationInvite,
  OrganizationInviteSearch,
  OrganizationInviteStatus,
} from '#/features/invites/types';
import { assertUuidParam } from '#/lib/route-params';
import { cn, formatDate, formatShortDate } from '#/lib/utils';

const inviteStatuses = ['pending', 'declined', 'expired', 'revoked'] as const;
type InviteStatusFilter = (typeof inviteStatuses)[number];

const inviteRoles: Array<{
  value: InvitableOrganizationRole;
  label: string;
  description: string;
}> = [
  {
    value: 'admin',
    label: 'Admin',
    description: 'Can manage organization settings, members, and workspaces.',
  },
  {
    value: 'member',
    label: 'Member',
    description: 'Can collaborate across organization workspaces.',
  },
  {
    value: 'guest',
    label: 'Guest',
    description: 'Limited organization access for external collaborators.',
  },
];

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization/invite',
)({
  validateSearch: parseInviteSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) => {
    assertUuidParam('OrganizationInvites', params.organizationId);

    return context.queryClient.ensureQueryData(
      organizationInvitesQuery(params.organizationId, deps),
    );
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Organization invites not found"
      fallbackDescription="Unable to load organization invites."
    />
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { organizationId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [isInviteSheetOpen, setIsInviteSheetOpen] = useState(false);
  const invitesQuery = useQuery({
    ...organizationInvitesQuery(organizationId, search),
    initialData: loaderData,
  });
  const { organizationInvites, pageInfo } = invitesQuery.data;

  const createInviteMutation = useMutation({
    mutationFn: createOrganizationInvite,
    onSuccess: async ({ organizationInvite }) => {
      toast.success(`Invite sent to ${organizationInvite.email}`);
      setIsInviteSheetOpen(false);
      await queryClient.invalidateQueries({
        queryKey: inviteQueryKeys.byOrganizationRoot(organizationId),
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Unable to send invite.';
      toast.error(message);
    },
  });

  const revokeInviteMutation = useMutation({
    mutationFn: revokeOrganizationInvite,
    onSuccess: async ({ revokedOrganizationInvite }) => {
      toast.success(`Revoked invite for ${revokedOrganizationInvite.email}`);
      await queryClient.invalidateQueries({
        queryKey: inviteQueryKeys.byOrganizationRoot(organizationId),
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Unable to revoke invite.';
      toast.error(message);
    },
  });

  const updateStatus = (status: InviteStatusFilter) => {
    navigate({
      replace: true,
      search: (current) => ({
        ...current,
        status,
        cursor: undefined,
      }),
    });
  };

  const updateSearchQuery = (q: string) => {
    navigate({
      replace: true,
      search: (current) => ({
        ...current,
        q: toOptionalString(q),
        cursor: undefined,
      }),
    });
  };

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
        title="Organization invites"
        description="Invite collaborators and review outstanding organization invitations by status."
        actions={
          <InviteMemberSheet
            error={createInviteMutation.error}
            isOpen={isInviteSheetOpen}
            isPending={createInviteMutation.isPending}
            onOpenChange={(nextOpen) => {
              setIsInviteSheetOpen(nextOpen);
              if (!nextOpen) {
                createInviteMutation.reset();
              }
            }}
            onSubmit={(input) =>
              createInviteMutation.mutateAsync({ input, organizationId })
            }
          />
        }
      >
        <div className="flex w-full min-w-0 max-w-xl flex-col gap-3">
          <SearchQueryInput
            className="max-w-none"
            onSearchChange={updateSearchQuery}
            placeholder="Search invite emails..."
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

      {organizationInvites.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {organizationInvites.map((invite) => (
              <InviteCard
                key={invite.id}
                invite={invite}
                isRevoking={
                  revokeInviteMutation.isPending &&
                  revokeInviteMutation.variables?.invitationId === invite.id
                }
                onRevoke={() =>
                  revokeInviteMutation.mutateAsync({
                    invitationId: invite.id,
                    organizationId,
                  })
                }
              />
            ))}
          </div>

          {pageInfo.hasNextPage ? (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={goToNextPage}
                disabled={!pageInfo.nextCursor || invitesQuery.isFetching}
              >
                {invitesQuery.isFetching ? 'Loading invites...' : 'Next page'}
              </Button>
            </div>
          ) : null}
        </>
      ) : (
        <EmptyStateCard
          icon={MailIcon}
          title={getEmptyStateTitle(search)}
          description={getEmptyStateDescription(search)}
          action={
            search.status === 'pending' ? (
              <Button onClick={() => setIsInviteSheetOpen(true)}>
                <UserRoundPlusIcon />
                Invite member
              </Button>
            ) : null
          }
        />
      )}
    </div>
  );
}

function InviteMemberSheet({
  error,
  isOpen,
  isPending,
  onOpenChange,
  onSubmit,
}: {
  error: Error | null;
  isOpen: boolean;
  isPending: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (input: {
    email: string;
    organizationRole: InvitableOrganizationRole;
  }) => Promise<unknown>;
}) {
  const [email, setEmail] = useState('');
  const [organizationRole, setOrganizationRole] =
    useState<InvitableOrganizationRole>('member');
  const [localError, setLocalError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setOrganizationRole('member');
    setLocalError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !isPending) {
      resetForm();
    }

    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      setLocalError('Email is required.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLocalError('Enter a valid email address.');
      return;
    }

    setLocalError(null);
    await onSubmit({
      email: trimmedEmail,
      organizationRole,
    });
    resetForm();
  };

  const selectedRole = inviteRoles.find(
    (role) => role.value === organizationRole,
  );
  const errorMessage =
    localError ??
    (error instanceof Error && isOpen && !isPending ? error.message : null);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button>
          <UserRoundPlusIcon />
          Invite member
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Invite member</SheetTitle>
          <SheetDescription>
            Send an organization invitation by email and choose the role they
            will receive after accepting.
          </SheetDescription>
        </SheetHeader>

        <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="invite-email">Email</FieldLabel>
                <FieldContent>
                  <Input
                    id="invite-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="teammate@example.com"
                    autoComplete="email"
                    disabled={isPending}
                    aria-invalid={errorMessage ? true : undefined}
                    required
                  />
                  <FieldDescription>
                    The invitation link will be sent to this address.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                <FieldContent>
                  <Select
                    value={organizationRole}
                    onValueChange={(value) => {
                      if (isInvitableOrganizationRole(value)) {
                        setOrganizationRole(value);
                      }
                    }}
                    disabled={isPending}
                  >
                    <SelectTrigger id="invite-role" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {inviteRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRole ? (
                    <FieldDescription>
                      {selectedRole.description}
                    </FieldDescription>
                  ) : null}
                </FieldContent>
              </Field>

              <FieldError>{errorMessage}</FieldError>
            </FieldGroup>
          </div>

          <SheetFooter>
            <Button type="submit" disabled={isPending || !email.trim()}>
              {isPending ? 'Sending invite...' : 'Send invite'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function InviteCard({
  invite,
  isRevoking,
  onRevoke,
}: {
  invite: OrganizationInvite;
  isRevoking: boolean;
  onRevoke: () => Promise<unknown>;
}) {
  return (
    <Card className="border-border/70 transition-colors hover:bg-muted/20">
      <CardHeader className="gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/70">
            <MailIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{invite.email}</CardTitle>
            <CardDescription className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
              <InviteRoleBadge role={invite.organizationRole} />
              <InviteStatusBadge status={invite.status} />
            </CardDescription>
          </div>
        </div>

        {invite.status === 'pending' ? (
          <CardAction>
            <RevokeInviteDialog
              email={invite.email}
              isPending={isRevoking}
              onConfirm={onRevoke}
            />
          </CardAction>
        ) : null}
      </CardHeader>

      <CardContent className="grid gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
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

function RevokeInviteDialog({
  email,
  isPending,
  onConfirm,
}: {
  email: string;
  isPending: boolean;
  onConfirm: () => Promise<unknown>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = async () => {
    try {
      await onConfirm();
      setIsOpen(false);
    } catch {
      // Keep the confirmation open so the user can retry or cancel.
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="icon-sm"
          aria-label={`Revoke invite for ${email}`}
        >
          <Trash2Icon />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <BanIcon className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Revoke invite?</AlertDialogTitle>
          <AlertDialogDescription>
            This will invalidate the pending invitation for {email}. They will
            need a new invite to join this organization.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {isPending ? 'Revoking...' : 'Revoke invite'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function InviteRoleBadge({
  role,
}: {
  role: OrganizationInvite['organizationRole'];
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

function parseInviteSearch(
  search: Record<string, unknown>,
): OrganizationInviteSearch {
  return {
    q: toOptionalString(search.q),
    limit: toOptionalLimit(search.limit),
    cursor: toOptionalString(search.cursor),
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

function toOptionalLimit(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
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

function isInvitableOrganizationRole(
  value: string,
): value is InvitableOrganizationRole {
  return inviteRoles.some((role) => role.value === value);
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

function getEmptyStateTitle(search: OrganizationInviteSearch) {
  if (search.q) {
    return 'No invites found';
  }

  return `No ${formatLabel(search.status ?? 'pending').toLowerCase()} invites`;
}

function getEmptyStateDescription(search: OrganizationInviteSearch) {
  if (search.q) {
    return `No ${formatLabel(search.status ?? 'pending').toLowerCase()} invites match "${search.q}".`;
  }

  if (search.status === 'pending') {
    return 'Send an invite to add a collaborator to this organization.';
  }

  return `There are no ${formatLabel(search.status ?? 'pending').toLowerCase()} invites for this organization.`;
}

function formatLabel(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
