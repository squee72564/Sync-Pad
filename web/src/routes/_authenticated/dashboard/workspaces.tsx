import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { FolderKanbanIcon } from 'lucide-react';
import { Suspense, startTransition } from 'react';
import { EmptyStateCard } from '#/components/empty-state-card';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { SearchQueryInput } from '#/components/search-query-input';
import {
  WorkspaceCard,
  WorkspaceCardSkeleton,
} from '#/components/workspace-card';
import { meWorkspacesQuery } from '#/features/me/queries';
import {
  parseListQuerySearch,
  withListQuerySearch,
} from '#/lib/api/list-query';

const workspaceSkeletonCards = [
  'workspace-card-1',
  'workspace-card-2',
  'workspace-card-3',
];

export const Route = createFileRoute('/_authenticated/dashboard/workspaces')({
  validateSearch: parseListQuerySearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    context.queryClient.prefetchQuery(meWorkspacesQuery(deps));
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
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const handleSearchChange = (q: string) => {
    startTransition(() => {
      navigate({
        replace: true,
        search: (current) => withListQuerySearch(current, q),
      });
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Workspaces"
        title="Workspaces"
        description="Workspaces you can access across your organizations."
      >
        <SearchQueryInput
          onSearchChange={(q) => handleSearchChange(q)}
          placeholder="Search workspaces..."
          value={search.q}
        />
      </PageHeader>
      <Suspense fallback={<WorkspacesGridSkeleton />}>
        <WorkspacesContent />
      </Suspense>
    </div>
  );
}

function WorkspacesGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {workspaceSkeletonCards.map((card) => (
        <WorkspaceCardSkeleton key={card} />
      ))}
    </div>
  );
}

function WorkspacesContent() {
  const search = Route.useSearch();

  const { data } = useSuspenseQuery(meWorkspacesQuery(search));

  const { workspaces } = data;
  return (
    <>
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
    </>
  );
}
