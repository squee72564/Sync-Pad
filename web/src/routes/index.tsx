import { createFileRoute } from '@tanstack/react-router';
import HomeNavigationMenu from '#/components/home-navigation-bar';

export const Route = createFileRoute('/')({ component: Home });

function Home() {
  return (
    <div className="p-8">
      <HomeNavigationMenu />
      <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
      <p className="mt-4 text-lg">
        Edit <code>src/routes/index.tsx</code> to get started.
      </p>
    </div>
  );
}
