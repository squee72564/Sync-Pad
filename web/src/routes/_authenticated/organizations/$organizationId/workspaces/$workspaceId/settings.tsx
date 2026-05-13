import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router';
import {
  ArrowLeftIcon,
  BriefcaseBusinessIcon,
  Settings2Icon,
  Trash2Icon,
} from 'lucide-react';
import { type SubmitEvent, useEffect, useMemo, useState } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';
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
import { deleteWorkspace, updateWorkspace } from '#/features/workspaces/api';
import {
  workspaceQuery,
  workspaceQueryKeys,
} from '#/features/workspaces/queries';
import { assertUuidParam } from '#/lib/route-params';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/workspaces/$workspaceId/settings',
)({
  loader: async ({ context, params }) => {
    assertUuidParam('Organization', params.organizationId);
    assertUuidParam('Workspace', params.workspaceId);

    const data = await context.queryClient.ensureQueryData(
      workspaceQuery(params.organizationId, params.workspaceId),
    );

    if (!data.access.permissions.manage) {
      throw new Error('You do not have permission to manage this workspace.');
    }

    return data;
  },
  errorComponent: ({ error }) => (
    <ScopeRouteError
      error={error}
      fallbackTitle="Workspace settings unavailable"
      fallbackDescription="Unable to load workspace settings."
    />
  ),
  component: WorkspaceSettingsPage,
});

function WorkspaceSettingsPage() {
  const { organizationId, workspaceId } = Route.useParams();
  const { workspace } = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentWorkspace, setCurrentWorkspace] = useState(workspace);
  const [name, setName] = useState(currentWorkspace.name);
  const [description, setDescription] = useState(currentWorkspace.description);
  const [color, setColor] = useState(currentWorkspace.color);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentWorkspace(workspace);
    setName(workspace.name);
    setDescription(workspace.description);
    setColor(workspace.color);
  }, [workspace]);

  const normalizedForm = useMemo(() => {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    let normalizedColor = color.trim().toUpperCase();

    if (/^#[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
      normalizedColor = `${normalizedColor}FF`;
    }

    return {
      name: trimmedName,
      description: trimmedDescription,
      color: normalizedColor,
    };
  }, [color, description, name]);

  const hasChanges =
    normalizedForm.name !== currentWorkspace.name ||
    normalizedForm.description !== currentWorkspace.description ||
    normalizedForm.color !== currentWorkspace.color;

  const updateWorkspaceMutation = useMutation({
    mutationFn: updateWorkspace,
    onMutate: () => {
      setFormError(null);
    },
    onSuccess: async (data) => {
      toast.success(`Updated ${data.workspace.name}`);
      setCurrentWorkspace(data.workspace);
      setName(data.workspace.name);
      setDescription(data.workspace.description);
      setColor(data.workspace.color);
      queryClient.setQueryData(
        workspaceQueryKeys.detail(organizationId, workspaceId),
        data,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.byOrganizationRoot(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.workspaceLists(),
        }),
      ]);
      await router.invalidate();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Unable to update workspace.';
      setFormError(message);
      toast.error(message);
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: deleteWorkspace,
    onSuccess: async () => {
      toast.success(`Deleted ${currentWorkspace.name}`);
      await navigate({
        to: '/organizations/$organizationId/workspaces',
        params: { organizationId },
      });
      queryClient.removeQueries({
        exact: true,
        queryKey: workspaceQueryKeys.detail(organizationId, workspaceId),
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.byOrganizationRoot(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.workspaceLists(),
        }),
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Unable to delete workspace.';
      toast.error(message);
    },
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!normalizedForm.name) {
      setFormError('Workspace name is required.');
      return;
    }

    if (normalizedForm.name.length > 200) {
      setFormError('Workspace name must be 200 characters or less.');
      return;
    }

    if (normalizedForm.description.length > 512) {
      setFormError('Workspace description must be 512 characters or less.');
      return;
    }

    if (!/^#[0-9A-F]{8}$/.test(normalizedForm.color)) {
      setFormError(`Invalid color: ${normalizedForm.color}`);
      return;
    }

    await updateWorkspaceMutation.mutateAsync({
      input: normalizedForm,
      organizationId,
      workspaceId,
    });
  }

  async function handleDelete() {
    await deleteWorkspaceMutation.mutateAsync({
      organizationId,
      workspaceId,
    });
  }

  const canDelete = deleteConfirmation === currentWorkspace.name;

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage workspace details and destructive actions."
        actions={
          <Button variant="ghost" asChild>
            <Link
              to="/organizations/$organizationId/workspaces/$workspaceId"
              params={{ organizationId, workspaceId }}
            >
              <ArrowLeftIcon />
              Back to workspace
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
            <CardTitle>Workspace details</CardTitle>
            <CardDescription>
              Update the name, description, and accent color shown throughout
              this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <div className="mx-auto grid w-full max-w-6xl gap-8 xl:grid-cols-[minmax(28rem,2fr)_minmax(20rem,1fr)]">
                <FieldGroup className="max-w-3xl">
                  <Field>
                    <FieldLabel htmlFor="workspace-name">Name</FieldLabel>
                    <FieldContent>
                      <Input
                        id="workspace-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        autoComplete="off"
                        maxLength={200}
                        aria-invalid={formError ? true : undefined}
                        disabled={updateWorkspaceMutation.isPending}
                        required
                      />
                      <FieldDescription>
                        This name appears in navigation, lists, and workspace
                        headers.
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="workspace-description">
                      Description
                    </FieldLabel>
                    <FieldContent>
                      <Textarea
                        id="workspace-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        maxLength={512}
                        aria-invalid={formError ? true : undefined}
                        disabled={updateWorkspaceMutation.isPending}
                        rows={4}
                      />
                      <FieldDescription>
                        Keep this concise so it scans well in workspace lists.
                      </FieldDescription>
                    </FieldContent>
                  </Field>
                </FieldGroup>

                <Field className="max-w-md">
                  <FieldLabel htmlFor="workspace-color">Color</FieldLabel>
                  <FieldContent>
                    <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
                      <div className="mb-4 flex items-center gap-3">
                        <div
                          className="flex size-12 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                          style={{ backgroundColor: normalizedForm.color }}
                        >
                          <BriefcaseBusinessIcon className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {normalizedForm.name || 'Workspace preview'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Accent {normalizedForm.color}
                          </div>
                        </div>
                      </div>
                      <HexAlphaColorPicker
                        id="workspace-color"
                        className="w-full"
                        color={color}
                        onChange={(event) => setColor(event)}
                      />
                    </div>
                    <FieldDescription>
                      Pick the accent color used in workspace navigation and
                      cards.
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </div>

              <FieldError>{formError}</FieldError>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={
                    updateWorkspaceMutation.isPending ||
                    !normalizedForm.name ||
                    !hasChanges
                  }
                >
                  {updateWorkspaceMutation.isPending
                    ? 'Saving changes...'
                    : 'Save changes'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  disabled={updateWorkspaceMutation.isPending || !hasChanges}
                  onClick={() => {
                    setName(currentWorkspace.name);
                    setDescription(currentWorkspace.description);
                    setColor(currentWorkspace.color);
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
            <CardTitle>Delete workspace</CardTitle>
            <CardDescription>
              Permanently delete this workspace and its workspace-scoped data.
              This action cannot be undone.
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
                  Delete workspace
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogMedia>
                    <Trash2Icon />
                  </AlertDialogMedia>
                  <AlertDialogTitle>Delete this workspace?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Type{' '}
                    <span className="font-medium text-foreground">
                      {currentWorkspace.name}
                    </span>{' '}
                    to confirm permanent deletion.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <Field>
                  <FieldLabel htmlFor="delete-workspace-confirmation">
                    Workspace name
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="delete-workspace-confirmation"
                      value={deleteConfirmation}
                      onChange={(event) =>
                        setDeleteConfirmation(event.target.value)
                      }
                      disabled={deleteWorkspaceMutation.isPending}
                      autoComplete="off"
                    />
                  </FieldContent>
                </Field>

                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={deleteWorkspaceMutation.isPending}
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    disabled={deleteWorkspaceMutation.isPending || !canDelete}
                    onClick={(event) => {
                      event.preventDefault();
                      void handleDelete();
                    }}
                  >
                    {deleteWorkspaceMutation.isPending
                      ? 'Deleting...'
                      : 'Delete workspace'}
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
