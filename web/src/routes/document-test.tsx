import { createFileRoute } from '@tanstack/react-router';
import type { JSONContent } from '@tiptap/react';
import { useState } from 'react';
import { TiptapEditor } from '#/components/tiptap-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs';

export const Route = createFileRoute('/document-test')({
  component: RouteComponent,
});

const initialContent = `
  <h1>Document test</h1>
  <p>This page is wired to the shared Tiptap editor component.</p>
  <p>Use the toolbar to format text, add lists, quotes, code, or highlights.</p>
`;

const initialJson: JSONContent = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { textAlign: null, level: 1 },
      content: [{ type: 'text', text: 'Document test' }],
    },
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [
        {
          type: 'text',
          text: 'This page is wired to the shared Tiptap editor component.',
        },
      ],
    },
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [
        {
          type: 'text',
          text: 'Use the toolbar to format text, add lists, quotes, code, or highlights.',
        },
      ],
    },
  ],
};

function formatHtml(html: string) {
  return html
    .replace(/></g, '>\n<')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n');
}

function RouteComponent() {
  const [html, setHtml] = useState(initialContent);
  const [json, setJson] = useState<JSONContent>(initialJson);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 md:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Document test
        </h1>
        <p className="max-w-2xl text-muted-foreground text-sm">
          A local page for exercising the shared Tiptap editor component.
        </p>
      </header>

      <TiptapEditor
        autofocus="end"
        content={initialContent}
        editorClassName="min-h-[28rem]"
        onUpdate={(updatedHtml, editor) => {
          setHtml(updatedHtml);
          setJson(editor.getJSON());
        }}
      />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-semibold">Editor output</h2>
        <Tabs defaultValue="html">
          <TabsList>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="html">
            <OutputBlock>{formatHtml(html)}</OutputBlock>
          </TabsContent>
          <TabsContent value="json">
            <OutputBlock>{JSON.stringify(json, null, 2)}</OutputBlock>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}

function OutputBlock({ children }: { children: string }) {
  return (
    <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-muted/30 p-4 text-xs">
      <code>{children}</code>
    </pre>
  );
}
