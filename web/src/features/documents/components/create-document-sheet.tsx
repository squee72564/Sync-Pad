import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { FilePlusIcon, PlusIcon } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';
import { HexAlphaColorPicker } from 'react-colorful';
import { toast } from 'sonner';
import { Button } from '#/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#/components/ui/field';
import { Input } from '#/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet';
import { createDocument } from '#/features/documents/api';
import { documentQueryKeys } from '#/features/documents/queries';
import type { OrganizationWorkspaceDocumentsResponse } from '#/features/documents/types';

type CreateDocumentSheetProps = {
  organizationId: string;
  workspaceId: string;
};

export function CreateDocumentSheet({
  organizationId,
  workspaceId,
}: CreateDocumentSheetProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#336699FF');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createDocumentMutation = useMutation({
    mutationFn: createDocument,
    onMutate: () => {
      setErrorMessage(null);
    },
    onSuccess: async ({ document }) => {
      queryClient.setQueryData<OrganizationWorkspaceDocumentsResponse>(
        documentQueryKeys.byWorkspace(workspaceId),
        (current) =>
          current
            ? {
                ...current,
                documents: [
                  document,
                  ...current.documents.filter(
                    (existingDocument) => existingDocument.id !== document.id,
                  ),
                ],
              }
            : current,
      );

      toast.success(`Created ${document.title}`);
      setTitle('');
      setColor('#336699FF');
      setOpen(false);

      await queryClient.invalidateQueries({
        queryKey: documentQueryKeys.byWorkspace(workspaceId),
        refetchType: 'none',
      });
      await router.invalidate();
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : 'Unable to create document.';
      setErrorMessage(message);
      toast.error(message);
    },
  });

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    let normalizedColor = color.trim().toUpperCase();

    if (!trimmedTitle) {
      setErrorMessage('Document title is required.');
      return;
    }

    if (trimmedTitle.length > 200) {
      setErrorMessage('Document title must be 200 characters or fewer.');
      return;
    }

    if (/^#[0-9A-Fa-f]{6}$/.test(normalizedColor)) {
      normalizedColor = `${normalizedColor}FF`;
    }

    if (!/^#[0-9A-Fa-f]{8}$/.test(normalizedColor)) {
      setErrorMessage(`Invalid Color: ${normalizedColor}`);
      return;
    }

    await createDocumentMutation.mutateAsync({
      input: {
        title: trimmedTitle,
        color: normalizedColor,
      },
      organizationId,
      workspaceId,
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <PlusIcon />
          New document
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-border/70 p-6">
          <div className="flex size-10 items-center justify-center rounded-md bg-muted">
            <FilePlusIcon className="size-4" />
          </div>
          <SheetTitle>Create document</SheetTitle>
          <SheetDescription>
            Add a document to this workspace with a title and accent color.
          </SheetDescription>
        </SheetHeader>

        <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
          <div className="flex-1 p-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="document-title">Title</FieldLabel>
                <FieldContent>
                  <Input
                    id="document-title"
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Planning notes"
                    autoComplete="off"
                    maxLength={200}
                    aria-invalid={errorMessage ? true : undefined}
                    disabled={createDocumentMutation.isPending}
                    required
                  />
                  <FieldDescription>
                    This is what workspace members will see in the document
                    list.
                  </FieldDescription>
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor="document-color">Color</FieldLabel>
                <FieldContent>
                  <div className="rounded-xl border border-border/70 bg-muted/25 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <div
                        className="flex size-12 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {(title.trim()[0] ?? 'D').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {title.trim() || 'Document preview'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Accent {color.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <HexAlphaColorPicker
                      id="document-color"
                      className="w-full"
                      color={color}
                      onChange={(event) => setColor(event)}
                    />
                  </div>
                  <FieldDescription>
                    Pick the color used for the document icon and card accent.
                  </FieldDescription>
                </FieldContent>
              </Field>
            </FieldGroup>

            <FieldError className="mt-6">{errorMessage}</FieldError>
          </div>

          <SheetFooter className="border-t border-border/70 p-6">
            <Button
              type="submit"
              disabled={createDocumentMutation.isPending || !title.trim()}
            >
              {createDocumentMutation.isPending
                ? 'Creating document...'
                : 'Create document'}
            </Button>
            <SheetClose asChild>
              <Button
                type="button"
                variant="ghost"
                disabled={createDocumentMutation.isPending}
              >
                Cancel
              </Button>
            </SheetClose>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
