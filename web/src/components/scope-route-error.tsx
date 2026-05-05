import { Link } from '@tanstack/react-router';
import {
  AlertTriangleIcon,
  ArrowLeftIcon,
  HomeIcon,
  LockKeyholeIcon,
  SearchXIcon,
} from 'lucide-react';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
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
  const errorDetails = getErrorDetails({
    error,
    fallbackDescription,
    fallbackTitle,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/15 px-4 py-8">
      <Card className="w-full max-w-xl border-border/70 bg-gradient-to-br from-background via-background to-muted/35">
        <CardHeader className="gap-4">
          <div className="flex items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/70">
              <errorDetails.icon className="size-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle>{errorDetails.title}</CardTitle>
              <CardDescription className="leading-5">
                {errorDetails.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/dashboard">
              <HomeIcon />
              Back to dashboard
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
          >
            <ArrowLeftIcon />
            Go back
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function getErrorDetails({
  error,
  fallbackDescription,
  fallbackTitle,
}: {
  error: unknown;
  fallbackDescription: string;
  fallbackTitle: string;
}) {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return {
        description: fallbackDescription,
        icon: LockKeyholeIcon,
        title: fallbackTitle,
      };
    }

    if (error.status === 404) {
      return {
        description: fallbackDescription,
        icon: SearchXIcon,
        title: fallbackTitle,
      };
    }
  }

  return {
    description:
      error instanceof Error ? error.message : 'Something went wrong.',
    icon: AlertTriangleIcon,
    title: 'Unable to load page',
  };
}
