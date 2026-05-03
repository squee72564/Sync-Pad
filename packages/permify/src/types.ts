import type {
  Tuple as PermifyTuple,
  Subject,
} from '@permify/permify-node/dist/src/grpc/generated/base/v1/base.js';

export type Tuple = PermifyTuple;
export const resourceDefinitions = {
  organization: {
    idKey: 'organizationId',
    permissions: ['read', 'manage', 'invite', 'create_workspace', 'run_ai'],
  },
  workspace: {
    idKey: 'workspaceId',
    permissions: ['read', 'comment', 'write', 'manage', 'invite', 'run_ai'],
  },
} as const;

type ResourceDefinitions = typeof resourceDefinitions;

export type ResourceType = keyof ResourceDefinitions;

export type PermissionFor<TType extends ResourceType> =
  ResourceDefinitions[TType]['permissions'][number];

export type OrganizationPermission = PermissionFor<'organization'>;
export type WorkspacePermission = PermissionFor<'workspace'>;

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

export type PermissionCheckItem<TType extends ResourceType = ResourceType> = {
  [TCurrentType in TType]: {
    subject: Subject;
    resource: ResourceDescriptorMap[TCurrentType];
    permission: PermissionFor<TCurrentType>;
  };
}[TType];

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
