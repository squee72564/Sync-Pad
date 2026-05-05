import { createFileRoute, Link } from '@tanstack/react-router';
import { Building2Icon } from 'lucide-react';
import { PageHeader, PageHeaderStat } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { meOrganizationsQuery } from '#/features/me/queries';

export const Route = createFileRoute('/_authenticated/dashboard/organizations')(
  {
    loader: ({ context }) => {
      return context.queryClient.ensureQueryData(meOrganizationsQuery());
    },
    errorComponent: ({ error }) => (
      <ScopeRouteError
        error={error}
        fallbackTitle="Organizations not found"
        fallbackDescription="Unable to load organizations."
      />
    ),
    component: OrganizationsPage,
  },
);

function OrganizationsPage() {
  const { organizations } = Route.useLoaderData();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Organizations"
        title="Organizations"
        description="Organizations you belong to across Syncpad."
      >
        <div className="grid min-w-40 grid-cols-1 gap-2">
          <PageHeaderStat label="Total" value={organizations.length} />
        </div>
      </PageHeader>

      {organizations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((organization) => (
            <Link
              params={{ organizationId: organization.id }}
              to={`/organizations/$organizationId`}
              key={organization.id}
            >
              <Card>
                <CardHeader>
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <Building2Icon className="size-4" />
                  </div>
                  <CardTitle>{organization.name}</CardTitle>
                  <CardDescription>
                    {organization.description.length === 0
                      ? 'No Description'
                      : organization.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
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
