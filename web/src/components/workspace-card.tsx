import { Link } from '@tanstack/react-router';
import { BriefcaseBusinessIcon } from 'lucide-react';
import { Badge } from '#/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';

type WorkspaceCardWorkspace = {
  id: string;
  organizationId: string;
  name: string;
  color: string;
  description: string;
  createdAt: string;
  organizationName?: string;
  workspaceRole?: string;
};

type WorkspaceCardProps = {
  workspace: WorkspaceCardWorkspace;
};

export function WorkspaceCard({ workspace }: WorkspaceCardProps) {
  return (
    <Link
      to="/organizations/$organizationId/workspaces/$workspaceId"
      params={{
        organizationId: workspace.organizationId,
        workspaceId: workspace.id,
      }}
    >
      <Card>
        <CardHeader>
          <div
            className="flex size-9 items-center justify-center rounded-md bg-muted"
            style={{ backgroundColor: workspace.color }}
          >
            <BriefcaseBusinessIcon className="size-4" />
          </div>
          <CardTitle>{workspace.name}</CardTitle>
          {workspace.organizationName ? (
            <CardDescription>{workspace.organizationName}</CardDescription>
          ) : null}
          {workspace.workspaceRole ? (
            <CardAction>
              <Badge variant="outline">{workspace.workspaceRole}</Badge>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-1 text-xs text-muted-foreground">
          <div>
            {workspace.description.length === 0
              ? 'No Description'
              : workspace.description}
          </div>
          <div>
            Created at: {new Date(workspace.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
