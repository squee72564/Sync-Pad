import { and, eq, isNull } from 'drizzle-orm';

import type { DbClient } from '../client.js';
import { withDbError } from '../errors.js';
import {
  document,
  documentState,
  organizationMembership,
  workspace,
  workspaceMembership,
} from '../schema/core.js';
import type { NewDocument, NewDocumentState } from '../types.js';

type DatabaseExecutor = Pick<
  DbClient,
  'query' | 'insert' | 'update' | 'delete' | 'select'
>;

type ListDocumentsOptions = {
  includeDeleted?: boolean;
};

type InsertDocumentValues = Pick<
  NewDocument,
  'id' | 'workspaceId' | 'title' | 'color'
>;
type UpdateDocumentValues = Partial<
  Pick<NewDocument, 'title' | 'color' | 'deletedAt'>
>;
type InsertDocumentStateValues = Pick<
  NewDocumentState,
  'documentId' | 'yjsState'
>;
type UpdateDocumentStateValues = Pick<NewDocumentState, 'yjsState'> &
  Partial<Pick<NewDocumentState, 'persistedAt'>>;
type UpsertDocumentStateValues = Pick<
  NewDocumentState,
  'documentId' | 'yjsState'
> &
  Partial<Pick<NewDocumentState, 'persistedAt'>>;

const maybeExcludeDeleted = (includeDeleted: boolean | undefined) =>
  includeDeleted ? undefined : isNull(document.deletedAt);

export function createDocumentRepository(db: DbClient) {
  return {
    findById(
      documentId: string,
      options?: ListDocumentsOptions,
      database: DatabaseExecutor = db,
    ) {
      return withDbError({ entity: 'document', operation: 'findById' }, () =>
        database.query.document.findFirst({
          where: and(
            eq(document.id, documentId),
            maybeExcludeDeleted(options?.includeDeleted),
          ),
        }),
      );
    },

    findInWorkspace(
      workspaceId: string,
      documentId: string,
      options?: ListDocumentsOptions,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'document', operation: 'findInWorkspace' },
        () =>
          database.query.document.findFirst({
            where: and(
              eq(document.id, documentId),
              eq(document.workspaceId, workspaceId),
              maybeExcludeDeleted(options?.includeDeleted),
            ),
          }),
      );
    },

    async findByIdReadableToUser(
      documentId: string,
      userId: string,
      options?: ListDocumentsOptions,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'document', operation: 'findByIdReadableToUser' },
        async () => {
          const [row] = await database
            .select({
              document,
            })
            .from(document)
            .innerJoin(workspace, eq(document.workspaceId, workspace.id))
            .innerJoin(
              workspaceMembership,
              eq(workspaceMembership.workspaceId, workspace.id),
            )
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
                eq(document.id, documentId),
                eq(workspaceMembership.userId, userId),
                eq(organizationMembership.status, 'active'),
                maybeExcludeDeleted(options?.includeDeleted),
              ),
            );

          return row?.document ?? null;
        },
      );
    },

    listByWorkspace(
      workspaceId: string,
      options?: ListDocumentsOptions,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'document', operation: 'listByWorkspace' },
        () =>
          database.query.document.findMany({
            where: and(
              eq(document.workspaceId, workspaceId),
              maybeExcludeDeleted(options?.includeDeleted),
            ),
          }),
      );
    },

    async listByWorkspaceReadableToUser(
      workspaceId: string,
      userId: string,
      options?: ListDocumentsOptions & {
        includeAll?: boolean;
      },
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'document', operation: 'listByWorkspaceReadableToUser' },
        async () => {
          if (options?.includeAll) {
            return database.query.document.findMany({
              where: and(
                eq(document.workspaceId, workspaceId),
                maybeExcludeDeleted(options.includeDeleted),
              ),
            });
          }

          return database
            .select({
              document,
            })
            .from(document)
            .innerJoin(workspace, eq(document.workspaceId, workspace.id))
            .innerJoin(
              workspaceMembership,
              eq(workspaceMembership.workspaceId, workspace.id),
            )
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
                eq(document.workspaceId, workspaceId),
                eq(workspaceMembership.userId, userId),
                eq(organizationMembership.status, 'active'),
                maybeExcludeDeleted(options?.includeDeleted),
              ),
            )
            .then((rows) => rows.map((row) => row.document));
        },
      );
    },

    async listReadableToUser(
      userId: string,
      options?: ListDocumentsOptions,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'document', operation: 'listReadableToUser' },
        () =>
          database
            .select({
              id: document.id,
              workspaceId: document.workspaceId,
              workspaceName: workspace.name,
              organizationId: workspace.organizationId,
              title: document.title,
              color: document.color,
              createdAt: document.createdAt,
              updatedAt: document.updatedAt,
              deletedAt: document.deletedAt,
            })
            .from(document)
            .innerJoin(workspace, eq(document.workspaceId, workspace.id))
            .innerJoin(
              workspaceMembership,
              eq(workspaceMembership.workspaceId, workspace.id),
            )
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
                maybeExcludeDeleted(options?.includeDeleted),
              ),
            ),
      );
    },

    async insertDocument(
      values: InsertDocumentValues,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'document', operation: 'insertDocument' },
        async () => {
          const [created] = await database
            .insert(document)
            .values(values)
            .returning();
          return created;
        },
      );
    },

    async updateDocument(
      documentId: string,
      values: UpdateDocumentValues,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'document', operation: 'updateDocument' },
        async () => {
          const [updated] = await database
            .update(document)
            .set(values)
            .where(eq(document.id, documentId))
            .returning();
          return updated ?? null;
        },
      );
    },

    async softDeleteDocument(
      documentId: string,
      deletedAt: Date = new Date(),
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'document', operation: 'softDeleteDocument' },
        async () => {
          const [deleted] = await database
            .update(document)
            .set({ deletedAt })
            .where(eq(document.id, documentId))
            .returning();
          return deleted ?? null;
        },
      );
    },

    async restoreDocument(documentId: string, database: DatabaseExecutor = db) {
      return withDbError(
        { entity: 'document', operation: 'restoreDocument' },
        async () => {
          const [restored] = await database
            .update(document)
            .set({ deletedAt: null })
            .where(eq(document.id, documentId))
            .returning();
          return restored ?? null;
        },
      );
    },

    async deleteDocument(documentId: string, database: DatabaseExecutor = db) {
      return withDbError(
        { entity: 'document', operation: 'deleteDocument' },
        async () => {
          const [deleted] = await database
            .delete(document)
            .where(eq(document.id, documentId))
            .returning();
          return deleted ?? null;
        },
      );
    },

    findStateByDocumentId(documentId: string, database: DatabaseExecutor = db) {
      return withDbError(
        { entity: 'documentState', operation: 'findStateByDocumentId' },
        () =>
          database.query.documentState.findFirst({
            where: eq(documentState.documentId, documentId),
          }),
      );
    },

    async insertDocumentState(
      values: InsertDocumentStateValues,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'documentState', operation: 'insertDocumentState' },
        async () => {
          const [created] = await database
            .insert(documentState)
            .values(values)
            .returning();
          return created;
        },
      );
    },

    async updateDocumentState(
      documentId: string,
      values: UpdateDocumentStateValues,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'documentState', operation: 'updateDocumentState' },
        async () => {
          const [updated] = await database
            .update(documentState)
            .set({
              yjsState: values.yjsState,
              persistedAt: values.persistedAt ?? new Date(),
            })
            .where(eq(documentState.documentId, documentId))
            .returning();
          return updated ?? null;
        },
      );
    },

    async upsertDocumentState(
      values: UpsertDocumentStateValues,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'documentState', operation: 'upsertDocumentState' },
        async () => {
          const [upserted] = await database
            .insert(documentState)
            .values({
              documentId: values.documentId,
              yjsState: values.yjsState,
              persistedAt: values.persistedAt ?? new Date(),
            })
            .onConflictDoUpdate({
              target: documentState.documentId,
              set: {
                yjsState: values.yjsState,
                persistedAt: values.persistedAt ?? new Date(),
              },
            })
            .returning();
          return upserted;
        },
      );
    },

    async deleteDocumentState(
      documentId: string,
      database: DatabaseExecutor = db,
    ) {
      return withDbError(
        { entity: 'documentState', operation: 'deleteDocumentState' },
        async () => {
          const [deleted] = await database
            .delete(documentState)
            .where(eq(documentState.documentId, documentId))
            .returning();
          return deleted ?? null;
        },
      );
    },
  };
}

export type DocumentRepository = ReturnType<typeof createDocumentRepository>;
