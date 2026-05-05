import { createFileRoute, Link } from '@tanstack/react-router';
import {
  BriefcaseBusinessIcon,
  CreditCardIcon,
  Settings2Icon,
  UsersIcon,
} from 'lucide-react';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { organizationQuery } from '#/features/organizations/queries';
import { assertUuidParam } from '#/lib/route-params';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization/',
)({
  loader: ({ context, params }) => {
    assertUuidParam('Organization', params.organizationId);

    return context.queryClient.ensureQueryData(
      organizationQuery(params.organizationId),
    );
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Organization not found"
      fallbackDescription="This organization does not exist or you do not have access to it."
    />
  ),
  component: OrganizationPage,
});

function OrganizationPage() {
  const { organization } = Route.useLoaderData();
  const description =
    organization.description.trim().length > 0
      ? organization.description
      : 'No description provided.';

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Organization"
        title={organization.name}
        description={description}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex size-9 items-center justify-center rounded-md bg-muted">
              <BriefcaseBusinessIcon className="size-4" />
            </div>
            <CardTitle>Organization details</CardTitle>
            <CardDescription>
              Basic metadata for this organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Created</span>
              <span>
                {new Date(organization.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-muted-foreground">Updated</span>
              <span>
                {new Date(organization.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Link
          to="/organizations/$organizationId/members"
          params={{ organizationId: organization.id }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <UsersIcon className="size-4" />
              </div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                View and manage organization membership.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link
          to="/organizations/$organizationId/workspaces"
          params={{ organizationId: organization.id }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <BriefcaseBusinessIcon className="size-4" />
              </div>
              <CardTitle>Workspaces</CardTitle>
              <CardDescription>
                Browse the workspaces owned by this organization.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link
          to="/organizations/$organizationId/settings"
          params={{ organizationId: organization.id }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <Settings2Icon className="size-4" />
              </div>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Update organization details and preferences.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link
          to="/organizations/$organizationId/billing"
          params={{ organizationId: organization.id }}
        >
          <Card className="h-full">
            <CardHeader>
              <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                <CreditCardIcon className="size-4" />
              </div>
              <CardTitle>Billing</CardTitle>
              <CardDescription>
                Review plan and payment information.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
