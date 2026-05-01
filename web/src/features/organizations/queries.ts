import { queryOptions } from '@tanstack/react-query';

import { getOrganization, getOrganizations } from './api';

export const organizationQueryKeys = {
  all: ['organizations'] as const,
  list: () => [...organizationQueryKeys.all, 'list'] as const,
  detail: (organizationId: string) =>
    [...organizationQueryKeys.all, 'detail', organizationId] as const,
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
