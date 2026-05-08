import { queryOptions } from '@tanstack/react-query';

import {
  getOrganizationWorkspaces,
  getWorkspace,
  getWorkspaceAccessPermissions,
  getWorkspaceMembers,
} from './api';

export const workspaceQueryKeys = {
  all: ['workspaces'] as const,
  byOrganization: (organizationId: string) =>
    [...workspaceQueryKeys.all, 'byOrganization', organizationId] as const,
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

export const organizationWorkspacesQuery = (organizationId: string) =>
  queryOptions({
    queryFn: () => getOrganizationWorkspaces(organizationId),
    queryKey: workspaceQueryKeys.byOrganization(organizationId),
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
