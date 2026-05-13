import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  Building2Icon,
  Settings2Icon,
  Trash2Icon,
} from 'lucide-react';
import { type SubmitEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '#/components/page-header';
import { ScopeRouteError } from '#/components/scope-route-error';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field';
import { Input } from '#/components/ui/input';
import { Textarea } from '#/components/ui/textarea';
import { meQueryKeys } from '#/features/me/queries';
import {
  deleteOrganization,
  updateOrganization,
} from '#/features/organizations/api';
import {
  organizationQuery,
  organizationQueryKeys,
} from '#/features/organizations/queries';
import type { OrganizationResponse } from '#/features/organizations/types';
import { assertUuidParam } from '#/lib/route-params';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization/settings',
)({
  loader: async ({ context, params }) => {
    assertUuidParam('Organization', params.organizationId);

    const data = await context.queryClient.ensureQueryData(
      organizationQuery(params.organizationId),
    );

    if (!data.access.permissions.manage) {
      throw new Error(
        'You do not have permission to manage this organization.',
      );
    }

    return data;
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Organization settings unavailable"
      fallbackDescription="Unable to load organization settings."
    />
  ),
  component: OrganizationSettingsPage,
});

function OrganizationSettingsPage() {
  const { organizationId } = Route.useParams();
  const { access, organization } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentOrganization, setCurrentOrganization] = useState(organization);
  const [name, setName] = useState(currentOrganization.name);
  const [description, setDescription] = useState(
    currentOrganization.description,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentOrganization(organization);
    setName(organization.name);
    setDescription(organization.description);
  }, [organization]);

  const normalizedForm = useMemo(
    () => ({
      name: name.trim(),
      description: description.trim(),
    }),
    [description, name],
  );

  const hasChanges =
    normalizedForm.name !== currentOrganization.name ||
    normalizedForm.description !== currentOrganization.description;

  const updateOrganizationMutation = useMutation({
    mutationFn: updateOrganization,
    onMutate: () => {
      setFormError(null);
    },
    onSuccess: async (data) => {
      toast.success(`Updated ${data.organization.name}`);
      setCurrentOrganization(data.organization);
      setName(data.organization.name);
      setDescription(data.organization.description);
      queryClient.setQueryData<OrganizationResponse>(
        organizationQueryKeys.detail(organizationId),
        (current) => ({
          access: current?.access ?? access,
          organization: data.organization,
        }),
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.organizationLists(),
        }),
      ]);
      await router.invalidate();
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to update organization.';
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteOrganizationMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: async () => {
      toast.success(`Deleted ${currentOrganization.name}`);
      await navigate({ to: '/dashboard/organizations' });
      queryClient.removeQueries({
        exact: true,
        queryKey: organizationQueryKeys.detail(organizationId),
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.lists(),
        }),
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.organizationLists(),
        }),
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.workspaceLists(),
        }),
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to delete organization.';
      toast.error(message);
    },
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedForm.name) {
      setFormError('Organization name is required.');
      return;
    }

    if (normalizedForm.name.length > 200) {
      setFormError('Organization name must be 200 characters or less.');
      return;
    }

    if (normalizedForm.description.length > 512) {
      setFormError('Organization description must be 512 characters or less.');
      return;
    }

    if (!hasChanges) {
      return;
    }

    await updateOrganizationMutation.mutateAsync({
      input: normalizedForm,
      organizationId,
    });
  }

  async function handleDelete() {
    await deleteOrganizationMutation.mutateAsync(organizationId);
  }

  const canDelete = deleteConfirmation === currentOrganization.name;

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Settings"
        title="Organization settings"
        description="Manage organization details and destructive actions."
        actions={
          <Button variant="ghost" asChild>
            <Link
              to="/organizations/$organizationId"
              params={{ organizationId }}
            >
              <ArrowLeftIcon />
              Back to organization
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <Settings2Icon className="size-4" />
            </div>
            <CardTitle>Organization details</CardTitle>
            <CardDescription>
              Update the name and description shown throughout this
              organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex max-w-3xl flex-col gap-6"
              onSubmit={handleSubmit}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="organization-name">Name</FieldLabel>
                  <FieldContent>
                    <Input
                      id="organization-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      autoComplete="off"
                      maxLength={200}
                      aria-invalid={formError ? true : undefined}
                      disabled={updateOrganizationMutation.isPending}
                      required
                    />
                    <FieldDescription>
                      This name appears in navigation, lists, and organization
                      headers.
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor="organization-description">
                    Description
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="organization-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      maxLength={512}
                      aria-invalid={formError ? true : undefined}
                      disabled={updateOrganizationMutation.isPending}
                      rows={4}
                    />
                    <FieldDescription>
                      Keep this concise so it scans well in organization lists.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <FieldError>{formError}</FieldError>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={
                    updateOrganizationMutation.isPending ||
                    !normalizedForm.name ||
                    !hasChanges
                  }
                >
                  {updateOrganizationMutation.isPending
                    ? 'Saving changes...'
                    : 'Save changes'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  disabled={updateOrganizationMutation.isPending || !hasChanges}
                  onClick={() => {
                    setName(currentOrganization.name);
                    setDescription(currentOrganization.description);
                    setFormError(null);
                  }}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-destructive/35 bg-destructive/5">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-destructive/10 text-destructive">
              <Trash2Icon className="size-4" />
            </div>
            <CardTitle>Delete organization</CardTitle>
            <CardDescription>
              Permanently delete this organization, its workspaces, documents,
              members, and invites. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                setDeleteDialogOpen(open);
                if (!open) {
                  setDeleteConfirmation('');
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2Icon />
                  Delete organization
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <Building2Icon />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Delete this organization?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Type{' '}
                    <span className="font-medium text-foreground">
                      {currentOrganization.name}
                    </span>{' '}
                    to confirm permanent deletion.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <Field>
                  <FieldLabel htmlFor="delete-organization-confirmation">
                    Organization name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="delete-organization-confirmation"
                      value={deleteConfirmation}
                      onChange={(event) =>
                        setDeleteConfirmation(event.target.value)
                      }
                      disabled={deleteOrganizationMutation.isPending}
                      autoComplete="off"
                    />
                  </FieldContent>
                </Field>

                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={deleteOrganizationMutation.isPending}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={
                      deleteOrganizationMutation.isPending || !canDelete
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      void handleDelete();
                    }}
                  >
                    {deleteOrganizationMutation.isPending
                      ? 'Deleting...'
                      : 'Delete organization'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
