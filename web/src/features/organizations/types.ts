export type OrganizationRole = 'owner' | 'admin' | 'member' | 'guest';

export type Organization = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationsResponse = {
  organizations: Organization[];
};
