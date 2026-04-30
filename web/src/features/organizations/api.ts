import { apiGet } from '#/lib/api/client';
import type { OrganizationsResponse } from './types';

export function getOrganizations() {
  return apiGet<OrganizationsResponse>('/api/organizations');
}
