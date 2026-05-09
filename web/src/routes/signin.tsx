'use client';

import { createFileRoute } from '@tanstack/react-router';
import SignInForm from '#/components/sign-in-form';

export const Route = createFileRoute('/signin')({
  component: SignInPage,
});

function SignInPage() {
  const { auth } = Route.useRouteContext();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
      <SignInForm auth={auth} />
    </main>
  );
}
