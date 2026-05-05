import type { ReactNode } from 'react';
import { Badge } from '#/components/ui/badge';
import { cn } from '#/lib/utils';

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  leading?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  leading,
  actions,
  children,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/35 p-5 md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        {leading ? <div className="shrink-0">{leading}</div> : null}
        <div className="min-w-0 space-y-2">
          {eyebrow ? (
            typeof eyebrow === 'string' ? (
              <Badge variant="secondary" className="w-fit">
                {eyebrow}
              </Badge>
            ) : (
              eyebrow
            )
          ) : null}
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {actions || children ? (
        <div className="flex shrink-0 flex-col gap-3 md:items-end">
          {actions ? (
            <div className="flex flex-wrap gap-2">{actions}</div>
          ) : null}
          {children}
        </div>
      ) : null}
    </section>
  );
}

export function PageHeaderStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-card px-3 py-2">
      <div className="text-lg font-semibold leading-none">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
