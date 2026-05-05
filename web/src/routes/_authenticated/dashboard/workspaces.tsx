import { createFileRoute } from '@tanstack/react-router';
import { PageHeader, PageHeaderStat } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { WorkspaceCard } from '#/components/workspace-card';
import { meWorkspacesQuery } from '#/features/me/queries';

export const Route = createFileRoute('/_authenticated/dashboard/workspaces')({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(meWorkspacesQuery());
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
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Workspaces"
        title="Workspaces"
        description="Workspaces you can access across your organizations."
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
