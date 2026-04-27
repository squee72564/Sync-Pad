'use client';

import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
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
import { authClient } from '#/lib/auth-client';

export default function SignUpForm() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    await authClient.signUp.email(
      {
        name,
        email,
        password,
      },
      {
        onRequest: (_ctx) => {
          setIsSubmitting(true);
          setErrorMessage(null);
        },
        onSuccess: async (_ctx) => {
          setIsSubmitting(false);
          toast.success('Successfully signed up');
          await navigate({ to: '/' });
        },
        onError: (ctx) => {
          setIsSubmitting(false);
          const message = ctx.error.message || 'Unable to create account.';
          setErrorMessage(message);
          toast.error(message);
        },
      },
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <Badge variant="secondary">Sign up</Badge>
        <CardTitle>Create your Syncpad account</CardTitle>
        <CardDescription>Sign up for a new account.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <FieldContent>
                <Input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <FieldContent>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <FieldContent>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </FieldContent>
            </Field>
          </FieldGroup>

          <FieldError>{errorMessage}</FieldError>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          Already have an account?
        </span>
        <Button variant="ghost" asChild>
          <Link to="/signin">Sign in</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
