import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Badge } from '#/components/ui/badge';
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

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization/members',
)({
  component: RouteComponent,
});

const organizationMemberSkeletonIds = [
  'organization-skeleton-1',
  'organization-skeleton-2',
  'organization-skeleton-3',
];

function RouteComponent() {
  const { organizationId } = Route.useParams();
  const organizationMembershipsQuery = useQuery(
    organizationMembersQuery(organizationId),
  );

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

      {organizationMembershipsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizationMemberSkeletonIds.map((skeletonId) => (
            <Skeleton key={skeletonId} className="h-32" />
          ))}
        </div>
      ) : null}

      {organizationMembershipsQuery.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load organization members.</CardTitle>
            <CardDescription>
              {organizationMembershipsQuery.error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {organizationMembershipsQuery.isSuccess ? (
        organizationMembershipsQuery.data.memberships.length > 0 ? (
          <div className="">
            {organizationMembershipsQuery.data.memberships.map(
              (organizationMembership) => (
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
              ),
            )}
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
        )
      ) : null}
    </div>
  );
}
