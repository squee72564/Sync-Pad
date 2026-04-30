import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Building2Icon } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Skeleton } from '#/components/ui/skeleton';
import { meOrganizationsQuery } from '#/features/me/queries';

const organizationSkeletonIds = [
  'organization-skeleton-1',
  'organization-skeleton-2',
  'organization-skeleton-3',
];

export const Route = createFileRoute('/_authenticated/dashboard/organizations')(
  {
    component: OrganizationsPage,
  },
);

function OrganizationsPage() {
  const organizationsQuery = useQuery(meOrganizationsQuery());

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Organizations
        </h1>
        <p className="text-sm text-muted-foreground">
          Organizations you belong to across Syncpad.
        </p>
      </div>

      {organizationsQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizationSkeletonIds.map((skeletonId) => (
            <Skeleton key={skeletonId} className="h-32" />
          ))}
        </div>
      ) : null}

      {organizationsQuery.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load organizations</CardTitle>
            <CardDescription>
              {organizationsQuery.error.message}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {organizationsQuery.isSuccess ? (
        organizationsQuery.data.organizations.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {organizationsQuery.data.organizations.map((organization) => (
              <Card key={organization.id}>
                <CardHeader>
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <Building2Icon className="size-4" />
                  </div>
                  <CardTitle>{organization.name}</CardTitle>
                  <CardDescription>{organization.id}</CardDescription>
                </CardHeader>
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
        )
      ) : null}
    </div>
  );
}
