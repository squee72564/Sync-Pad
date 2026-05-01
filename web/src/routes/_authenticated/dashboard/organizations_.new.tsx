import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { ArrowLeftIcon, Building2Icon } from 'lucide-react';
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
          queryKey: meQueryKeys.organizations(),
        }),
        queryClient.invalidateQueries({ queryKey: organizationQueryKeys.all }),
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

    await createOrganizationMutation.mutateAsync({ name: trimmedName });
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="secondary">Create</Badge>
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Create organization
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Start with the organization name. This flow can expand into a
              fuller setup experience as organization onboarding grows.
            </p>
          </div>
        </div>

        <Button variant="ghost" asChild>
          <Link to="/dashboard/organizations">
            <ArrowLeftIcon />
            Back to organizations
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_20rem]">
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
            <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="organization-name">Name</FieldLabel>
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

        <Card className="border-dashed border-border/70">
          <CardHeader>
            <CardTitle>What comes next</CardTitle>
            <CardDescription>
              Keep the first step light, then deepen the flow as the product
              adds more organization-level setup.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground">
            <p>Invite teammates and assign roles.</p>
            <p>Set up default workspaces and conventions.</p>
            <p>Capture onboarding decisions in a follow-up step.</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
