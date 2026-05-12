import { queryOptions } from '@tanstack/react-query';

import {
  getMeInvitations,
  getMeOrganizations,
  getMeUser,
  getMeWorkspaces,
} from './api';
import type { MeInvitationsSearch, MeListSearch } from './types';

export const meQueryKeys = {
  all: ['me'] as const,
  user: () => [...meQueryKeys.all, 'user'] as const,
  organizationLists: () => [...meQueryKeys.all, 'organizations'] as const,
  organizations: (search: MeListSearch = {}) =>
    [...meQueryKeys.organizationLists(), search] as const,
  workspaceLists: () => [...meQueryKeys.all, 'workspaces'] as const,
  workspaces: (search: MeListSearch = {}) =>
    [...meQueryKeys.workspaceLists(), search] as const,
  invitationLists: () => [...meQueryKeys.all, 'invitations'] as const,
  invitations: (search: MeInvitationsSearch = {}) =>
    [...meQueryKeys.invitationLists(), search] as const,
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

export const meInvitationsQuery = (search: MeInvitationsSearch = {}) =>
  queryOptions({
    queryFn: () => getMeInvitations(search),
    queryKey: meQueryKeys.invitations(search),
    staleTime: 60_000,
  });
