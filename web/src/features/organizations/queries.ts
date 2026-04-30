import { queryOptions } from '@tanstack/react-query';

import { getOrganizations } from './api';

export const organizationQueryKeys = {
  all: ['organizations'] as const,
  list: () => [...organizationQueryKeys.all, 'list'] as const,
};

export const organizationsQuery = () =>
  queryOptions({
    queryFn: getOrganizations,
    queryKey: organizationQueryKeys.list(),
    staleTime: 60_000,
  });
