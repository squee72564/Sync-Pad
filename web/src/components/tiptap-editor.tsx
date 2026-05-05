import Blockquote from '@tiptap/extension-blockquote';
import Bold from '@tiptap/extension-bold';
import InlineCode from '@tiptap/extension-code';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Details, {
  DetailsContent,
  DetailsSummary,
} from '@tiptap/extension-details';
import Document from '@tiptap/extension-document';
import Heading from '@tiptap/extension-heading';
import Highlight from '@tiptap/extension-highlight';
import Italic from '@tiptap/extension-italic';
import { ListKit } from '@tiptap/extension-list';
import Mention from '@tiptap/extension-mention';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Underline from '@tiptap/extension-underline';
import type { Content, Editor } from '@tiptap/react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import {
  AtSign,
  Bold as BoldIcon,
  Code,
  Heading1,
  Heading2,
  Highlighter,
  Italic as ItalicIcon,
  List,
  ListOrdered,
  PanelTopOpen,
  Quote,
  Underline as UnderlineIcon,
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

const plainLowlight = {
  highlight: (_language: string, value: string) => ({
    children: [{ type: 'text', value }],
  }),
  highlightAuto: (value: string) => ({
    children: [{ type: 'text', value }],
  }),
  listLanguages: () => [],
};

const defaultToolbarState = {
  canBold: false,
  canCode: false,
  canHighlight: false,
  canItalic: false,
  canUnderline: false,
  isBold: false,
  isBulletList: false,
  isCode: false,
  isCodeBlock: false,
  isDetails: false,
  isHeading1: false,
  isHeading2: false,
  isHighlight: false,
  isItalic: false,
  isUnderline: false,
  isOrderedList: false,
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
      Document,
      Text,
      Paragraph,
      Bold,
      InlineCode,
      Highlight,
      Italic,
      Underline,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      ListKit,
      CodeBlockLowlight.configure({
        lowlight: plainLowlight,
      }),
      Blockquote,
      Details,
      DetailsSummary,
      DetailsContent,
      Mention,
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
        canCode: editor?.can().chain().focus().toggleCode().run() ?? false,
        canHighlight:
          editor?.can().chain().focus().toggleHighlight().run() ?? false,
        canItalic: editor?.can().chain().focus().toggleItalic().run() ?? false,
        canUnderline:
          editor?.can().chain().focus().toggleUnderline().run() ?? false,
        isBold: editor?.isActive('bold') ?? false,
        isBulletList: editor?.isActive('bulletList') ?? false,
        isCode: editor?.isActive('code') ?? false,
        isCodeBlock: editor?.isActive('codeBlock') ?? false,
        isDetails: editor?.isActive('details') ?? false,
        isHeading1: editor?.isActive('heading', { level: 1 }) ?? false,
        isHeading2: editor?.isActive('heading', { level: 2 }) ?? false,
        isHighlight: editor?.isActive('highlight') ?? false,
        isItalic: editor?.isActive('italic') ?? false,
        isUnderline: editor?.isActive('underline') ?? false,
        isOrderedList: editor?.isActive('orderedList') ?? false,
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
        <BoldIcon className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Italic"
        className="size-8 p-0"
        disabled={disabled || !state.canItalic}
        onPressedChange={() => editor?.chain().focus().toggleItalic().run()}
        pressed={state.isItalic}
        size="sm"
      >
        <ItalicIcon className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Underline"
        className="size-8 p-0"
        disabled={disabled || !state.canUnderline}
        onPressedChange={() => editor?.chain().focus().toggleUnderline().run()}
        pressed={state.isUnderline}
        size="sm"
      >
        <UnderlineIcon className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Inline code"
        className="size-8 p-0"
        disabled={disabled || !state.canCode}
        onPressedChange={() => editor?.chain().focus().toggleCode().run()}
        pressed={state.isCode}
        size="sm"
      >
        <Code className="size-4" />
      </Toggle>
      <Toggle
        aria-label="Highlight"
        className="size-8 p-0"
        disabled={disabled || !state.canHighlight}
        onPressedChange={() => editor?.chain().focus().toggleHighlight().run()}
        pressed={state.isHighlight}
        size="sm"
      >
        <Highlighter className="size-4" />
      </Toggle>

      <ToolbarSeparator />

      <Toggle
        aria-label="Code block"
        className="size-8 p-0"
        disabled={disabled}
        onPressedChange={() => editor?.chain().focus().toggleCodeBlock().run()}
        pressed={state.isCodeBlock}
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
      <Toggle
        aria-label="Details"
        className="size-8 p-0"
        disabled={disabled}
        onPressedChange={() =>
          state.isDetails
            ? editor?.chain().focus().unsetDetails().run()
            : editor?.chain().focus().setDetails().run()
        }
        pressed={state.isDetails}
        size="sm"
      >
        <PanelTopOpen className="size-4" />
      </Toggle>

      <ToolbarSeparator />

      <Button
        aria-label="Mention"
        className="size-8 p-0"
        disabled={disabled}
        onClick={() =>
          editor
            ?.chain()
            .focus()
            .insertContent({
              type: 'mention',
              attrs: {
                id: 'mention',
                label: 'mention',
              },
            })
            .run()
        }
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <AtSign className="size-4" />
      </Button>
    </div>
  );
}

function ToolbarSeparator() {
  return (
    <Separator className="mx-1 hidden h-6 sm:block" orientation="vertical" />
  );
}
