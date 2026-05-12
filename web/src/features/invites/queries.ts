import { queryOptions } from '@tanstack/react-query';

import { getOrganizationInvitePreview, getOrganizationInvites } from './api';
import type { OrganizationInviteSearch } from './types';

export const inviteQueryKeys = {
  all: ['invites'] as const,
  lists: () => [...inviteQueryKeys.all, 'list'] as const,
  byOrganizationRoot: (organizationId: string) =>
    [...inviteQueryKeys.lists(), 'byOrganization', organizationId] as const,
  byOrganization: (
    organizationId: string,
    search: OrganizationInviteSearch = {},
  ) => [...inviteQueryKeys.byOrganizationRoot(organizationId), search] as const,
  previews: () => [...inviteQueryKeys.all, 'preview'] as const,
  preview: (organizationId: string, token: string) =>
    [...inviteQueryKeys.previews(), organizationId, token] as const,
};

export const organizationInvitesQuery = (
  organizationId: string,
  search: OrganizationInviteSearch,
) =>
  queryOptions({
    queryFn: () => getOrganizationInvites(organizationId, search),
    queryKey: inviteQueryKeys.byOrganization(organizationId, search),
    staleTime: 60_000,
  });

export const organizationInvitePreviewQuery = (
  organizationId: string,
  token: string,
) =>
  queryOptions({
    queryFn: () => getOrganizationInvitePreview({ organizationId, token }),
    queryKey: inviteQueryKeys.preview(organizationId, token),
    staleTime: 60_000,
  });
