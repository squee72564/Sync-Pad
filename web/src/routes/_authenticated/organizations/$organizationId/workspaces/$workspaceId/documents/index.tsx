import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowRightIcon,
  CalendarClockIcon,
  Clock3Icon,
  FileTextIcon,
  HashIcon,
  PaletteIcon,
  Trash2Icon,
} from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { EmptyStateCard } from '#/components/empty-state-card';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { SearchQueryInput } from '#/components/search-query-input';
import { Badge } from '#/components/ui/badge';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { CreateDocumentSheet } from '#/features/documents/components/create-document-sheet';
import { workspacesDocumentQuery } from '#/features/documents/queries';
import type { Document } from '#/features/documents/types';
import {
  parseListQuerySearch,
  withListQuerySearch,
} from '#/lib/api/list-query';
import { assertUuidParam } from '#/lib/route-params';
import { formatDate, formatShortDate } from '#/lib/utils';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/workspaces/$workspaceId/documents/',
)({
  validateSearch: parseListQuerySearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, params, deps }) => {
    assertUuidParam('Organization', params.organizationId);
    assertUuidParam('Workspace', params.workspaceId);

    return context.queryClient.ensureQueryData(
      workspacesDocumentQuery(params.organizationId, params.workspaceId, deps),
    );
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Workspace documents not found"
      fallbackDescription="Unable to load workspace documents."
    />
  ),
  component: WorkspaceDocumentListPage,
});

function WorkspaceDocumentListPage() {
  const { documents, access } = Route.useLoaderData();
  const { organizationId, workspaceId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Documents"
        title="Workspace documents"
        description="Documents attached to this workspace, including their current metadata and visual identity."
        actions={
          access.permissions.write ? (
            <CreateDocumentSheet
              organizationId={organizationId}
              workspaceId={workspaceId}
            />
          ) : null
        }
      >
        <SearchQueryInput
          onSearchChange={(q) =>
            navigate({
              replace: true,
              search: (current) => withListQuerySearch(current, q),
            })
          }
          placeholder="Search documents..."
          value={search.q}
        />
      </PageHeader>

      {documents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      ) : (
        <EmptyStateCard
          icon={FileTextIcon}
          title="No documents found"
          description="Documents created in this workspace will appear here."
        />
      )}
    </div>
  );
}

function DocumentCard({ document }: { document: Document }) {
  const { organizationId } = Route.useParams();
  const deletedLabel = document.deletedAt
    ? formatDate(document.deletedAt)
    : 'Not deleted';

  return (
    <Link
      className="group block h-full"
      to="/organizations/$organizationId/workspaces/$workspaceId/documents/$documentId"
      params={{
        organizationId,
        workspaceId: document.workspaceId,
        documentId: document.id,
      }}
    >
      <Card
        className="h-full border-l-4 border-border/70 transition-colors hover:bg-muted/25"
        style={{ borderLeftColor: document.color }}
      >
        <CardHeader className="gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white ring-1 ring-border/70"
              style={{ backgroundColor: document.color }}
            >
              <FileTextIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate">{document.title}</CardTitle>
              <CardDescription className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="min-w-0 max-w-full font-mono"
                >
                  <span className="truncate">{document.id}</span>
                </Badge>
                {document.deletedAt ? (
                  <Badge variant="destructive">Deleted</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
              </CardDescription>
            </div>
          </div>

          <CardAction>
            <div className="flex size-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground transition-colors group-hover:border-foreground/20 group-hover:text-foreground">
              <ArrowRightIcon className="size-4" />
            </div>
          </CardAction>
        </CardHeader>

        <CardContent className="mt-auto grid gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <DocumentMeta icon={PaletteIcon} label="Color" value={document.color}>
            <span
              className="size-3 rounded-full ring-1 ring-border/70"
              style={{ backgroundColor: document.color }}
            />
          </DocumentMeta>
          <DocumentMeta
            icon={HashIcon}
            label="Workspace ID"
            value={document.workspaceId}
            mono
          />
          <DocumentMeta
            icon={CalendarClockIcon}
            label="Created"
            value={formatShortDate(document.createdAt)}
            title={formatDate(document.createdAt)}
          />
          <DocumentMeta
            icon={Clock3Icon}
            label="Updated"
            value={formatShortDate(document.updatedAt)}
            title={formatDate(document.updatedAt)}
          />
          <DocumentMeta
            icon={Trash2Icon}
            label="Deleted"
            value={deletedLabel}
            title={deletedLabel}
          />
        </CardContent>
      </Card>
    </Link>
  );
}

function DocumentMeta({
  icon: Icon,
  label,
  value,
  title,
  mono = false,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  title?: string;
  mono?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <div className="flex shrink-0 items-center gap-1.5">
        <Icon className="size-3.5 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="flex min-w-0 items-center gap-1.5">
        {children}
        <span
          className={
            mono
              ? 'truncate font-mono text-[11px] text-foreground'
              : 'truncate text-foreground'
          }
          title={title ?? value}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
