import type {
  DbClient,
  DocumentRepository,
  NewDocument,
  WorkspaceRepository,
} from '@syncpad/db';
import { CoreError } from '@syncpad/errors';
import {
  type AccessGraphSync,
  type DocumentPermission,
  type PermissionChecker,
  resources,
  subjects,
  toDocumentParentTuple,
} from '@syncpad/permify';

import { syncOrThrow } from '../utils/index.js';

export type DocumentServiceDeps = {
  documentRepo: DocumentRepository;
  workspaceRepo: WorkspaceRepository;
  accessGraphSync: AccessGraphSync;
  permissionChecker: PermissionChecker;
  db: DbClient;
};

type ActorId = { actorUserId: string };
type DocumentId = { documentId: string };
type WorkspaceId = { workspaceId: string };

type CreateDocumentInput = Pick<NewDocument, 'title' | 'color'>;
type UpdateDocumentInput = Partial<Pick<NewDocument, 'title' | 'color'>>;

const createDocumentNotFoundError = (documentId: string) =>
  new CoreError({
    code: 'DOCUMENT_NOT_FOUND',
    expose: true,
    kind: 'not_found',
    message: `Document ${documentId} was not found`,
    userMessage: 'Document not found.',
  });

const createWorkspaceNotFoundError = (workspaceId: string) =>
  new CoreError({
    code: 'WORKSPACE_NOT_FOUND',
    expose: true,
    kind: 'not_found',
    message: `Workspace ${workspaceId} was not found`,
    userMessage: 'Workspace not found.',
  });

const createDocumentAccessDeniedError = (
  documentId: string,
  permission: DocumentPermission,
) =>
  new CoreError({
    code: 'DOCUMENT_PERMISSION_DENIED',
    expose: true,
    kind: 'forbidden',
    message: `Permission ${permission} denied for document ${documentId}`,
    userMessage: 'You do not have access to this document.',
  });

export function createDocumentService(deps: DocumentServiceDeps) {
  const {
    documentRepo,
    workspaceRepo,
    accessGraphSync,
    permissionChecker,
    db,
  } = deps;

  const checkDocumentPermission = (
    actorUserId: string,
    documentId: string,
    permission: DocumentPermission,
  ) =>
    permissionChecker.checkPermission(
      subjects.user(actorUserId),
      resources.document(documentId),
      permission,
    );

  const ensureDocumentPermission = async (
    actorUserId: string,
    documentId: string,
    permission: DocumentPermission,
  ) => {
    const allowed = await checkDocumentPermission(
      actorUserId,
      documentId,
      permission,
    );

    if (!allowed) {
      throw createDocumentAccessDeniedError(documentId, permission);
    }
  };

  return {
    findById(documentId: string) {
      return documentRepo.findById(documentId);
    },

    async findInWorkspace(
      input: WorkspaceId & DocumentId & { includeDeleted?: boolean },
    ) {
      return documentRepo.findInWorkspace(input.workspaceId, input.documentId, {
        includeDeleted: input.includeDeleted,
      });
    },

    listReadableToUser(input: ActorId) {
      return documentRepo.listReadableToUser(input.actorUserId);
    },

    async listByWorkspaceReadableToUser(input: ActorId & WorkspaceId) {
      const includeAll = await permissionChecker.checkPermission(
        subjects.user(input.actorUserId),
        resources.workspace(input.workspaceId),
        'manage',
      );

      return documentRepo.listByWorkspaceReadableToUser(
        input.workspaceId,
        input.actorUserId,
        { includeAll },
      );
    },

    async getReadableDocument(input: ActorId & DocumentId) {
      const document = await documentRepo.findById(input.documentId);

      if (!document) {
        return null;
      }

      await ensureDocumentPermission(
        input.actorUserId,
        input.documentId,
        'read',
      );

      return document;
    },

    async createDocument(
      input: ActorId &
        WorkspaceId & {
          input: CreateDocumentInput;
        },
    ) {
      await permissionChecker
        .checkPermission(
          subjects.user(input.actorUserId),
          resources.workspace(input.workspaceId),
          'write',
        )
        .then((allowed) => {
          if (!allowed) {
            throw new CoreError({
              code: 'WORKSPACE_PERMISSION_DENIED',
              expose: true,
              kind: 'forbidden',
              message: `Permission write denied for workspace ${input.workspaceId}`,
              userMessage: 'You do not have access to create documents here.',
            });
          }
        });

      return db.transaction(async (tx) => {
        const workspace = await workspaceRepo.findById(input.workspaceId, tx);

        if (!workspace) {
          throw createWorkspaceNotFoundError(input.workspaceId);
        }

        const createdDocument = await documentRepo.insertDocument(
          {
            id: crypto.randomUUID(),
            workspaceId: input.workspaceId,
            title: input.input.title,
            color: input.input.color,
          },
          tx,
        );

        await documentRepo.insertDocumentState(
          {
            documentId: createdDocument.id,
          },
          tx,
        );

        await syncOrThrow(accessGraphSync, {
          type: 'write',
          tuples: toDocumentParentTuple(createdDocument),
        });

        return createdDocument;
      });
    },

    async updateDocument(
      input: ActorId &
        DocumentId & {
          data: UpdateDocumentInput;
        },
    ) {
      const existing = await documentRepo.findById(input.documentId);

      if (!existing) {
        throw createDocumentNotFoundError(input.documentId);
      }

      await ensureDocumentPermission(
        input.actorUserId,
        input.documentId,
        'write',
      );

      return documentRepo.updateDocument(input.documentId, input.data);
    },

    async softDeleteDocument(input: ActorId & DocumentId) {
      const existing = await documentRepo.findById(input.documentId);

      if (!existing) {
        throw createDocumentNotFoundError(input.documentId);
      }

      await ensureDocumentPermission(
        input.actorUserId,
        input.documentId,
        'manage',
      );

      return documentRepo.softDeleteDocument(input.documentId);
    },

    async restoreDocument(input: ActorId & DocumentId) {
      const existing = await documentRepo.findById(input.documentId, {
        includeDeleted: true,
      });

      if (!existing) {
        throw createDocumentNotFoundError(input.documentId);
      }

      await ensureDocumentPermission(
        input.actorUserId,
        input.documentId,
        'manage',
      );

      return documentRepo.restoreDocument(input.documentId);
    },

    async deleteDocument(input: ActorId & DocumentId) {
      return db.transaction(async (tx) => {
        const existing = await documentRepo.findById(
          input.documentId,
          { includeDeleted: true },
          tx,
        );

        if (!existing) {
          throw createDocumentNotFoundError(input.documentId);
        }

        await ensureDocumentPermission(
          input.actorUserId,
          input.documentId,
          'manage',
        );

        const deleted = await documentRepo.deleteDocument(input.documentId, tx);

        if (!deleted) {
          throw createDocumentNotFoundError(input.documentId);
        }

        await syncOrThrow(accessGraphSync, {
          type: 'delete',
          tuples: toDocumentParentTuple(existing),
        });

        return deleted;
      });
    },

    async getDocumentState(input: ActorId & DocumentId) {
      const document = await documentRepo.findById(input.documentId);

      if (!document) {
        throw createDocumentNotFoundError(input.documentId);
      }

      await ensureDocumentPermission(
        input.actorUserId,
        input.documentId,
        'read',
      );

      const state = await documentRepo.findStateByDocumentId(input.documentId);

      if (state) {
        return state;
      }

      return documentRepo.insertDocumentState({
        documentId: input.documentId,
      });
    },

    async saveDocumentState(
      input: ActorId &
        DocumentId & {
          yjsState: Buffer;
        },
    ) {
      const document = await documentRepo.findById(input.documentId);

      if (!document) {
        throw createDocumentNotFoundError(input.documentId);
      }

      await ensureDocumentPermission(
        input.actorUserId,
        input.documentId,
        'write',
      );

      return documentRepo.upsertDocumentState({
        documentId: input.documentId,
        yjsState: input.yjsState,
      });
    },
  };
}

export type DocumentService = ReturnType<typeof createDocumentService>;
