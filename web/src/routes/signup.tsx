'use client';

import { createFileRoute } from '@tanstack/react-router';
import SignUpForm from '#/components/sign-up-form';

export const Route = createFileRoute('/signup')({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-10">
      <SignUpForm />
    </main>
  );
}
