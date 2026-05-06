import { createFileRoute } from '@tanstack/react-router';
import { CalendarClockIcon, FileTextIcon, PaletteIcon } from 'lucide-react';
import type { ComponentType } from 'react';
import { PageHeader, PageHeaderStat } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { TiptapEditor } from '#/components/tiptap-editor';
import { Avatar, AvatarFallback } from '#/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Separator } from '#/components/ui/separator';
import { documentQuery } from '#/features/documents/queries';
import { assertUuidParam } from '#/lib/route-params';
import { formatDate, getInitials } from '#/lib/utils';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/workspaces/$workspaceId/documents/$documentId',
)({
  loader: ({ context, params }) => {
    assertUuidParam('Organization', params.organizationId);
    assertUuidParam('Workspace', params.workspaceId);
    assertUuidParam('Document', params.documentId);

    return context.queryClient.ensureQueryData(
      documentQuery(
        params.organizationId,
        params.workspaceId,
        params.documentId,
      ),
    );
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Document not found"
      fallbackDescription="Unable to load this document."
    />
  ),
  component: DocumentEditorPage,
});

function DocumentEditorPage() {
  const { document } = Route.useLoaderData();
  const initialContent = `<h1>${escapeHtml(document.title)}</h1><p>Start writing...</p>`;

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Document"
        title={document.title}
        description="A document editor surface for this workspace."
        leading={
          <Avatar size="lg" className="size-14 border border-border/70">
            <AvatarFallback
              className="text-base font-semibold text-white"
              style={{ backgroundColor: document.color }}
            >
              {getInitials(document.title)}
            </AvatarFallback>
          </Avatar>
        }
      >
        <div className="grid min-w-40 grid-cols-1 gap-2 sm:grid-cols-2">
          <PageHeaderStat label="Accent" value={document.color} />
          <PageHeaderStat
            label="Status"
            value={document.deletedAt ? 'Deleted' : 'Active'}
          />
        </div>
      </PageHeader>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <TiptapEditor
          autofocus="end"
          content={initialContent}
          editorClassName="min-h-[32rem]"
        />

        <Card className="border-border/70">
          <CardHeader>
            <div
              className="flex size-10 items-center justify-center rounded-md text-white"
              style={{ backgroundColor: document.color }}
            >
              <FileTextIcon className="size-4" />
            </div>
            <CardTitle>Document details</CardTitle>
            <CardDescription>
              Core metadata returned from the document endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailRow
              icon={PaletteIcon}
              label="Color"
              value={document.color}
            />
            <Separator />
            <DetailRow
              icon={CalendarClockIcon}
              label="Created"
              value={formatDate(document.createdAt)}
            />
            <Separator />
            <DetailRow
              icon={CalendarClockIcon}
              label="Updated"
              value={formatDate(document.updatedAt)}
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="size-4 text-muted-foreground" />
        <span>{label}</span>
      </div>
      <div className="max-w-full text-sm text-muted-foreground sm:text-right">
        {value}
      </div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
