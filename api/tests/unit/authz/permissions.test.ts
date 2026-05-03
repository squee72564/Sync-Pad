import {
  type PermissionFor,
  resourceDefinitions,
  resources,
  subjects,
} from '@syncpad/permify';
import { describe, expect, it } from 'vitest';

const organizationPermission: PermissionFor<'organization'> = 'invite';
const workspacePermission: PermissionFor<'workspace'> = 'write';
// @ts-expect-error workspace-only permissions are not valid organization permissions.
const invalidOrganizationPermission: PermissionFor<'organization'> = 'write';
// @ts-expect-error organization-only permissions are not valid workspace permissions.
const invalidWorkspacePermission: PermissionFor<'workspace'> =
  'create_workspace';

void organizationPermission;
void workspacePermission;
void invalidOrganizationPermission;
void invalidWorkspacePermission;

describe('authz resource builders', () => {
  it('builds organization descriptors with explicit organization ids', () => {
    expect(resources.organization('org_1')).toEqual({
      type: 'organization',
      organizationId: 'org_1',
    });
  });

  it('builds workspace descriptors with explicit workspace ids', () => {
    expect(resources.workspace('ws_1')).toEqual({
      type: 'workspace',
      workspaceId: 'ws_1',
    });
  });

  it('keeps registry id keys aligned with current descriptor fields', () => {
    expect(resourceDefinitions.organization.idKey).toBe('organizationId');
    expect(resourceDefinitions.workspace.idKey).toBe('workspaceId');
  });

  it('keeps registry permissions aligned with current schema permissions', () => {
    expect(resourceDefinitions.organization.permissions).toEqual([
      'read',
      'manage',
      'invite',
      'create_workspace',
      'run_ai',
    ]);
    expect(resourceDefinitions.workspace.permissions).toEqual([
      'read',
      'comment',
      'write',
      'manage',
      'invite',
      'run_ai',
    ]);
  });

  it('builds user subjects with the Permify entity type', () => {
    expect(subjects.user('user_1')).toEqual({
      type: 'user',
      id: 'user_1',
      relation: '',
    });
  });
});
