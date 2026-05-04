import type {
  Organization as _Organization,
  OrganizationRole as _OrganizationRole,
  NewOrganization,
} from '@syncpad/types';

export type Organization = _Organization;
export type OrganizationRole = _OrganizationRole;

export type CreateOrganizationInput = Omit<
  NewOrganization,
  'id' | 'createdAt' | 'updatedAt'
>;

export type CreateOrganizationResponse = {
  organization: Organization;
};

export type OrganizationResponse = {
  organization: Organization;
};

export type OrganizationsResponse = {
  organizations: Organization[];
};
