import type { Content, Editor } from '@tiptap/react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Undo2,
} from 'lucide-react';

import { Button } from '#/components/ui/button';
import { Separator } from '#/components/ui/separator';
import { Toggle } from '#/components/ui/toggle';
import { cn } from '#/lib/utils';

type TiptapEditorProps = {
  content?: Content;
  editable?: boolean;
  autofocus?: boolean | 'start' | 'end' | 'all';
  className?: string;
  editorClassName?: string;
  onUpdate?: (html: string, editor: Editor) => void;
};

const defaultContent = '<p>Start writing...</p>';

const defaultToolbarState = {
  canBold: false,
  canItalic: false,
  canStrike: false,
  canCode: false,
  canUndo: false,
  canRedo: false,
  isBold: false,
  isBulletList: false,
  isCode: false,
  isHeading1: false,
  isHeading2: false,
  isItalic: false,
  isOrderedList: false,
  isStrike: false,
  isBlockquote: false,
};

export function TiptapEditor({
  content = defaultContent,
  editable = true,
  autofocus = false,
  className,
  editorClassName,
  onUpdate,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
    ],
    content,
    editable,
    autofocus,
    editorProps: {
      attributes: {
        class: cn(
          'tiptap min-h-64 px-4 py-3 focus:outline-none',
          editorClassName,
        ),
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onUpdate?.(updatedEditor.getHTML(), updatedEditor);
    },
  });

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-background shadow-xs',
        className,
      )}
    >
      <TiptapToolbar editor={editor} editable={editable} />
      <EditorContent editor={editor} />
    </div>
  );
}

type TiptapToolbarProps = {
  editor: Editor | null;
  editable: boolean;
};

function TiptapToolbar({ editor, editable }: TiptapToolbarProps) {
  const state =
    useEditorState({
      editor,
      selector: ({ editor }) => ({
        canBold: editor?.can().chain().focus().toggleBold().run() ?? false,
        canItalic: editor?.can().chain().focus().toggleItalic().run() ?? false,
        canStrike: editor?.can().chain().focus().toggleStrike().run() ?? false,
        canCode: editor?.can().chain().focus().toggleCode().run() ?? false,
        canUndo: editor?.can().chain().focus().undo().run() ?? false,
        canRedo: editor?.can().chain().focus().redo().run() ?? false,
        isBold: editor?.isActive('bold') ?? false,
        isBulletList: editor?.isActive('bulletList') ?? false,
        isCode: editor?.isActive('code') ?? false,
        isHeading1: editor?.isActive('heading', { level: 1 }) ?? false,
        isHeading2: editor?.isActive('heading', { level: 2 }) ?? false,
        isItalic: editor?.isActive('italic') ?? false,
        isOrderedList: editor?.isActive('orderedList') ?? false,
        isStrike: editor?.isActive('strike') ?? false,
        isBlockquote: editor?.isActive('blockquote') ?? false,
      }),
    }) ?? defaultToolbarState;

  const disabled = !editor || !editable;

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-1 border-border border-b bg-muted/20 px-2 py-2">
      <Toggle
        aria-label="Heading 1"
        className="size-8 p-0"
        disabled={disabled}
        onPressedChange={() =>
          editor?.chain().focus().toggleHeading({ level: 1 }).run()
        }
        pressed={state.isHeading1}
        size="sm"
      >
        <Heading1 className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Heading 2"
        className="size-8 p-0"
        disabled={disabled}
        onPressedChange={() =>
          editor?.chain().focus().toggleHeading({ level: 2 }).run()
        }
        pressed={state.isHeading2}
        size="sm"
      >
        <Heading2 className="size-4" />
      </Toggle>

      <ToolbarSeparator />

      <Toggle
        aria-label="Bold"
        className="size-8 p-0"
        disabled={disabled || !state.canBold}
        onPressedChange={() => editor?.chain().focus().toggleBold().run()}
        pressed={state.isBold}
        size="sm"
      >
        <Bold className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Italic"
        className="size-8 p-0"
        disabled={disabled || !state.canItalic}
        onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
        pressed={state.isItalic}
        size="sm"
      >
        <Italic className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Strikethrough"
        className="size-8 p-0"
        disabled={disabled || !state.canStrike}
        onPressedChange={() => editor?.chain().focus().toggleStrike().run()}
        pressed={state.isStrike}
        size="sm"
      >
        <Strikethrough className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Code"
        className="size-8 p-0"
        disabled={disabled || !state.canCode}
        onPressedChange={() => editor?.chain().focus().toggleCode().run()}
        pressed={state.isCode}
        size="sm"
      >
        <Code className="size-4" />
      </Toggle>

      <ToolbarSeparator />

      <Toggle
        aria-label="Bullet list"
        className="size-8 p-0"
        disabled={disabled}
        onPressedChange={() => editor?.chain().focus().toggleBulletList().run()}
        pressed={state.isBulletList}
        size="sm"
      >
        <List className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Ordered list"
        className="size-8 p-0"
        disabled={disabled}
        onPressedChange={() =>
          editor?.chain().focus().toggleOrderedList().run()
        }
        pressed={state.isOrderedList}
        size="sm"
      >
        <ListOrdered className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Blockquote"
        className="size-8 p-0"
        disabled={disabled}
        onPressedChange={() => editor?.chain().focus().toggleBlockquote().run()}
        pressed={state.isBlockquote}
        size="sm"
      >
        <Quote className="size-4" />
      </Toggle>

      <ToolbarSeparator />

      <Button
        aria-label="Undo"
        className="size-8 p-0"
        disabled={disabled || !state.canUndo}
        onClick={() => editor?.chain().focus().undo().run()}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        aria-label="Redo"
        className="size-8 p-0"
        disabled={disabled || !state.canRedo}
        onClick={() => editor?.chain().focus().redo().run()}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <Redo2 className="size-4" />
      </Button>
    </div>
  );
}

function ToolbarSeparator() {
  return (
    <Separator className="mx-1 hidden h-6 sm:block" orientation="vertical" />
  );
}
