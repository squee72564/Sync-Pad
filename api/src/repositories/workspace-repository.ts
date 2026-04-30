import { and, eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import {
  organization,
  organizationMembership,
  type WorkspaceRole,
  workspace,
  workspaceMembership,
} from '../db/schema/core.js';

type DatabaseExecutor = Pick<
  typeof db,
  'query' | 'insert' | 'update' | 'delete' | 'select'
>;

export const workspaceRepository = {
  findById(workspaceId: string, database: DatabaseExecutor = db) {
    return database.query.workspace.findFirst({
      where: eq(workspace.id, workspaceId),
    });
  },

  findMembership(
    workspaceId: string,
    userId: string,
    database: DatabaseExecutor = db,
  ) {
    return database.query.workspaceMembership.findFirst({
      where: and(
        eq(workspaceMembership.workspaceId, workspaceId),
        eq(workspaceMembership.userId, userId),
      ),
    });
  },

  async listByOrganizationReadableToUser(
    organizationId: string,
    userId: string,
    options?: {
      includeAll?: boolean;
    },
    database: DatabaseExecutor = db,
  ) {
    if (options?.includeAll) {
      return database.query.workspace.findMany({
        where: eq(workspace.organizationId, organizationId),
      });
    }

    return database
      .select({
        workspace,
      })
      .from(workspaceMembership)
      .innerJoin(workspace, eq(workspaceMembership.workspaceId, workspace.id))
      .where(
        and(
          eq(workspaceMembership.organizationId, organizationId),
          eq(workspaceMembership.userId, userId),
        ),
      )
      .then((rows) => rows.map((row) => row.workspace));
  },

  async listReadableToUser(userId: string, database: DatabaseExecutor = db) {
    return database
      .select({
        id: workspace.id,
        name: workspace.name,
        organizationId: workspace.organizationId,
        organizationName: organization.name,
        workspaceRole: workspaceMembership.workspaceRole,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt,
      })
      .from(workspaceMembership)
      .innerJoin(workspace, eq(workspaceMembership.workspaceId, workspace.id))
      .innerJoin(organization, eq(workspace.organizationId, organization.id))
      .innerJoin(
        organizationMembership,
        and(
          eq(workspaceMembership.userId, organizationMembership.userId),
          eq(
            workspaceMembership.organizationId,
            organizationMembership.organizationId,
          ),
        ),
      )
      .where(
        and(
          eq(workspaceMembership.userId, userId),
          eq(organizationMembership.status, 'active'),
        ),
      );
  },

  listMemberships(workspaceId: string, database: DatabaseExecutor = db) {
    return database.query.workspaceMembership.findMany({
      where: eq(workspaceMembership.workspaceId, workspaceId),
    });
  },

  listMembershipsByOrganizationAndUser(
    organizationId: string,
    userId: string,
    database: DatabaseExecutor = db,
  ) {
    return database.query.workspaceMembership.findMany({
      where: and(
        eq(workspaceMembership.organizationId, organizationId),
        eq(workspaceMembership.userId, userId),
      ),
    });
  },

  async insertWorkspace(
    values: {
      id: string;
      name: string;
      organizationId: string;
    },
    database: DatabaseExecutor = db,
  ) {
    const [created] = await database
      .insert(workspace)
      .values(values)
      .returning();
    return created;
  },

  async updateWorkspace(
    workspaceId: string,
    values: {
      name?: string;
      organizationId?: string;
    },
    database: DatabaseExecutor = db,
  ) {
    const [updated] = await database
      .update(workspace)
      .set(values)
      .where(eq(workspace.id, workspaceId))
      .returning();
    return updated ?? null;
  },

  async deleteWorkspace(workspaceId: string, database: DatabaseExecutor = db) {
    const [deleted] = await database
      .delete(workspace)
      .where(eq(workspace.id, workspaceId))
      .returning();
    return deleted ?? null;
  },

  async insertMembership(
    values: {
      userId: string;
      workspaceId: string;
      organizationId: string;
      workspaceRole: WorkspaceRole;
    },
    database: DatabaseExecutor = db,
  ) {
    const [created] = await database
      .insert(workspaceMembership)
      .values(values)
      .returning();
    return created;
  },

  async updateMembership(
    workspaceId: string,
    userId: string,
    values: {
      workspaceRole?: WorkspaceRole;
    },
    database: DatabaseExecutor = db,
  ) {
    const [updated] = await database
      .update(workspaceMembership)
      .set(values)
      .where(
        and(
          eq(workspaceMembership.workspaceId, workspaceId),
          eq(workspaceMembership.userId, userId),
        ),
      )
      .returning();
    return updated ?? null;
  },

  async deleteMembership(
    workspaceId: string,
    userId: string,
    database: DatabaseExecutor = db,
  ) {
    const [deleted] = await database
      .delete(workspaceMembership)
      .where(
        and(
          eq(workspaceMembership.workspaceId, workspaceId),
          eq(workspaceMembership.userId, userId),
        ),
      )
      .returning();
    return deleted ?? null;
  },

  async deleteMembershipsByOrganizationAndUser(
    organizationId: string,
    userId: string,
    database: DatabaseExecutor = db,
  ) {
    return database
      .delete(workspaceMembership)
      .where(
        and(
          eq(workspaceMembership.organizationId, organizationId),
          eq(workspaceMembership.userId, userId),
        ),
      )
      .returning();
  },
};
