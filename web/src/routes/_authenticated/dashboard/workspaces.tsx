import { createFileRoute } from '@tanstack/react-router';
import { FolderKanbanIcon } from 'lucide-react';
import { EmptyStateCard } from '#/components/empty-state-card';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { SearchQueryInput } from '#/components/search-query-input';
import { WorkspaceCard } from '#/components/workspace-card';
import { meWorkspacesQuery } from '#/features/me/queries';
import {
  parseListQuerySearch,
  withListQuerySearch,
} from '#/lib/api/list-query';

export const Route = createFileRoute('/_authenticated/dashboard/workspaces')({
  validateSearch: parseListQuerySearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    return context.queryClient.fetchQuery(meWorkspacesQuery(deps));
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
  const { workspaces } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Workspaces"
        title="Workspaces"
        description="Workspaces you can access across your organizations."
      >
        <SearchQueryInput
          onSearchChange={(q) =>
            navigate({
              replace: true,
              search: (current) => withListQuerySearch(current, q),
            })
          }
          placeholder="Search workspaces..."
          value={search.q}
        />
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
          title="No workspaces found"
          description="Workspaces you create or join will appear here, grouped across your organizations."
        />
      )}
    </div>
  );
}
