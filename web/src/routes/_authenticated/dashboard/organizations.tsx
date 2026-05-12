import { createFileRoute, Link } from '@tanstack/react-router';
import {
  ArrowRightIcon,
  Building2Icon,
  CalendarClockIcon,
  PlusCircleIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { EmptyStateCard } from '#/components/empty-state-card';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import { SearchQueryInput } from '#/components/search-query-input';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { meOrganizationsQuery } from '#/features/me/queries';
import type { MeOrganization } from '#/features/me/types';
import {
  parseListQuerySearch,
  withListQuerySearch,
} from '#/lib/api/list-query';
import { formatShortDate } from '#/lib/utils';

export const Route = createFileRoute('/_authenticated/dashboard/organizations')(
  {
    validateSearch: parseListQuerySearch,
    loaderDeps: ({ search }) => search,
    loader: ({ context, deps }) => {
      return context.queryClient.fetchQuery(meOrganizationsQuery(deps));
    },
    errorComponent: ({ error }) => (
      <ScopeRouteError
        error={error}
        fallbackTitle="Organizations not found"
        fallbackDescription="Unable to load organizations."
      />
    ),
    component: OrganizationsPage,
  },
);

function OrganizationsPage() {
  const { organizations } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Organizations"
        title="Organizations"
        description="Organizations you belong to across Syncpad."
      >
        <SearchQueryInput
          onSearchChange={(q) =>
            navigate({
              replace: true,
              search: (current) => withListQuerySearch(current, q),
            })
          }
          placeholder="Search organizations..."
          value={search.q}
        />
      </PageHeader>

      {organizations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((organization) => (
            <OrganizationCard
              key={organization.id}
              organization={organization}
            />
          ))}
        </div>
      ) : (
        <EmptyStateCard
          icon={Building2Icon}
          title="No organizations found"
          description="Create an organization to group workspaces, members, and team settings."
          action={
            <Button asChild>
              <Link to="/dashboard/organizations/new">
                <PlusCircleIcon />
                Create organization
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

function OrganizationCard({ organization }: { organization: MeOrganization }) {
  const description =
    organization.description.trim().length > 0
      ? organization.description
      : 'No description provided.';

  return (
    <Link
      className="group block h-full"
      params={{ organizationId: organization.id }}
      to="/organizations/$organizationId"
    >
      <Card className="h-full border-border/70 transition-colors hover:bg-muted/25">
        <CardHeader className="gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/70 transition-colors group-hover:bg-background">
              <Building2Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle>{organization.name}</CardTitle>
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
          <OrganizationMeta
            icon={CalendarClockIcon}
            label="Created"
            value={formatShortDate(organization.createdAt)}
          />
          <OrganizationMeta
            icon={RefreshCwIcon}
            label="Updated"
            value={formatShortDate(organization.updatedAt)}
          />
        </CardContent>
      </Card>
    </Link>
  );
}

function OrganizationMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClockIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
