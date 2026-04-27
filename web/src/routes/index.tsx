import { createFileRoute } from '@tanstack/react-router';
import HomeNavigationMenu from '#/components/home-navigation-bar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '#/components/ui/accordion';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '#/components/ui/card';
import { Separator } from '#/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs';

export const Route = createFileRoute('/')({ component: Home });

const capabilities = [
  {
    title: 'Structured work',
    description:
      'Track projects, tasks, owners, and milestones in one workspace instead of splitting work across separate tools.',
  },
  {
    title: 'Live documents',
    description:
      'Write, edit, and collaborate in real time while keeping planning and documentation connected.',
  },
  {
    title: 'Connected knowledge',
    description:
      'Link notes, tasks, and project context so teams can move through work without losing the thread.',
  },
];

const workflows = {
  planning: {
    title: 'Plan work with context already attached',
    description:
      'Projects, tasks, and notes live together so planning does not start from a blank screen or a separate tracker.',
    points: [
      'Keep ownership, timelines, and related decisions in one place.',
      'Move from documents into structured execution without duplicate entry.',
      'Preserve context as plans evolve across teams and projects.',
    ],
  },
  knowledge: {
    title: 'Turn documents into shared operational knowledge',
    description:
      'Notes and docs are part of the workspace model, so knowledge stays discoverable and connected to active work.',
    points: [
      'Link decisions back to projects, tasks, and milestones.',
      'Build a team knowledge base without maintaining a second system.',
      'Reduce fragmentation between writing, planning, and delivery.',
    ],
  },
  ai: {
    title: 'Use AI on the same workspace your team uses',
    description:
      'Syncpad is designed so AI can reason over the same context humans use, with the same access boundaries.',
    points: [
      'Ask questions about current work, documents, and blockers.',
      'Generate summaries, updates, and follow-up actions from real context.',
      'Prepare for agent workflows that can operate within workspace permissions.',
    ],
  },
};

const faqs = [
  {
    value: 'faq-1',
    question: 'What is Syncpad trying to replace?',
    answer:
      'Syncpad is aimed at the gap between task trackers, document tools, knowledge bases, and AI assistants. The goal is not another isolated surface, but a single shared workspace for all four.',
  },
  {
    value: 'faq-2',
    question: 'Who is the product for?',
    answer:
      'Teams that need structured execution, collaborative writing, and searchable institutional knowledge in the same system. The model is especially useful when AI needs the same context the team uses daily.',
  },
  {
    value: 'faq-3',
    question: 'How does AI fit into the product?',
    answer:
      'AI is treated as part of the workspace, not a detached chatbot. It should be able to summarize, draft, organize, and eventually take bounded actions while respecting the same permissions as users.',
  },
];

function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-8 md:px-8 md:py-10">
      <header className="flex flex-col gap-6">
        <div className="w-full">
          <HomeNavigationMenu />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-5 items-center text-center">
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl max-w-xl">
              A shared workspace for teams, documents, and AI.
            </h1>
            <p className="max-w-3xl text-base text-muted-foreground sm:text-lg max-w-xl">
              Syncpad brings structured execution, real-time collaboration, and
              connected knowledge into one system so people and AI can work over
              the same context.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mx-auto">
          <Button asChild>
            <a href="/signin">Sign In</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/signup">Sign Up</a>
          </Button>
        </div>
      </header>

      <Separator />

      <section className="grid gap-4 md:grid-cols-3">
        {capabilities.map((capability) => (
          <Card key={capability.title}>
            <CardHeader>
              <CardTitle>{capability.title}</CardTitle>
              <CardDescription>{capability.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <Badge variant="outline">Core workflows</Badge>
            <CardTitle>One workspace instead of separate systems.</CardTitle>
            <CardDescription>
              The product vision is a connected operating layer for planning,
              writing, tracking, and AI-assisted execution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="planning">
              <TabsList>
                <TabsTrigger value="planning">Planning</TabsTrigger>
                <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
                <TabsTrigger value="ai">AI workflows</TabsTrigger>
              </TabsList>
              <TabsContent value="planning" className="pt-4">
                <WorkflowPanel {...workflows.planning} />
              </TabsContent>
              <TabsContent value="knowledge" className="pt-4">
                <WorkflowPanel {...workflows.knowledge} />
              </TabsContent>
              <TabsContent value="ai" className="pt-4">
                <WorkflowPanel {...workflows.ai} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="outline">Why it matters</Badge>
            <CardTitle>Context survives the handoff.</CardTitle>
            <CardDescription>
              Instead of copying work between docs, task boards, and AI tools,
              Syncpad keeps the system connected from the start.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-medium">For teams</p>
              <p className="text-sm text-muted-foreground">
                Work stays aligned across projects, documents, and ownership.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">For knowledge</p>
              <p className="text-sm text-muted-foreground">
                Notes become part of the workspace instead of dead reference
                material.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">For AI</p>
              <p className="text-sm text-muted-foreground">
                Assistance is grounded in real project context and permissions.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <Badge variant="outline">Current focus</Badge>
            <CardTitle>Building the foundation first.</CardTitle>
            <CardDescription>
              Syncpad is still early. The present focus is the workspace model,
              the collaboration experience, and the shape of AI-native
              workflows.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="secondary" asChild>
              <a href="/docs">See where it is headed</a>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="outline">Questions</Badge>
            <CardTitle>What the homepage should make clear.</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {faqs.map((faq) => (
                <AccordionItem key={faq.value} value={faq.value}>
                  <AccordionTrigger>{faq.question}</AccordionTrigger>
                  <AccordionContent>{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function WorkflowPanel({
  title,
  description,
  points,
}: {
  title: string;
  description: string;
  points: string[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-2">
        {points.map((point) => (
          <Card key={point} size="sm">
            <CardContent className="text-muted-foreground">{point}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
