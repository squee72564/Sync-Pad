import { createFileRoute, Link } from '@tanstack/react-router';
import { Badge, BriefcaseBusinessIcon } from 'lucide-react';
import { ScopeRouteError } from '#/components/scope-route-error';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { organizationWorkspacesQuery } from '#/features/workspaces/queries';
import { assertUuidParam } from '#/lib/route-params';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization/workspaces/',
)({
  loader: ({ context, params }) => {
    assertUuidParam('Organization', params.organizationId);

    return context.queryClient.ensureQueryData(
      organizationWorkspacesQuery(params.organizationId),
    );
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Workspaces members not found"
      fallbackDescription="Unable to load workspaces."
    />
  ),
  component: OrganizationWorkspaceListPage,
});

function OrganizationWorkspaceListPage() {
  const { workspaces } = Route.useLoaderData();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Workspaces
        </h1>
        <p className="text-sm text-muted-foreground">
          Workspaces within your organization.
        </p>
      </div>

      {workspaces.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              to="/organizations/$organizationId/workspaces/$workspaceId"
              params={{
                organizationId: workspace.organizationId,
                workspaceId: workspace.id,
              }}
            >
              <Card>
                <CardHeader>
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <BriefcaseBusinessIcon className="size-4" />
                  </div>
                  <CardTitle>{workspace.name}</CardTitle>
                  <CardAction>
                    <Badge>{}</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-muted-foreground">
                    Created at:{' '}
                    {new Date(workspace.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No workspaces yet</CardTitle>
            <CardDescription>
              Workspaces you create or join will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
