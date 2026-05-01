import { queryOptions } from '@tanstack/react-query';

import { getOrganizationWorkspaces } from './api';

export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  byOrganization: (organizationId: string) =>
    [...workspaceQueryKeys.all, 'byOrganization', organizationId] as const,
  detail: (organizationId: string, workspaceId: string) =>
    [
      ...workspaceQueryKeys.byOrganization(organizationId),
      'detail',
      workspaceId,
    ] as const,
};

export const organizationWorkspacesQuery = (organizationId: string) =>
  queryOptions({
    queryFn: () => getOrganizationWorkspaces(organizationId),
    queryKey: workspaceQueryKeys.byOrganization(organizationId),
    staleTime: 60_000,
  });
