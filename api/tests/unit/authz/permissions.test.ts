import { resourceDefinitions, resources, subjects } from '@syncpad/permify';
import { describe, expect, it } from 'vitest';

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

  it('builds user subjects with the Permify entity type', () => {
    expect(subjects.user('user_1')).toEqual({
      type: 'user',
      id: 'user_1',
      relation: '',
    });
  });
});
