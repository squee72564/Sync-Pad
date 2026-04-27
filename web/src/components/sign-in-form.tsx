'use client';

import { Link } from '@tanstack/react-router';
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

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onRequest: (_ctx) => {
          setIsSubmitting(true);
          setErrorMessage(null);
        },
        onSuccess: (_ctx) => {
          setIsSubmitting(false);
          toast.success('Successfully signed in');
          window.location.assign('/dashboard');
        },
        onError: (ctx) => {
          setIsSubmitting(false);
          const message = ctx.error.message || 'Unable to sign in.';
          setErrorMessage(message);
          toast.error(message);
        },
      },
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <Badge variant="secondary">Sign in</Badge>
        <CardTitle>Access your Syncpad workspace</CardTitle>
        <CardDescription>
          Sign in with your email and password to continue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <FieldGroup>
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <FieldDescription>
                  Email and password authentication is enabled through Better
                  Auth.
                </FieldDescription>
              </FieldContent>
            </Field>
          </FieldGroup>

          <FieldError>{errorMessage}</FieldError>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-between gap-3">
        <span className="text-sm text-muted-foreground">Need an account?</span>
        <Button variant="ghost" asChild>
          <Link to="/signup">Create one</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
