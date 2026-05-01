import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, FolderPlusIcon } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

    if (!trimmedName) {
      setErrorMessage('Workspace name is required.');
      return;
    }

    await createWorkspaceMutation.mutateAsync({
      input: { name: trimmedName },
      organizationId,
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="secondary">Create</Badge>
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Create workspace
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Add a workspace to this organization for docs, timelines, sheets,
              and project-specific collaboration.
            </p>
          </div>
        </div>

        <Button variant="ghost" asChild>
          <Link
            to="/organizations/$organizationId/workspaces"
            params={{ organizationId }}
          >
            <ArrowLeftIcon />
            Back to workspaces
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_20rem]">
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
              <FieldGroup>
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
              </FieldGroup>

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

        <Card className="border-dashed border-border/70">
          <CardHeader>
            <CardTitle>What comes next</CardTitle>
            <CardDescription>
              Workspace setup can grow into a richer onboarding flow as the
              product adds more collaboration surfaces.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground">
            <p>Add workspace members and roles.</p>
            <p>Create starter docs, sheets, or timeline views.</p>
            <p>Configure workspace-specific settings.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
