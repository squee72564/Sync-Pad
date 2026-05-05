import { createFileRoute } from '@tanstack/react-router';
import { ScopeRouteError } from '#/components/scope-route-error';
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
import { assertUuidParam } from '#/lib/route-params';

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

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Organization Members
        </h1>
        <p className="text-sm text-muted-foreground">
          Members within your organization
        </p>
      </div>

      {memberships.length > 0 ? (
        <div className="flex flex-col gap-3">
          {memberships.map((organizationMembership) => (
            <Card key={organizationMembership.userId}>
              <CardHeader>
                <CardAction>
                  <Badge>{organizationMembership.organizationRole}</Badge>
                </CardAction>
                <CardTitle>{organizationMembership.userName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col">
                  <span>{organizationMembership.userEmail}</span>
                  <span>{organizationMembership.status}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No organizations yet</CardTitle>
            <CardDescription>
              Organizations you create or join will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent />
        </Card>
      )}
    </div>
  );
}
