import { queryOptions } from '@tanstack/react-query';
import type { ListQuerySearch } from '#/lib/api/list-query';

import { getDocument, getWorkspaceDocuments } from './api';

export const documentQueryKeys = {
  all: ['documents'] as const,
  lists: () => [...documentQueryKeys.all, 'list'] as const,
  byWorkspaceRoot: (organizationId: string, workspaceId: string) =>
    [
      ...documentQueryKeys.lists(),
      'byWorkspace',
      organizationId,
      workspaceId,
    ] as const,
  byWorkspace: (
    organizationId: string,
    workspaceId: string,
    search: ListQuerySearch = {},
  ) =>
    [
      ...documentQueryKeys.byWorkspaceRoot(organizationId, workspaceId),
      search,
    ] as const,
  details: () => [...documentQueryKeys.all, 'detail'] as const,
  detail: (organizationId: string, workspaceId: string, documentId: string) =>
    [
      ...documentQueryKeys.details(),
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
    queryKey: documentQueryKeys.byWorkspace(
      organizationId,
      workspaceId,
      search,
    ),
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
