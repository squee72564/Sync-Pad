export type OrganizationRole = 'owner' | 'admin' | 'member' | 'guest';

export type Organization = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrganizationInput = {
  name: string;
};

export type CreateOrganizationResponse = {
  organization: Organization;
};

export type OrganizationResponse = {
  organization: Organization;
};

export type OrganizationsResponse = {
  organizations: Organization[];
};
