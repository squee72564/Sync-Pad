import { queryOptions } from '@tanstack/react-query';
import type { ListQuerySearch } from '#/lib/api/list-query';
import {
  getOrganizationWorkspaces,
  getWorkspace,
  getWorkspaceAccessPermissions,
  getWorkspaceMembers,
} from './api';

export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  byOrganization: (organizationId: string, search: ListQuerySearch) =>
    [
      ...workspaceQueryKeys.all,
      'byOrganization',
      organizationId,
      search,
    ] as const,
  detail: (organizationId: string, workspaceId: string) =>
    [...workspaceQueryKeys.all, 'detail', workspaceId, organizationId] as const,
  members: (organizationId: string, workspaceId: string) =>
    [
      ...workspaceQueryKeys.all,
      'members',
      workspaceId,
      organizationId,
    ] as const,
  access: (organizationId: string, workspaceId: string) =>
    [...workspaceQueryKeys.all, 'access', workspaceId, organizationId] as const,
};

export const organizationWorkspacesQuery = (
  organizationId: string,
  search: ListQuerySearch,
) =>
  queryOptions({
    queryFn: () => getOrganizationWorkspaces(organizationId, search),
    queryKey: workspaceQueryKeys.byOrganization(organizationId, search),
    staleTime: 60_000,
  });

export const workspaceQuery = (organizationId: string, workspaceId: string) =>
  queryOptions({
    queryFn: () => getWorkspace({ organizationId, workspaceId }),
    queryKey: workspaceQueryKeys.detail(organizationId, workspaceId),
    staleTime: 60_000,
  });

export const workspaceMembersQuery = (
  organizationId: string,
  workspaceId: string,
) =>
  queryOptions({
    queryFn: () => getWorkspaceMembers({ organizationId, workspaceId }),
    queryKey: workspaceQueryKeys.members(organizationId, workspaceId),
    staleTime: 60_000,
  });

export const workspacePermissionsQuery = (
  organizationId: string,
  workspaceId: string,
) =>
  queryOptions({
    queryFn: () =>
      getWorkspaceAccessPermissions({ organizationId, workspaceId }),
    queryKey: workspaceQueryKeys.access(organizationId, workspaceId),
    staleTime: 60_000,
  });
