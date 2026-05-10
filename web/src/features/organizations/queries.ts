import { queryOptions } from '@tanstack/react-query';

import {
  getOrganization,
  getOrganizationAccessPermissions,
  getOrganizationMembers,
  getOrganizations,
} from './api';

export const organizationQueryKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationQueryKeys.all, 'list'] as const,
  list: () => [...organizationQueryKeys.lists()] as const,
  details: () => [...organizationQueryKeys.all, 'detail'] as const,
  detail: (organizationId: string) =>
    [...organizationQueryKeys.details(), organizationId] as const,
  members: (organizationId: string) =>
    [...organizationQueryKeys.all, 'members', organizationId] as const,
  access: (organizationId: string) =>
    [...organizationQueryKeys.all, 'access', organizationId] as const,
};

export const organizationsQuery = () =>
  queryOptions({
    queryFn: getOrganizations,
    queryKey: organizationQueryKeys.list(),
    staleTime: 60_000,
  });

export const organizationQuery = (organizationId: string) =>
  queryOptions({
    queryFn: () => getOrganization(organizationId),
    queryKey: organizationQueryKeys.detail(organizationId),
    staleTime: 60_000,
  });

export const organizationMembersQuery = (organizationId: string) =>
  queryOptions({
    queryFn: () => getOrganizationMembers(organizationId),
    queryKey: organizationQueryKeys.members(organizationId),
    staleTime: 60_000,
  });

export const organizationPermissionsQuery = (organizationId: string) =>
  queryOptions({
    queryFn: () => getOrganizationAccessPermissions(organizationId),
    queryKey: organizationQueryKeys.access(organizationId),
    staleTime: 60_000,
  });
