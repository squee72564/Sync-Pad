import { createFileRoute, Link } from '@tanstack/react-router';
import {
  CalendarClockIcon,
  HashIcon,
  PaletteIcon,
  SparklesIcon,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { PageHeader, PageHeaderStat } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { Avatar, AvatarFallback } from '#/components/ui/avatar';
import { Badge } from '#/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Separator } from '#/components/ui/separator';
import { workspaceQuery } from '#/features/workspaces/queries';
import { assertUuidParam } from '#/lib/route-params';
import { formatDate, getInitials } from '#/lib/utils';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/workspaces/$workspaceId/',
)({
  loader: ({ context, params }) => {
    assertUuidParam('Organization', params.organizationId);
    assertUuidParam('Workspace', params.workspaceId);

    return context.queryClient.ensureQueryData(
      workspaceQuery(params.organizationId, params.workspaceId),
    );
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Organization workspace not found"
      fallbackDescription="Unable to load organization workspace."
    />
  ),
  component: RouteComponent,
});

function RouteComponent() {
  const { workspace } = Route.useLoaderData();
  const accentColor = workspace.color;
  const initials = getInitials(workspace.name);

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(22rem,0.7fr)]">
        <PageHeader
          eyebrow="Workspace"
          title={workspace.name}
          description="Organized under a workspace-specific home for docs, timelines, and future content."
          leading={
            <Avatar size="lg" className="size-14 border border-border/70">
              <AvatarFallback
                className="text-base font-semibold text-white"
                style={{ backgroundColor: accentColor }}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
          }
        >
          <div className="grid min-w-40 grid-cols-1 gap-2">
            <PageHeaderStat label="Accent" value={workspace.color} />
          </div>
        </PageHeader>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Workspace snapshot</CardTitle>
            <CardDescription>
              Core data returned from the workspace endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              icon={HashIcon}
              label="Workspace ID"
              value={workspace.id}
              mono
            />
            <DetailRow
              icon={PaletteIcon}
              label="Accent color"
              value={workspace.color}
            />
            <DetailRow
              icon={CalendarClockIcon}
              label="Created at"
              value={formatDate(workspace.createdAt)}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>About this workspace</CardTitle>
            <CardDescription>
              A minimal overview for the workspace home page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow label="Name" value={workspace.name} />
            <Separator />
            <DetailRow
              label="Description"
              value={
                workspace.description.length > 0
                  ? workspace.description
                  : 'No description provided.'
              }
            />
            <Separator />
            <DetailRow
              label="Organization"
              value={workspace.organizationId}
              mono
            />
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Useful metadata for this workspace record.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              icon={SparklesIcon}
              label="Workspace vibe"
              value="Ready for docs, planning, and content surfaces."
            />
            <Separator />
            <DetailRow
              label="Last updated"
              value={formatDate(workspace.updatedAt)}
            />
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-card px-5 py-4 shadow-xs">
        <div className="space-y-1">
          <div className="text-sm font-medium">Next step</div>
          <div className="text-sm text-muted-foreground">
            Add workspace docs, a timeline, or settings from here.
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" asChild>
            <Link
              className="gap-1.5"
              to="/organizations/$organizationId/workspaces"
              params={{ organizationId: workspace.organizationId }}
            >
              Back to workspaces
            </Link>
          </Badge>
        </div>
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
  mono = false,
}: {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {Icon ? <Icon className="size-4 text-muted-foreground" /> : null}
        <span>{label}</span>
      </div>
      <div
        className={`max-w-full text-sm text-muted-foreground ${
          mono ? 'font-mono text-xs break-all sm:text-right' : 'sm:text-right'
        }`}
      >
        {value}
      </div>
    </div>
  );
}
