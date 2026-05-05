import { queryOptions } from '@tanstack/react-query';

import { getMeOrganizations, getMeUser, getMeWorkspaces } from './api';

export const meQueryKeys = {
  all: ['me'] as const,
  user: () => [...meQueryKeys.all, 'user'] as const,
  organizations: () => [...meQueryKeys.all, 'organizations'] as const,
  workspaces: () => [...meQueryKeys.all, 'workspaces'] as const,
};

export const meUserQuery = () =>
  queryOptions({
    queryFn: getMeUser,
    queryKey: meQueryKeys.user(),
    staleTime: 60_000,
  });

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
