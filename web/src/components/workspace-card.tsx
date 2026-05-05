import { Link } from '@tanstack/react-router';
import {
  ArrowRightIcon,
  BriefcaseBusinessIcon,
  Building2Icon,
  CalendarClockIcon,
} from 'lucide-react';
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
  const description =
    workspace.description.trim().length > 0
      ? workspace.description
      : 'No description provided.';

  return (
    <Link
      className="group block h-full"
      to="/organizations/$organizationId/workspaces/$workspaceId"
      params={{
        organizationId: workspace.organizationId,
        workspaceId: workspace.id,
      }}
    >
      <Card className="h-full border-border/70 transition-colors hover:bg-muted/25">
        <CardHeader className="gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white ring-1 ring-border/70"
              style={{ backgroundColor: workspace.color }}
            >
              <BriefcaseBusinessIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate">{workspace.name}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2 leading-5">
                {description}
              </CardDescription>
            </div>
          </div>
          <CardAction>
            <div className="flex size-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground">
              <ArrowRightIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>

        <CardContent className="mt-auto grid gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          {workspace.organizationName ? (
            <WorkspaceMeta
              icon={Building2Icon}
              label="Organization"
              value={workspace.organizationName}
            />
          ) : null}
          <WorkspaceMeta
            icon={CalendarClockIcon}
            label="Created"
            value={new Date(workspace.createdAt).toLocaleDateString()}
          />
          {workspace.workspaceRole ? (
            <div className="flex items-center justify-between gap-3">
              <span>Role</span>
              <Badge variant="outline">{workspace.workspaceRole}</Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

function WorkspaceMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2Icon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <span className="truncate text-foreground">{value}</span>
    </div>
  );
}
