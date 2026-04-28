import type {
  OrganizationMembershipRecord,
  WorkspaceMembershipRecord,
  WorkspaceRecord,
} from '../types/api.js';
import { deleteTuples, writeTuples } from './permify-client.js';

type TupleInput = Parameters<typeof writeTuples>[0] extends infer T ? T : never;

export type AccessGraphOperation =
  | { type: 'write'; tuples: TupleInput }
  | { type: 'delete'; tuples: TupleInput };

export type AccessGraphSync = {
  apply: (
    operation: AccessGraphOperation | AccessGraphOperation[],
  ) => Promise<void>;
};

const createUserSubject = (userId: string) => ({
  type: 'user',
  id: userId,
});

export const toOrganizationMembershipTuple = (
  membership: OrganizationMembershipRecord,
) => ({
  entity: {
    type: 'organization',
    id: membership.organizationId,
  },
  relation: membership.organizationRole,
  subject: createUserSubject(membership.userId),
});

export const toWorkspaceMembershipTuple = (
  membership: WorkspaceMembershipRecord,
) => ({
  entity: {
    type: 'workspace',
    id: membership.workspaceId,
  },
  relation: membership.workspaceRole,
  subject: createUserSubject(membership.userId),
});

export const toWorkspaceParentTuple = (record: WorkspaceRecord) => ({
  entity: {
    type: 'workspace',
    id: record.id,
  },
  relation: 'organization',
  subject: {
    type: 'organization',
    id: record.organizationId,
  },
});

export const permifyAccessGraphSync: AccessGraphSync = {
  async apply(operation) {
    const operations = Array.isArray(operation) ? operation : [operation];

    try {
      for (const current of operations) {
        if (current.type === 'write') {
          await writeTuples(current.tuples);
          continue;
        }

        await deleteTuples(current.tuples);
      }
    } catch (error) {
      const appError =
        error instanceof Error ? error : new Error('Permify sync failed');
      appError.name = 'PermifySyncError';
      throw appError;
    }
  },
};
