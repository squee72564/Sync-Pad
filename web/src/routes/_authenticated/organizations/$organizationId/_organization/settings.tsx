import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '#/components/page-header';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization/settings',
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Settings"
        title="Organization settings"
        description="Manage organization details, access, and preferences."
      />
    </div>
  );
}
