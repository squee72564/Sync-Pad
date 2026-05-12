'use client';

import { createFileRoute } from '@tanstack/react-router';
import SignUpForm from '#/components/sign-up-form';
import { parseAuthRedirectSearch } from '#/lib/auth-redirect';

export const Route = createFileRoute('/signup')({
  validateSearch: parseAuthRedirectSearch,
  component: SignUpPage,
});

function SignUpPage() {
  const { auth } = Route.useRouteContext();
  const { redirect } = Route.useSearch();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
      <SignUpForm auth={auth} redirect={redirect} />
    </main>
  );
}
