import { createFileRoute } from '@tanstack/react-router';
import { Badge } from '#/components/ui/badge';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 md:py-8">
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <Card className="border-border/70">
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline">Dashboard</Badge>
              <Badge variant="secondary">Early workspace shell</Badge>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl tracking-tight">
                A shared operating layer for teams, documents, and AI.
              </CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6">
                This dashboard is the protected entry point for the Syncpad
                workspace. It is the right place to centralize navigation,
                workspace context, and the core surfaces that tie planning,
                writing, knowledge, and AI together.
              </CardDescription>
            </div>
          </CardHeader>
        </Card>
      </section>
    </div>
  );
}
