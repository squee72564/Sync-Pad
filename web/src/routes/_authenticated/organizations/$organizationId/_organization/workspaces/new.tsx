import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, FolderPlusIcon } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';
import { toast } from 'sonner';
import { PageHeader } from '#/components/page-header';
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
import { meQueryKeys } from '#/features/me/queries';
import { createWorkspace } from '#/features/workspaces/api';
import { workspaceQueryKeys } from '#/features/workspaces/queries';

export const Route = createFileRoute(
  '/_authenticated/organizations/$organizationId/_organization/workspaces/new',
)({
  component: NewWorkspacePage,
});

function NewWorkspacePage() {
  const { organizationId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#808080FF');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createWorkspaceMutation = useMutation({
    mutationFn: createWorkspace,
    onMutate: () => {
      setErrorMessage(null);
    },
    onSuccess: async ({ workspace }) => {
      toast.success(`Created ${workspace.name}`);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: workspaceQueryKeys.byOrganization(organizationId),
        }),
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.workspaces(),
        }),
      ]);
      await navigate({
        to: '/organizations/$organizationId/workspaces/$workspaceId',
        params: {
          organizationId,
          workspaceId: workspace.id,
        },
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Unable to create workspace.';
      setErrorMessage(message);
      toast.error(message);
    },
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    let normalizedColor = color.trim().toUpperCase();

    if (!trimmedName) {
      setErrorMessage('Workspace name is required.');
      return;
    }

    if (/^#[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
      normalizedColor = `${normalizedColor}FF`;
    }

    if (!/^#[0-9A-Fa-f]{8}$/.test(normalizedColor)) {
      setErrorMessage(`Invalid Color: ${normalizedColor}`);
      return;
    }

    await createWorkspaceMutation.mutateAsync({
      input: {
        name: trimmedName,
        description: trimmedDescription,
        color: normalizedColor,
      },
      organizationId,
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        className="w-full"
        eyebrow="Create"
        title="Create workspace"
        description="Add a workspace to this organization for docs, timelines, sheets, and project-specific collaboration."
        actions={
          <Button variant="ghost" asChild>
            <Link
              to="/organizations/$organizationId/workspaces"
              params={{ organizationId }}
            >
              <ArrowLeftIcon />
              Back to workspaces
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <FolderPlusIcon className="size-4" />
            </div>
            <CardTitle>Workspace details</CardTitle>
            <CardDescription>
              Start with a clear name. You can add members, permissions, and
              workspace content after creation.
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
                        placeholder="Product roadmap"
                        autoComplete="off"
                        maxLength={200}
                        aria-invalid={errorMessage ? true : undefined}
                        disabled={createWorkspaceMutation.isPending}
                        required
                      />
                      <FieldDescription>
                        This is what organization members will see when browsing
                        workspaces.
                      </FieldDescription>
                    </FieldContent>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="workspace-description">
                      Description
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="workspace-description"
                        type="text"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Example description"
                        autoComplete="off"
                        maxLength={200}
                        aria-invalid={errorMessage ? true : undefined}
                        disabled={createWorkspaceMutation.isPending}
                      />
                      <FieldDescription>
                        Insert a description of your workspace here.
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
                          className="flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white shadow-sm"
                          style={{ backgroundColor: color }}
                        >
                          {(name.trim()[0] ?? 'W').toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {name.trim() || 'Workspace preview'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Accent {color.toUpperCase()}
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

              <FieldError>{errorMessage}</FieldError>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={createWorkspaceMutation.isPending || !name.trim()}
                >
                  {createWorkspaceMutation.isPending
                    ? 'Creating workspace...'
                    : 'Create workspace'}
                </Button>

                <Button variant="ghost" asChild>
                  <Link
                    to="/organizations/$organizationId/workspaces"
                    params={{ organizationId }}
                  >
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
