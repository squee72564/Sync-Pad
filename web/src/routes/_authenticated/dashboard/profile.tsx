import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { Avatar, AvatarFallback, AvatarImage } from '#/components/ui/avatar';
import { Badge } from '#/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Separator } from '#/components/ui/separator';
import { meUserQuery } from '#/features/me/queries';
import { formatDate, getInitials } from '#/lib/utils';

export const Route = createFileRoute('/_authenticated/dashboard/profile')({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(meUserQuery());
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Profile unavailable"
      fallbackDescription="Unable to load the signed-in user's profile."
    />
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useLoaderData();
  const initials = getInitials(user.name);

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.7fr)]">
        <PageHeader
          eyebrow="Profile"
          title={user.name}
          description={`Signed in as ${user.email}`}
          leading={
            <Avatar size="lg" className="size-14 border border-border/70">
              <AvatarImage src={user.image ?? undefined} alt={user.name} />
              <AvatarFallback className="text-base font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={user.emailVerified ? 'default' : 'outline'}>
              {user.emailVerified ? 'Email verified' : 'Email unverified'}
            </Badge>
          </div>
        </PageHeader>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Account snapshot</CardTitle>
            <CardDescription>
              The current data returned from the authenticated user endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileRow label="Email" value={user.email} />
            <ProfileRow
              label="Email status"
              value={user.emailVerified ? 'Verified' : 'Pending verification'}
            />
            <ProfileRow label="Created at" value={formatDate(user.createdAt)} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Identity</CardTitle>
            <CardDescription>
              Basic account fields used throughout the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileRow label="Name" value={user.name} />
            <Separator />
            <ProfileRow label="Email" value={user.email} />
            <Separator />
            <ProfileRow
              label="Avatar"
              value={user.image ?? 'No profile image set'}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Timestamps</CardTitle>
            <CardDescription>
              When this account was created and last updated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ProfileRow label="Created at" value={formatDate(user.createdAt)} />
            <Separator />
            <ProfileRow label="Updated at" value={formatDate(user.updatedAt)} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function ProfileRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div
        className={`max-w-full text-sm text-muted-foreground ${
          mono ? 'font-mono text-xs break-all sm:text-right' : 'sm:text-right'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
