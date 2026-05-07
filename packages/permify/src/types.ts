import type {
  Tuple as PermifyTuple,
  Subject,
} from '@permify/permify-node/dist/src/grpc/generated/base/v1/base.js';
import type {
  PermissionFor,
  ResourceDescriptorMap,
  ResourceType,
} from '@syncpad/types';

export {
  type DocumentPermission,
  type DocumentResource,
  type OrganizationPermission,
  type OrganizationResource,
  type PermissionFor,
  type PermissionMap,
  type PermissionMapFor,
  type PermissionsFor,
  type ResourceAccess,
  type ResourceDescriptor,
  type ResourceDescriptorMap,
  type ResourcePermissionMap,
  type ResourceType,
  resourceDefinitions,
  type WorkspacePermission,
  type WorkspaceResource,
} from '@syncpad/types';

export type Tuple = PermifyTuple;

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
  document: (documentId) => ({
    type: 'document',
    documentId,
  }),
};

export const subjects = {
  user: (userId: string): Subject => ({
    type: 'user',
    id: userId,
    relation: '',
  }),
};
