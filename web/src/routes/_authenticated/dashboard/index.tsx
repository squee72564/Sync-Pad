import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '#/components/page-header';
import { Badge } from '#/components/ui/badge';

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow={
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">Dashboard</Badge>
            <Badge variant="secondary">Early workspace shell</Badge>
          </div>
        }
        title="A shared operating layer for teams, documents, and AI."
        description="This dashboard is the protected entry point for the Syncpad workspace. It is the right place to centralize navigation, workspace context, and the core surfaces that tie planning, writing, knowledge, and AI together."
      />
    </div>
  );
}
