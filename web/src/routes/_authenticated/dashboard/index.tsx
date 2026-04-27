import { createFileRoute } from '@tanstack/react-router';
import {
  BookOpenIcon,
  BotIcon,
  FolderKanbanIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { Badge } from '#/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';

export const Route = createFileRoute('/_authenticated/dashboard/')({
  component: DashboardPage,
});

const capabilityCards = [
  {
    title: 'Structured work',
    description:
      'Shape projects, tasks, owners, and milestones inside one connected workspace.',
    icon: FolderKanbanIcon,
  },
  {
    title: 'Live documents',
    description:
      'Keep writing and execution close together instead of splitting work across tools.',
    icon: BookOpenIcon,
  },
  {
    title: 'AI workflows',
    description:
      'Prepare for assistants and agents that can reason over real workspace context.',
    icon: BotIcon,
  },
];

const focusAreas = [
  'Model organizations, projects, tasks, and documents as connected objects.',
  'Make collaboration and documentation feel native to the workspace.',
  'Enforce consistent permissions for people and AI over the same context.',
];

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

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheckIcon className="size-4" />
              Authenticated area
            </CardTitle>
            <CardDescription>
              This section already sits under your shared protected route.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Use this layout for dashboard-wide navigation and shell UI.</p>
            <p>
              Add more child routes under `dashboard/` as those workspace
              surfaces come online.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {capabilityCards.map((card) => (
          <Card key={card.title} className="border-border/70">
            <CardHeader className="gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/30">
                <card.icon className="size-4" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-base">{card.title}</CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Current focus</CardTitle>
            <CardDescription>
              The first dashboard iteration should reinforce the product model
              before it tries to do too much.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {focusAreas.map((item) => (
                <li
                  key={item}
                  className="rounded-lg border border-border/60 bg-muted/20 px-3 py-3"
                >
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>What the sidebar should grow into</CardTitle>
            <CardDescription>
              Keep the sidebar as the stable workspace shell while individual
              route segments own their page content.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Overview should remain the dashboard landing route.</p>
            <p>
              Projects, documents, knowledge, and settings can become sibling
              child routes under the same dashboard layout.
            </p>
            <p>
              Shared controls like workspace switching, search, and account
              actions can stay in the sidebar and top bar without leaking into
              each page.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
