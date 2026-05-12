import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import {
  Building2Icon,
  CheckCircle2Icon,
  Clock3Icon,
  LogInIcon,
  MailIcon,
  ShieldCheckIcon,
  UserPlusIcon,
  XCircleIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import {
  acceptOrganizationInvite,
  declineOrganizationInvite,
} from '#/features/invites/api';
import {
  inviteQueryKeys,
  organizationInvitePreviewQuery,
} from '#/features/invites/queries';
import type {
  OrganizationInvitePreview,
  OrganizationInviteStatus,
} from '#/features/invites/types';
import { meQueryKeys } from '#/features/me/queries';
import { organizationQueryKeys } from '#/features/organizations/queries';
import { assertUuidParam } from '#/lib/route-params';
import { cn, formatDate, formatShortDate } from '#/lib/utils';

type InvitationSearch = {
  intent?: 'decline';
};

export const Route = createFileRoute('/invitations/$organizationId/$token')({
  validateSearch: (search: Record<string, unknown>): InvitationSearch => ({
    intent: search.intent === 'decline' ? 'decline' : undefined,
  }),
  loader: async ({ context, params }) => {
    assertUuidParam('OrganizationInvitation', params.organizationId);

    const [preview, session] = await Promise.all([
      context.queryClient.fetchQuery(
        organizationInvitePreviewQuery(params.organizationId, params.token),
      ),
      context.auth.getSession(),
    ]);

    return {
      preview,
      session: session.data,
    };
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Invitation not found"
      fallbackDescription="This invitation does not exist or is no longer available."
    />
  ),
  component: InvitationPage,
});

function InvitationPage() {
  const { organizationId, token } = Route.useParams();
  const { intent } = Route.useSearch();
  const { preview: loaderPreview, session } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const previewQuery = useQuery({
    ...organizationInvitePreviewQuery(organizationId, token),
    initialData: loaderPreview,
  });
  const invite = previewQuery.data.organizationInvitation;
  const redirect = `/invitations/${organizationId}/${token}`;
  const signedInEmail = session?.user.email ?? null;
  const isSignedInAsInviteRecipient =
    signedInEmail?.toLowerCase() === invite.email.toLowerCase();
  const canRespond = invite.status === 'pending' && !invite.isExpired;

  const acceptInviteMutation = useMutation({
    mutationFn: acceptOrganizationInvite,
    onSuccess: async () => {
      toast.success('Invitation accepted');
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: inviteQueryKeys.preview(organizationId, token),
        }),
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.invitationLists(),
        }),
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.organizationLists(),
        }),
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.workspaceLists(),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.detail(organizationId),
        }),
      ]);
      await navigate({
        to: '/organizations/$organizationId',
        params: { organizationId },
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Unable to accept invitation.';
      toast.error(message);
    },
  });

  const declineInviteMutation = useMutation({
    mutationFn: declineOrganizationInvite,
    onSuccess: async () => {
      toast.success('Invitation declined');
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: inviteQueryKeys.preview(organizationId, token),
        }),
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.invitationLists(),
        }),
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to decline invitation.';
      toast.error(message);
    },
  });

  const isMutating =
    acceptInviteMutation.isPending || declineInviteMutation.isPending;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8 md:px-6 md:py-12">
      <PageHeader
        eyebrow="Invitation"
        title="Review organization invitation"
        description="Accept or decline this Syncpad organization invitation."
      />

      <Card className="border-border/70">
        <CardHeader className="gap-4">
          <div className="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/70">
            <MailIcon className="size-5" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">
              Join {invite.organizationName} as{' '}
              {formatLabel(invite.organizationRole)}
            </CardTitle>
            <CardDescription>
              This invitation was sent to {invite.email}.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <InviteStatusBadge status={invite.status} />
            <InviteRoleBadge role={invite.organizationRole} />
          </div>
        </CardHeader>

        <CardContent className="grid gap-3 border-t border-border/70 pt-4 text-sm text-muted-foreground">
          <InviteDetail
            icon={Clock3Icon}
            label="Expires"
            value={formatShortDate(invite.expiresAt)}
            title={formatDate(invite.expiresAt)}
            muted={invite.isExpired}
          />
          <InviteDetail
            icon={Building2Icon}
            label="Organization"
            value={invite.organizationName}
          />
          {signedInEmail ? (
            <InviteDetail
              icon={LogInIcon}
              label="Signed in as"
              value={signedInEmail}
            />
          ) : null}
        </CardContent>

        <CardFooter className="flex-col items-stretch gap-3 border-t border-border/70 sm:flex-row sm:items-center">
          {renderInvitationActions({
            acceptInvite: () =>
              acceptInviteMutation.mutateAsync({ organizationId, token }),
            canRespond,
            declineInvite: () =>
              declineInviteMutation.mutateAsync({ organizationId, token }),
            invite,
            isMutating,
            isSignedIn: Boolean(session?.session),
            isSignedInAsInviteRecipient,
            redirect,
            showDeclineFirst: intent === 'decline',
            signedInEmail,
          })}
        </CardFooter>
      </Card>
    </main>
  );
}

function renderInvitationActions({
  acceptInvite,
  canRespond,
  declineInvite,
  invite,
  isMutating,
  isSignedIn,
  isSignedInAsInviteRecipient,
  redirect,
  showDeclineFirst,
  signedInEmail,
}: {
  acceptInvite: () => Promise<unknown>;
  canRespond: boolean;
  declineInvite: () => Promise<unknown>;
  invite: OrganizationInvitePreview;
  isMutating: boolean;
  isSignedIn: boolean;
  isSignedInAsInviteRecipient: boolean;
  redirect: string;
  showDeclineFirst: boolean;
  signedInEmail: string | null;
}) {
  if (!canRespond) {
    return (
      <p className="text-sm text-muted-foreground">
        This invitation is {formatLabel(invite.status).toLowerCase()} and can no
        longer be accepted or declined.
      </p>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <Button asChild>
          <Link to="/signin" search={{ redirect }}>
            <LogInIcon />
            Sign in to accept
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/signup" search={{ redirect }}>
            <UserPlusIcon />
            Create account
          </Link>
        </Button>
        <Button
          variant={showDeclineFirst ? 'destructive' : 'ghost'}
          onClick={() => declineInvite()}
          disabled={isMutating}
        >
          <XCircleIcon />
          {isMutating ? 'Declining...' : 'Decline invitation'}
        </Button>
      </>
    );
  }

  if (!isSignedInAsInviteRecipient) {
    return (
      <div className="grid gap-3">
        <p className="text-sm text-muted-foreground">
          This invite was sent to {invite.email}, but you are signed in as{' '}
          {signedInEmail}. Sign in with the invited email address to accept.
        </p>
        <Button variant="outline" asChild>
          <Link to="/signin" search={{ redirect }}>
            <LogInIcon />
            Sign in with another account
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button onClick={() => acceptInvite()} disabled={isMutating}>
        <CheckCircle2Icon />
        {isMutating ? 'Accepting...' : 'Accept invitation'}
      </Button>
      <Button
        variant={showDeclineFirst ? 'destructive' : 'outline'}
        onClick={() => declineInvite()}
        disabled={isMutating}
      >
        <XCircleIcon />
        {isMutating ? 'Declining...' : 'Decline invitation'}
      </Button>
    </>
  );
}

function InviteRoleBadge({
  role,
}: {
  role: OrganizationInvitePreview['organizationRole'];
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
      variant={status === 'pending' ? 'secondary' : 'outline'}
      className={cn(status !== 'pending' && 'text-muted-foreground')}
    >
      {formatLabel(status)}
    </Badge>
  );
}

function InviteDetail({
  icon: Icon,
  label,
  value,
  title,
  mono = false,
  muted = false,
}: {
  icon: typeof Clock3Icon;
  label: string;
  value: string;
  title?: string;
  mono?: boolean;
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
          mono && 'font-mono text-xs',
          muted && 'text-muted-foreground',
        )}
        title={title ?? value}
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
