export const resourceDefinitions = {
  organization: {
    idKey: 'organizationId',
    permissions: ['read', 'manage', 'invite', 'create_workspace', 'run_ai'],
  },
  workspace: {
    idKey: 'workspaceId',
    permissions: ['read', 'comment', 'write', 'manage', 'invite', 'run_ai'],
  },
  document: {
    idKey: 'documentId',
    permissions: ['read', 'comment', 'write', 'manage', 'invite', 'run_ai'],
  },
} as const;

type ResourceDefinitions = typeof resourceDefinitions;

export type ResourceType = keyof ResourceDefinitions;

export type PermissionFor<TType extends ResourceType> =
  ResourceDefinitions[TType]['permissions'][number];

export type PermissionsFor<TType extends ResourceType> =
  ResourceDefinitions[TType]['permissions'];

export type OrganizationPermission = PermissionFor<'organization'>;
export type WorkspacePermission = PermissionFor<'workspace'>;
export type DocumentPermission = PermissionFor<'document'>;

export type PermissionMap<TPermission extends string> = Record<
  TPermission,
  boolean
>;

export type PermissionMapFor<
  TType extends ResourceType,
  TValue = boolean,
> = Record<PermissionFor<TType>, TValue>;

export type ResourcePermissionMap<TValue = boolean> = {
  [TType in ResourceType]: PermissionMapFor<TType, TValue>;
};

export type ResourceAccess<TType extends ResourceType> = {
  permissions: PermissionMapFor<TType>;
};

type ResourceIdKey<TType extends ResourceType> =
  ResourceDefinitions[TType]['idKey'];

export type ResourceDescriptorMap = {
  [TType in ResourceType]: {
    type: TType;
  } & Record<ResourceIdKey<TType>, string>;
};

export type OrganizationResource = ResourceDescriptorMap['organization'];
export type WorkspaceResource = ResourceDescriptorMap['workspace'];
export type DocumentResource = ResourceDescriptorMap['document'];
export type ResourceDescriptor = ResourceDescriptorMap[ResourceType];
