import type { Tuple } from '@permify/permify-node/dist/src/grpc/generated/base/v1/base.js';
import type {
  Document,
  OrganizationMembership,
  Workspace,
  WorkspaceMembership,
} from '@syncpad/types';
import type { PermissionChecker } from './index.js';
import { subjects } from './types.js';

export const PERMIFY_RELATIONS = {
  documentParent: 'parent',
  workspaceParent: 'parent',
} as const;

export type AccessGraphOperation =
  | { type: 'write'; tuples: Tuple }
  | { type: 'delete'; tuples: Tuple };

export interface AccessGraphSync {
  apply: (
    operation: AccessGraphOperation | AccessGraphOperation[],
  ) => Promise<void>;
}

export const toOrganizationMembershipTuple = (
  membership: OrganizationMembership,
): Tuple => ({
  entity: {
    type: 'organization',
    id: membership.organizationId,
  },
  relation: membership.organizationRole,
  subject: subjects.user(membership.userId),
});

export const toWorkspaceMembershipTuple = (
  membership: WorkspaceMembership,
): Tuple => ({
  entity: {
    type: 'workspace',
    id: membership.workspaceId,
  },
  relation: membership.workspaceRole,
  subject: subjects.user(membership.userId),
});

export const toWorkspaceParentTuple = (record: Workspace): Tuple => ({
  entity: {
    type: 'workspace',
    id: record.id,
  },
  relation: PERMIFY_RELATIONS.workspaceParent,
  subject: {
    type: 'organization',
    id: record.organizationId,
    relation: '',
  },
});

export const toDocumentParentTuple = (record: Document): Tuple => ({
  entity: {
    type: 'document',
    id: record.id,
  },
  relation: PERMIFY_RELATIONS.documentParent,
  subject: {
    type: 'workspace',
    id: record.workspaceId,
    relation: '',
  },
});

export function createPermifyAccessGraphSync(
  permissionChecker: PermissionChecker,
): AccessGraphSync {
  return {
    async apply(operation) {
      const operations = Array.isArray(operation) ? operation : [operation];

      for (const current of operations) {
        if (current.type === 'write') {
          await permissionChecker.writeTuples(current.tuples);
          continue;
        }

        await permissionChecker.deleteTuples(current.tuples);
      }
    },
  };
}
