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
import { Skeleton } from '#/components/ui/skeleton';
import { formatShortDate } from '#/lib/utils';

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

const workspaceCardSkeletonMetaRows = ['organization', 'created', 'role'];

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
          <div className="flex min-w-0 items-start gap-3">
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
            value={formatShortDate(workspace.createdAt)}
          />
          {workspace.workspaceRole ? (
            <div className="flex min-w-0 items-center justify-between gap-3">
              <span className="shrink-0">Role</span>
              <Badge variant="outline" className="min-w-0 max-w-[70%]">
                <span className="truncate">{workspace.workspaceRole}</span>
              </Badge>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
}

export function WorkspaceCardSkeleton() {
  return (
    <Card className="h-full border-border/70">
      <CardHeader className="gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Skeleton className="size-11 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-36" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
        <CardAction>
          <Skeleton className="size-8 rounded-md" />
        </CardAction>
      </CardHeader>

      <CardContent className="mt-auto grid gap-2 border-t border-border/70 pt-4">
        {workspaceCardSkeletonMetaRows.map((row) => (
          <div key={row} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 shrink-0" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
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
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex shrink-0 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <span className="min-w-0 truncate text-foreground">{value}</span>
    </div>
  );
}
