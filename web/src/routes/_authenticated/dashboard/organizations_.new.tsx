import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, Building2Icon } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';
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
import { createOrganization } from '#/features/organizations/api';
import { organizationQueryKeys } from '#/features/organizations/queries';

export const Route = createFileRoute(
  '/_authenticated/dashboard/organizations_/new',
)({
  component: NewOrganizationPage,
});

function NewOrganizationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createOrganizationMutation = useMutation({
    mutationFn: createOrganization,
    onMutate: () => {
      setErrorMessage(null);
    },
    onSuccess: async ({ organization }) => {
      toast.success(`Created ${organization.name}`);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: meQueryKeys.organizationLists(),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.lists(),
        }),
      ]);
      await navigate({ to: '/dashboard/organizations' });
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create organization.';
      setErrorMessage(message);
      toast.error(message);
    },
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage('Organization name is required.');
      return;
    }

    await createOrganizationMutation.mutateAsync({
      name: trimmedName,
      description: description,
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <PageHeader
        className="w-full"
        eyebrow="Create"
        title="Create organization"
        description="Start with the organization name. This flow can expand into a fuller setup experience as organization onboarding grows."
        actions={
          <Button variant="ghost" asChild>
            <Link to="/dashboard/organizations">
              <ArrowLeftIcon />
              Back to organizations
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6">
        <Card className="border-border/70">
          <CardHeader>
            <div className="flex size-10 items-center justify-center rounded-md bg-muted">
              <Building2Icon className="size-4" />
            </div>
            <CardTitle>Organization details</CardTitle>
            <CardDescription>
              Use a name your team will recognize immediately. You can evolve
              settings and structure after creation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="mx-auto flex w-full max-w-3xl flex-col gap-6"
              onSubmit={handleSubmit}
            >
              <FieldGroup className="max-w-3xl">
                <Field>
                  <FieldLabel htmlFor="organization-name">Name *</FieldLabel>
                  <FieldContent>
                    <Input
                      id="organization-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Acme Product"
                      autoComplete="organization"
                      maxLength={200}
                      aria-invalid={errorMessage ? true : undefined}
                      disabled={createOrganizationMutation.isPending}
                      required
                    />
                    <FieldDescription>
                      This is what members will see throughout Syncpad.
                    </FieldDescription>
                  </FieldContent>
                </Field>
                <Field>
                  <FieldLabel htmlFor="organization-description">
                    Description
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      id="organization-description"
                      type="text"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Your Organization Description"
                      aria-invalid={errorMessage ? true : undefined}
                      disabled={createOrganizationMutation.isPending}
                    />
                    <FieldDescription>
                      Input a description for this workspace
                    </FieldDescription>
                  </FieldContent>
                </Field>
              </FieldGroup>

              <FieldError>{errorMessage}</FieldError>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  disabled={
                    createOrganizationMutation.isPending || !name.trim()
                  }
                >
                  {createOrganizationMutation.isPending
                    ? 'Creating organization...'
                    : 'Create organization'}
                </Button>

                <Button variant="ghost" asChild>
                  <Link to="/dashboard/organizations">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
