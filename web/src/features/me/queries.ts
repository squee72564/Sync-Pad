import { queryOptions } from '@tanstack/react-query';

import { getMeOrganizations, getMeWorkspaces } from './api';

export const meQueryKeys = {
  all: ['me'] as const,
  organizations: () => [...meQueryKeys.all, 'organizations'] as const,
  workspaces: () => [...meQueryKeys.all, 'workspaces'] as const,
};

export const meOrganizationsQuery = () =>
  queryOptions({
    queryFn: getMeOrganizations,
    queryKey: meQueryKeys.organizations(),
    staleTime: 60_000,
  });

export const meWorkspacesQuery = () =>
  queryOptions({
    queryFn: getMeWorkspaces,
    queryKey: meQueryKeys.workspaces(),
    staleTime: 60_000,
  });
