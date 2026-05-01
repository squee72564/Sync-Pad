import { Link } from '@tanstack/react-router';
import { AlertTriangleIcon } from 'lucide-react';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { ApiError } from '#/lib/api/errors';

type ScopeRouteErrorProps = {
  error: unknown;
  fallbackTitle: string;
  fallbackDescription: string;
};

export function ScopeRouteError({
  error,
  fallbackTitle,
  fallbackDescription,
}: ScopeRouteErrorProps) {
  const isNotFoundOrForbidden =
    error instanceof ApiError && (error.status === 403 || error.status === 404);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md border-border/70">
        <CardHeader>
          <div className="flex size-10 items-center justify-center rounded-md bg-muted">
            <AlertTriangleIcon className="size-4" />
          </div>
          <CardTitle>
            {isNotFoundOrForbidden ? fallbackTitle : 'Unable to load page'}
          </CardTitle>
          <CardDescription>
            {isNotFoundOrForbidden
              ? fallbackDescription
              : error instanceof Error
                ? error.message
                : 'Something went wrong.'}
          </CardDescription>
          <div className="pt-2">
            <Button asChild>
              <Link to="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
