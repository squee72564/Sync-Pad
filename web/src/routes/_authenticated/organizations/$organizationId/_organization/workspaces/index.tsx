import { createFileRoute } from '@tanstack/react-router';
import { FolderKanbanIcon } from 'lucide-react';
import { EmptyStateCard } from '#/components/empty-state-card';
import { PageHeader, PageHeaderStat } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { WorkspaceCard } from '#/components/workspace-card';
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
      <PageHeader
        eyebrow="Workspaces"
        title="Workspaces"
        description="Workspaces within your organization."
      >
        <div className="grid min-w-40 grid-cols-1 gap-2">
          <PageHeaderStat label="Total" value={workspaces.length} />
        </div>
      </PageHeader>

      {workspaces.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      ) : (
        <EmptyStateCard
          icon={FolderKanbanIcon}
          title="No workspaces yet"
          description="Create a workspace to start organizing docs, timelines, sheets, and project work for this organization."
        />
      )}
    </div>
  );
}
