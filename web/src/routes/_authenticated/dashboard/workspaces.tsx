import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { BriefcaseBusinessIcon } from 'lucide-react';

import { Badge } from '#/components/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Skeleton } from '#/components/ui/skeleton';
import { meWorkspacesQuery } from '#/features/me/queries';

const workspaceSkeletonIds = [
  'workspace-skeleton-1',
  'workspace-skeleton-2',
  'workspace-skeleton-3',
];

export const Route = createFileRoute('/_authenticated/dashboard/workspaces')({
  component: WorkspacesPage,
});

function WorkspacesPage() {
  const workspacesQuery = useQuery(meWorkspacesQuery());

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Workspaces
        </h1>
        <p className="text-sm text-muted-foreground">
          Workspaces you can access across your organizations.
        </p>
      </div>

      {workspacesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaceSkeletonIds.map((skeletonId) => (
            <Skeleton key={skeletonId} className="h-36" />
          ))}
        </div>
      ) : null}

      {workspacesQuery.isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Unable to load workspaces</CardTitle>
            <CardDescription>{workspacesQuery.error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {workspacesQuery.isSuccess ? (
        workspacesQuery.data.workspaces.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {workspacesQuery.data.workspaces.map((workspace) => (
              <Card key={workspace.id}>
                <CardHeader>
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <BriefcaseBusinessIcon className="size-4" />
                  </div>
                  <CardTitle>{workspace.name}</CardTitle>
                  <CardDescription>
                    {workspace.organizationName}
                  </CardDescription>
                  <CardAction>
                    <Badge variant="outline">{workspace.workspaceRole}</Badge>
                  </CardAction>
                </CardHeader>
                <div className="px-6 text-xs text-muted-foreground">
                  {workspace.organizationId} / {workspace.id}
                </div>
              </Card>
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
        )
      ) : null}
    </div>
  );
}
