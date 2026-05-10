import { createFileRoute } from '@tanstack/react-router';
import { FolderKanbanIcon } from 'lucide-react';
import { EmptyStateCard } from '#/components/empty-state-card';
import { PageHeader, PageHeaderStat } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { WorkspaceCard } from '#/components/workspace-card';
import { meWorkspacesQuery } from '#/features/me/queries';
import { parseListQuerySearch } from '#/lib/api/list-query';

export const Route = createFileRoute('/_authenticated/dashboard/workspaces')({
  validateSearch: parseListQuerySearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    return context.queryClient.ensureQueryData(meWorkspacesQuery(deps));
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Workspaces not found"
      fallbackDescription="Unable to get workspaces."
    />
  ),
  component: WorkspacesPage,
});

function WorkspacesPage() {
  const { workspaces, pageInfo } = Route.useLoaderData();
  const search = Route.useSearch();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Workspaces"
        title="Workspaces"
        description="Workspaces you can access across your organizations."
      >
        <div className="grid min-w-40 grid-cols-1 gap-2 sm:grid-cols-2">
          <PageHeaderStat label="Shown" value={workspaces.length} />
          <PageHeaderStat label="Limit" value={pageInfo.limit} />
          {search.q ? <PageHeaderStat label="Search" value="On" /> : null}
          {pageInfo.hasNextPage ? (
            <PageHeaderStat label="More" value="Yes" />
          ) : null}
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
          description="Workspaces you create or join will appear here, grouped across your organizations."
        />
      )}
    </div>
  );
}
