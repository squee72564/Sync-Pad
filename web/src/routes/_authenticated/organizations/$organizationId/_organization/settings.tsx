import { createFileRoute } from '@tanstack/react-router';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { organizationPermissionsQuery } from '#/features/organizations/queries';
import { assertUuidParam } from '#/lib/route-params';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization/settings',
)({
  loader: async ({ context, params }) => {
    assertUuidParam('OrganizationMemberships', params.organizationId);
    const { permissions } = await context.queryClient.ensureQueryData(
      organizationPermissionsQuery(params.organizationId),
    );

    if (!permissions.manage) {
      throw new Error(
        'You do not have permission to manage this organization.',
      );
    }
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Organization permissions not found"
      fallbackDescription="Unable to load organization permissions."
    />
  ),
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
