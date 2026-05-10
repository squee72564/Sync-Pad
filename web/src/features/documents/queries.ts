import { queryOptions } from '@tanstack/react-query';
import type { ListQuerySearch } from '#/lib/api/list-query';

import { getDocument, getWorkspaceDocuments } from './api';

export const documentQueryKeys = {
  all: ['documents'] as const,
  byWorkspace: (workspaceId: string, search: ListQuerySearch = {}) =>
    [...documentQueryKeys.all, 'byWorkspace', workspaceId, search] as const,
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
  search: ListQuerySearch,
) =>
  queryOptions({
    queryFn: () => getWorkspaceDocuments(organizationId, workspaceId, search),
    queryKey: documentQueryKeys.byWorkspace(workspaceId, search),
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
