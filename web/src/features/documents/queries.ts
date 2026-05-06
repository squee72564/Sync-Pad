import { queryOptions } from '@tanstack/react-query';

import { getDocument, getWorkspaceDocuments } from './api';

export const documentQueryKeys = {
  all: ['documents'] as const,
  byWorkspace: (workspaceId: string) =>
    [...documentQueryKeys.all, 'byWorkspace', workspaceId] as const,
  detail: (organizationId: string, workspaceId: string, documentId: string) =>
    [
      ...documentQueryKeys.all,
      'detail',
      organizationId,
      workspaceId,
      documentId,
    ] as const,
};

export const workspacesDocumentQuery = (
  organizationId: string,
  workspaceId: string,
) =>
  queryOptions({
    queryFn: () => getWorkspaceDocuments(organizationId, workspaceId),
    queryKey: documentQueryKeys.byWorkspace(workspaceId),
    staleTime: 60_000,
  });

export const documentQuery = (
  organizationId: string,
  workspaceId: string,
  documentId: string,
) =>
  queryOptions({
    queryFn: () => getDocument({ organizationId, workspaceId, documentId }),
    queryKey: documentQueryKeys.detail(organizationId, workspaceId, documentId),
    staleTime: 60_000,
  });
