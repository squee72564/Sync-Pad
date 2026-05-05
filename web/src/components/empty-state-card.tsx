import type { ComponentType, ReactNode } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';

type EmptyStateCardProps = {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyStateCard({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateCardProps) {
  return (
    <Card className="border-border/70 bg-muted/15">
      <CardHeader className="gap-4">
        <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border/70">
          <Icon className="size-5" />
        </div>
        <div className="space-y-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription className="max-w-md leading-5">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      {action ? <CardContent>{action}</CardContent> : null}
    </Card>
  );
}
