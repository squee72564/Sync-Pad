'use client';

import { createFileRoute } from '@tanstack/react-router';
import SignInForm from '#/components/sign-in-form';
import { parseAuthRedirectSearch } from '#/lib/auth-redirect';

export const Route = createFileRoute('/signin')({
  validateSearch: parseAuthRedirectSearch,
  component: SignInPage,
});

function SignInPage() {
  const { auth } = Route.useRouteContext();
  const { redirect } = Route.useSearch();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
      <SignInForm auth={auth} redirect={redirect} />
    </main>
  );
}
