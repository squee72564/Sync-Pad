import { queryOptions } from '@tanstack/react-query';

import { getMeOrganizations, getMeUser, getMeWorkspaces } from './api';
import type { MeListSearch } from './types';

export const meQueryKeys = {
  all: ['me'] as const,
  user: () => [...meQueryKeys.all, 'user'] as const,
  organizations: (search: MeListSearch = {}) =>
    [...meQueryKeys.all, 'organizations', search] as const,
  workspaces: (search: MeListSearch = {}) =>
    [...meQueryKeys.all, 'workspaces', search] as const,
};

export const meUserQuery = () =>
  queryOptions({
    queryFn: getMeUser,
    queryKey: meQueryKeys.user(),
    staleTime: 60_000,
  });

export const meOrganizationsQuery = (search: MeListSearch = {}) =>
  queryOptions({
    queryFn: () => getMeOrganizations(search),
    queryKey: meQueryKeys.organizations(search),
    staleTime: 60_000,
  });

export const meWorkspacesQuery = (search: MeListSearch = {}) =>
  queryOptions({
    queryFn: () => getMeWorkspaces(search),
    queryKey: meQueryKeys.workspaces(search),
    staleTime: 60_000,
  });
