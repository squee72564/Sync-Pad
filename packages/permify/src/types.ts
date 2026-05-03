import type {
  Tuple as PermifyTuple,
  Subject,
} from '@permify/permify-node/dist/src/grpc/generated/base/v1/base.js';

export type Tuple = PermifyTuple;
export type OrganizationPermission =
  | 'read'
  | 'manage'
  | 'invite'
  | 'create_workspace'
  | 'run_ai';

export type WorkspacePermission =
  | 'read'
  | 'comment'
  | 'write'
  | 'manage'
  | 'invite'
  | 'run_ai';

export const resourceDefinitions = {
  organization: {
    idKey: 'organizationId',
  },
  workspace: {
    idKey: 'workspaceId',
  },
} as const;

type ResourceDefinitions = typeof resourceDefinitions;

export type ResourceType = keyof ResourceDefinitions;

type ResourceIdKey<TType extends ResourceType> =
  ResourceDefinitions[TType]['idKey'];

export type ResourceDescriptorMap = {
  [TType in ResourceType]: {
    type: TType;
  } & Record<ResourceIdKey<TType>, string>;
};

export type OrganizationResource = ResourceDescriptorMap['organization'];
export type WorkspaceResource = ResourceDescriptorMap['workspace'];
export type ResourceDescriptor = ResourceDescriptorMap[ResourceType];

type ResourceBuilderMap = {
  [TType in ResourceType]: (id: string) => ResourceDescriptorMap[TType];
};

export const resources: ResourceBuilderMap = {
  organization: (organizationId) => ({
    type: 'organization',
    organizationId,
  }),
  workspace: (workspaceId) => ({
    type: 'workspace',
    workspaceId,
  }),
};

export const subjects = {
  user: (userId: string): Subject => ({
    type: 'user',
    id: userId,
    relation: '',
  }),
};
