'use client';

import { createFileRoute } from '@tanstack/react-router';
import SignUpForm from '#/components/sign-up-form';

export const Route = createFileRoute('/signup')({
  component: SignUpPage,
});

function SignUpPage() {
  const { auth } = Route.useRouteContext();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
      <SignUpForm auth={auth} />
    </main>
  );
}
